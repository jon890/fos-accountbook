package com.bifos.accountbook.category.application.service;

import com.bifos.accountbook.shared.aop.FamilyValidationService;

import com.bifos.accountbook.category.application.dto.CategoryResponse;
import com.bifos.accountbook.category.application.dto.CreateCategoryRequest;
import com.bifos.accountbook.category.application.dto.UpdateCategoryRequest;
import com.bifos.accountbook.shared.exception.BusinessException;
import com.bifos.accountbook.shared.exception.ErrorCode;
import com.bifos.accountbook.config.CacheConfig;
import com.bifos.accountbook.category.domain.entity.Category;
import com.bifos.accountbook.category.domain.repository.CategoryRepository;
import com.bifos.accountbook.expense.application.service.ExpenseService;
import com.bifos.accountbook.recurring.application.service.RecurringExpenseService;
import com.bifos.accountbook.shared.value.CustomUuid;
import com.bifos.accountbook.shared.aop.FamilyUuid;
import com.bifos.accountbook.shared.aop.UserUuid;
import com.bifos.accountbook.shared.aop.ValidateFamilyAccess;
import java.util.Arrays;
import java.util.List;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.cache.CacheManager;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class CategoryService {

  private final CategoryRepository categoryRepository;
  private final ObjectProvider<ExpenseService> expenseServiceProvider;
  private final ObjectProvider<RecurringExpenseService> recurringExpenseServiceProvider;
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
  public List<Category> getFamilyCategoriesEntity(CustomUuid familyUuid) {
    return categoryRepository.findAllByFamilyUuid(familyUuid);
  }

  /**
   * 카테고리 상세 조회
   */
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
   * 카테고리가 속한 familyUuid 조회 (레거시 엔드포인트 하위호환용)
   */
  public CustomUuid resolveCategoryFamilyUuid(String categoryUuid) {
    return categoryRepository.findActiveByUuid(CustomUuid.from(categoryUuid))
                             .orElseThrow(() -> new BusinessException(ErrorCode.CATEGORY_NOT_FOUND)
                                 .addParameter("categoryUuid", categoryUuid))
                             .getFamilyUuid();
  }

  /**
   * 카테고리 수정
   * <p>
   * 카테고리 수정 후 해당 가족의 캐시를 무효화합니다.
   */
  @ValidateFamilyAccess
  @Transactional
  public CategoryResponse updateCategory(@UserUuid CustomUuid userUuid, @FamilyUuid CustomUuid familyUuid,
                                         String categoryUuid, UpdateCategoryRequest request) {
    CustomUuid categoryCustomUuid = CustomUuid.from(categoryUuid);

    Category category = categoryRepository.findActiveByUuid(categoryCustomUuid)
                                          .orElseThrow(() -> new BusinessException(ErrorCode.CATEGORY_NOT_FOUND)
                                              .addParameter("categoryUuid", categoryCustomUuid.getValue()));

    // 카테고리가 해당 가족에 속하는지 확인
    if (!category.getFamilyUuid().equals(familyUuid)) {
      throw new BusinessException(ErrorCode.ACCESS_DENIED)
          .addParameter("categoryUuid", categoryUuid);
    }

    // 캐시 무효화를 위해 familyUuid 저장
    final String familyUuidStr = familyUuid.getValue();

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
  @ValidateFamilyAccess
  @Transactional
  public void deleteCategory(@UserUuid CustomUuid userUuid, @FamilyUuid CustomUuid familyUuid, String categoryUuid) {
    CustomUuid categoryCustomUuid = CustomUuid.from(categoryUuid);

    Category category = categoryRepository.findActiveByUuid(categoryCustomUuid)
                                          .orElseThrow(() -> new BusinessException(ErrorCode.CATEGORY_NOT_FOUND)
                                              .addParameter("categoryUuid", categoryCustomUuid.getValue()));

    // 카테고리가 해당 가족에 속하는지 확인
    if (!category.getFamilyUuid().equals(familyUuid)) {
      throw new BusinessException(ErrorCode.ACCESS_DENIED)
          .addParameter("categoryUuid", categoryUuid);
    }

    // 캐시 무효화를 위해 familyUuid 저장
    final String familyUuidStr = familyUuid.getValue();

    // 기본 카테고리는 삭제 불가
    if (category.isDefault()) {
      throw new BusinessException(ErrorCode.CANNOT_DELETE_DEFAULT_CATEGORY)
          .addParameter("categoryUuid", categoryUuid);
    }

    // 삭제되는 카테고리의 지출들을 기본 카테고리로 이동 (ExpenseService에 위임)
    expenseServiceProvider.getObject().moveExpensesToDefaultCategory(category.getFamilyUuid(), category.getUuid());

    // 삭제되는 카테고리의 반복 지출도 기본 카테고리로 이동
    recurringExpenseServiceProvider.getObject()
        .moveRecurringExpensesToDefaultCategory(category.getFamilyUuid(), category.getUuid());

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
        new DefaultCategory("미분류", "#9ca3af", "📂", true),
        new DefaultCategory("식비", "#ef4444", "🍚", false),
        new DefaultCategory("카페", "#f59e0b", "☕", false),
        new DefaultCategory("간식", "#ec4899", "🍰", false),
        new DefaultCategory("생활비", "#10b981", "🏠", false),
        new DefaultCategory("교통비", "#3b82f6", "🚗", false),
        new DefaultCategory("쇼핑", "#8b5cf6", "🛍️", false),
        new DefaultCategory("의료", "#06b6d4", "💊", false),
        new DefaultCategory("문화생활", "#f43f5e", "🎬", false),
        new DefaultCategory("교육", "#14b8a6", "📚", false),
        new DefaultCategory("기타", "#6b7280", "📦", false));

    for (DefaultCategory defaultCategory : defaultCategories) {
      Category category = Category.builder()
                                  .familyUuid(familyUuid)
                                  .name(defaultCategory.name)
                                  .color(defaultCategory.color)
                                  .icon(defaultCategory.icon)
                                  .isDefault(defaultCategory.isDefault)
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
    boolean isDefault;

    DefaultCategory(String name, String color, String icon, boolean isDefault) {
      this.name = name;
      this.color = color;
      this.icon = icon;
      this.isDefault = isDefault;
    }
  }
}
