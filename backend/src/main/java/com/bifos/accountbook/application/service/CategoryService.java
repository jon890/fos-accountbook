package com.bifos.accountbook.application.service;

import com.bifos.accountbook.application.dto.category.CategoryResponse;
import com.bifos.accountbook.application.dto.category.CreateCategoryRequest;
import com.bifos.accountbook.application.dto.category.UpdateCategoryRequest;
import com.bifos.accountbook.application.exception.BusinessException;
import com.bifos.accountbook.application.exception.ErrorCode;
import com.bifos.accountbook.config.CacheConfig;
import com.bifos.accountbook.domain.entity.Category;
import com.bifos.accountbook.domain.repository.CategoryRepository;
import com.bifos.accountbook.domain.value.CustomUuid;
import com.bifos.accountbook.presentation.annotation.FamilyUuid;
import com.bifos.accountbook.presentation.annotation.UserUuid;
import com.bifos.accountbook.presentation.annotation.ValidateFamilyAccess;
import java.util.Arrays;
import java.util.List;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cache.CacheManager;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Slf4j
@Service
@RequiredArgsConstructor
public class CategoryService {

  private final CategoryRepository categoryRepository;
  private final FamilyValidationService familyValidationService; // 가족 검증 로직
  private final CacheManager cacheManager; // 캐시 관리자

  /**
   * 카테고리 생성
   * <p>
   * 카테고리 생성 후 해당 가족의 캐시를 무효화하여 다음 조회 시 최신 데이터를 반환합니다.
   */
  @ValidateFamilyAccess
  @Transactional
  @CacheEvict(value = CacheConfig.CATEGORIES_CACHE, key = "#familyUuid.value")
  public CategoryResponse createCategory(@UserUuid CustomUuid userUuid,
                                         @FamilyUuid CustomUuid familyUuid,
                                         CreateCategoryRequest request) {

    // 중복 확인
    categoryRepository.findByFamilyUuidAndName(familyUuid, request.getName())
                      .ifPresent(c -> {
                        throw new BusinessException(ErrorCode.CATEGORY_ALREADY_EXISTS)
                            .addParameter("familyUuid", familyUuid.getValue())
                            .addParameter("categoryName", request.getName());
                      });

    // 카테고리 생성
    Category category = Category.builder()
                                .familyUuid(familyUuid)
                                .name(request.getName())
                                .color(request.getColor() != null ? request.getColor() : "#6366f1")
                                .icon(request.getIcon())
                                .excludeFromBudget(request.getExcludeFromBudget() != null && request.getExcludeFromBudget())
                                .build();

    category = categoryRepository.save(category);

    return CategoryResponse.from(category);
  }

  /**
   * 가족의 카테고리 목록 조회
   * <p>
   * Repository에서 Entity를 캐싱하므로, Service는 캐시된 Entity를 DTO로 변환만 수행합니다.
   * 이를 통해 다양한 Response 형태로 유연하게 변환할 수 있습니다.
   */
  @ValidateFamilyAccess
  @Transactional(readOnly = true)
  public List<CategoryResponse> getFamilyCategories(@UserUuid CustomUuid userUuid,
                                                    @FamilyUuid CustomUuid familyUuid) {
    // Repository에서 캐시된 Entity 조회
    List<Category> categories = categoryRepository.findAllByFamilyUuid(familyUuid);

    return categories.stream()
                     .map(CategoryResponse::from)
                     .toList();
  }

  /**
   * UUID로 단일 카테고리 조회 (캐시 활용)
   * <p>
   * Repository에서 캐시된 Entity를 조회한 후 UUID로 필터링합니다.
   * DB 조회 없이 순수하게 캐시만 활용하여 성능을 최적화합니다.
   *
   * @param familyUuid   가족 UUID (캐시 키)
   * @param categoryUuid 조회할 카테고리 UUID (필터링)
   * @return 카테고리 응답 (없으면 예외)
   */
  @Transactional(readOnly = true)
  public CategoryResponse findByUuidCached(CustomUuid familyUuid, CustomUuid categoryUuid) {
    // Repository에서 캐시된 Entity 조회
    List<Category> categories = categoryRepository.findAllByFamilyUuid(familyUuid);

    // UUID로 필터링하여 반환
    return categories.stream()
                     .filter(c -> c.getUuid().equals(categoryUuid))
                     .findFirst()
                     .map(CategoryResponse::from)
                     .orElseThrow(() -> new BusinessException(ErrorCode.CATEGORY_NOT_FOUND)
                         .addParameter("familyUuid", familyUuid.getValue())
                         .addParameter("categoryUuid", categoryUuid.getValue()));
  }

  /**
   * UUID로 단일 카테고리 조회 + 가족 소속 검증 (캐시 활용)
   * <p>
   * findByUuidCached()와 동일하지만, 조회한 카테고리가 해당 가족에 속하는지 추가 검증합니다.
   * ExpenseService, IncomeService에서 중복되는 검증 로직을 제거하기 위해 추가되었습니다.
   *
   * @param familyUuid   가족 UUID (캐시 키)
   * @param categoryUuid 조회할 카테고리 UUID (필터링)
   * @return 카테고리 응답 (없거나 가족에 속하지 않으면 예외)
   * @throws BusinessException 카테고리가 해당 가족에 속하지 않는 경우
   */
  @Transactional(readOnly = true)
  public CategoryResponse validateAndFindCached(CustomUuid familyUuid, CustomUuid categoryUuid) {
    CategoryResponse category = findByUuidCached(familyUuid, categoryUuid);

    // 카테고리가 해당 가족의 것인지 확인
    if (!category.getFamilyUuid().equals(familyUuid.getValue())) {
      throw new BusinessException(ErrorCode.ACCESS_DENIED, "해당 가족의 카테고리가 아닙니다")
          .addParameter("categoryFamilyUuid", category.getFamilyUuid())
          .addParameter("requestFamilyUuid", familyUuid.getValue());
    }

    return category;
  }

  /**
   * 가족의 카테고리 Entity 목록 조회 (캐시 활용)
   * <p>
   * Repository에서 캐시된 Entity를 직접 반환합니다.
   * IncomeService, ExpenseService에서 CategoryInfo 변환을 위해 사용됩니다.
   */
  @Transactional(readOnly = true)
  public List<Category> getFamilyCategoriesEntity(CustomUuid familyUuid) {
    return categoryRepository.findAllByFamilyUuid(familyUuid);
  }

  /**
   * 카테고리 상세 조회
   */
  @Transactional(readOnly = true)
  public CategoryResponse getCategory(CustomUuid userUuid, String categoryUuid) {
    CustomUuid categoryCustomUuid = CustomUuid.from(categoryUuid);

    Category category = categoryRepository.findActiveByUuid(categoryCustomUuid)
                                          .orElseThrow(() -> new BusinessException(ErrorCode.CATEGORY_NOT_FOUND)
                                              .addParameter("categoryUuid", categoryCustomUuid.getValue()));

    // 권한 확인
    familyValidationService.validateFamilyAccess(userUuid, category.getFamilyUuid());

    return CategoryResponse.from(category);
  }

  /**
   * 카테고리 수정
   * <p>
   * 카테고리 수정 후 해당 가족의 캐시를 무효화합니다.
   */
  @Transactional
  public CategoryResponse updateCategory(CustomUuid userUuid, String categoryUuid, UpdateCategoryRequest request) {
    CustomUuid categoryCustomUuid = CustomUuid.from(categoryUuid);

    Category category = categoryRepository.findActiveByUuid(categoryCustomUuid)
                                          .orElseThrow(() -> new BusinessException(ErrorCode.CATEGORY_NOT_FOUND)
                                              .addParameter("categoryUuid", categoryCustomUuid.getValue()));

    // 권한 확인
    familyValidationService.validateFamilyAccess(userUuid, category.getFamilyUuid());

    // 캐시 무효화를 위해 familyUuid 저장
    String familyUuidStr = category.getFamilyUuid().getValue();

    // 이름 변경 시 중복 확인
    if (request.getName() != null && !request.getName().equals(category.getName())) {
      categoryRepository.findByFamilyUuidAndName(category.getFamilyUuid(), request.getName())
                        .ifPresent(c -> {
                          throw new BusinessException(ErrorCode.CATEGORY_ALREADY_EXISTS)
                              .addParameter("familyUuid", familyUuidStr)
                              .addParameter("categoryName", request.getName());
                        });
      category.updateName(request.getName());
    }

    if (request.getColor() != null) {
      category.updateColor(request.getColor());
    }

    if (request.getIcon() != null) {
      category.updateIcon(request.getIcon());
    }

    // 예산 제외 플래그 업데이트
    if (request.getExcludeFromBudget() != null) {
      category.setExcludeFromBudget(request.getExcludeFromBudget());
    }

    // 캐시 무효화 (CacheManager를 직접 사용)
    evictFamilyCache(familyUuidStr);

    return CategoryResponse.from(category);
  }

  /**
   * 카테고리 삭제 (Soft Delete)
   * <p>
   * 카테고리 삭제 후 해당 가족의 캐시를 무효화합니다.
   */
  @Transactional
  public void deleteCategory(CustomUuid userUuid, String categoryUuid) {
    CustomUuid categoryCustomUuid = CustomUuid.from(categoryUuid);

    Category category = categoryRepository.findActiveByUuid(categoryCustomUuid)
                                          .orElseThrow(() -> new BusinessException(ErrorCode.CATEGORY_NOT_FOUND)
                                              .addParameter("categoryUuid", categoryCustomUuid.getValue()));

    // 권한 확인
    familyValidationService.validateFamilyAccess(userUuid, category.getFamilyUuid());

    // 캐시 무효화를 위해 familyUuid 저장
    String familyUuidStr = category.getFamilyUuid().getValue();

    category.delete();

    // 캐시 무효화 (CacheManager를 직접 사용)
    evictFamilyCache(familyUuidStr);

    log.info("Deleted category: {} by user: {}", categoryUuid, userUuid);
  }

  /**
   * 가족 생성 시 기본 카테고리 자동 생성
   * FamilyService에서 호출됨 (권한 검증 불필요 - 가족 생성 시점)
   * <p>
   * 기본 카테고리 생성 후 캐시를 무효화합니다.
   */
  @Transactional
  @CacheEvict(value = CacheConfig.CATEGORIES_CACHE, key = "#familyUuid.value")
  public void createDefaultCategoriesForFamily(CustomUuid familyUuid) {
    List<DefaultCategory> defaultCategories = Arrays.asList(
        new DefaultCategory("식비", "#ef4444", "🍚"),
        new DefaultCategory("카페", "#f59e0b", "☕"),
        new DefaultCategory("간식", "#ec4899", "🍰"),
        new DefaultCategory("생활비", "#10b981", "🏠"),
        new DefaultCategory("교통비", "#3b82f6", "🚗"),
        new DefaultCategory("쇼핑", "#8b5cf6", "🛍️"),
        new DefaultCategory("의료", "#06b6d4", "💊"),
        new DefaultCategory("문화생활", "#f43f5e", "🎬"),
        new DefaultCategory("교육", "#14b8a6", "📚"),
        new DefaultCategory("기타", "#6b7280", "📦"));

    for (DefaultCategory defaultCategory : defaultCategories) {
      Category category = Category.builder()
                                  .familyUuid(familyUuid)
                                  .name(defaultCategory.name)
                                  .color(defaultCategory.color)
                                  .icon(defaultCategory.icon)
                                  .build();

      categoryRepository.save(category);
    }
  }

  /**
   * 가족의 카테고리 캐시를 무효화하는 헬퍼 메서드
   * <p>
   * updateCategory와 deleteCategory에서 사용
   * <p>
   * CacheManager를 직접 사용하여 캐시를 무효화합니다.
   * 같은 클래스 내에서 @CacheEvict 메서드를 호출하면 프록시를 거치지 않아
   * 캐시 무효화가 동작하지 않기 때문에 CacheManager를 직접 사용합니다.
   */
  private void evictFamilyCache(String familyUuid) {
    var cache = cacheManager.getCache(CacheConfig.CATEGORIES_CACHE);
    if (cache != null) {
      cache.evict(familyUuid);
      log.debug("Evicted category cache for family: {}", familyUuid);
    }
  }

  /**
   * 기본 카테고리 정보를 담는 내부 클래스
   */
  private static class DefaultCategory {
    String name;
    String color;
    String icon;

    DefaultCategory(String name, String color, String icon) {
      this.name = name;
      this.color = color;
      this.icon = icon;
    }
  }
}
