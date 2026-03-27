package com.bifos.accountbook.application.service;

import com.bifos.accountbook.application.dto.category.CategoryResponse;
import com.bifos.accountbook.application.dto.category.CreateCategoryRequest;
import com.bifos.accountbook.application.dto.category.UpdateCategoryRequest;
import com.bifos.accountbook.common.TestFixturesSupport;
import com.bifos.accountbook.config.CacheConfig;
import com.bifos.accountbook.domain.entity.Category;
import com.bifos.accountbook.domain.entity.Family;
import com.bifos.accountbook.domain.entity.User;
import com.bifos.accountbook.domain.value.CustomUuid;
import java.util.List;
import static org.assertj.core.api.Assertions.assertThat;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.cache.CacheManager;

/**
 * CategoryService 캐시 동작 검증 테스트
 *
 * 검증 항목:
 * 1. 조회 시 캐시 적용 확인
 * 2. 생성 시 캐시 무효화 확인
 * 3. 수정 시 캐시 무효화 확인
 * 4. 삭제 시 캐시 무효화 확인
 * 5. findByUuidCached 메서드의 캐시 활용 확인
 * 6. 메서드 간 캐시 재사용 확인
 */
@DisplayName("카테고리 서비스 캐시 테스트")
class CategoryServiceCacheTest extends TestFixturesSupport {

  @Autowired
  private CategoryService categoryService;

  @Autowired
  private CacheManager cacheManager;

  @BeforeEach
  void clearCacheBeforeTest() {
    // 캐시 초기화
    cacheManager.getCache(CacheConfig.CATEGORIES_CACHE).clear();
  }

  @Test
  @DisplayName("카테고리 조회 시 캐시가 적용된다")
  void getCategoriesWithCache() {
    // Given: TestFixtures로 데이터 생성
    User testUser = fixtures.getDefaultUser();
    Family testFamily = fixtures.getDefaultFamily();
    Category category = fixtures.categories.category(testFamily)
                                           .name("Test Category")
                                           .color("#ff0000")
                                           .icon("🍎")
                                           .build();

    CustomUuid familyUuid = testFamily.getUuid();
    String familyUuidStr = familyUuid.getValue();

    // When: 첫 번째 조회 (DB에서 조회)
    List<CategoryResponse> firstCall = categoryService.getFamilyCategories(testUser.getUuid(),
                                                                           familyUuid);

    // Then: 캐시에 저장되어 있어야 함
    var cache = cacheManager.getCache(CacheConfig.CATEGORIES_CACHE);
    assertThat(cache).isNotNull();
    assertThat(cache.get(familyUuidStr)).isNotNull();

    // When: 두 번째 조회 (캐시에서 조회)
    List<CategoryResponse> secondCall = categoryService.getFamilyCategories(testUser.getUuid(),
                                                                            familyUuid);

    // Then: 동일한 결과 반환
    assertThat(firstCall).hasSize(1);
    assertThat(secondCall).hasSize(1);
    assertThat(firstCall.getFirst().getUuid()).isEqualTo(secondCall.getFirst().getUuid());
  }

  @Test
  @DisplayName("카테고리 생성 시 캐시가 무효화된다")
  void createCategoryClearsCache() {
    // Given: TestFixtures로 데이터 생성 + 캐시 준비
    User testUser = fixtures.getDefaultUser();
    Family testFamily = fixtures.getDefaultFamily();
    CustomUuid familyUuid = testFamily.getUuid();
    String familyUuidStr = familyUuid.getValue();

    categoryService.getFamilyCategories(testUser.getUuid(), familyUuid);

    var cache = cacheManager.getCache(CacheConfig.CATEGORIES_CACHE);
    assertThat(cache.get(familyUuidStr)).isNotNull();

    // When: 카테고리 생성
    CreateCategoryRequest request = new CreateCategoryRequest(
        "New Category",
        "#00ff00",
        "🍏",
        null
    );
    categoryService.createCategory(testUser.getUuid(), familyUuid, request);

    // Then: 캐시가 무효화됨
    assertThat(cache.get(familyUuidStr)).isNull();
  }

  @Test
  @DisplayName("카테고리 수정 시 캐시가 무효화된다")
  void updateCategoryClearsCache() {
    // Given: TestFixtures로 데이터 생성 + 캐시 준비
    User testUser = fixtures.getDefaultUser();
    Family testFamily = fixtures.getDefaultFamily();
    Category category = fixtures.categories.category(testFamily)
                                           .name("Original Category")
                                           .color("#ff0000")
                                           .icon("🍎")
                                           .build();

    CustomUuid familyUuid = testFamily.getUuid();
    String familyUuidStr = familyUuid.getValue();
    categoryService.getFamilyCategories(testUser.getUuid(), familyUuid);

    var cache = cacheManager.getCache(CacheConfig.CATEGORIES_CACHE);
    assertThat(cache.get(familyUuidStr)).isNotNull();

    // When: 카테고리 수정
    UpdateCategoryRequest request = new UpdateCategoryRequest(
        "Updated Category",
        null,
        null,
        null
    );
    categoryService.updateCategory(testUser.getUuid(), familyUuid, category.getUuid().getValue(), request);

    // Then: 캐시가 무효화됨
    assertThat(cache.get(familyUuidStr)).isNull();
  }

  @Test
  @DisplayName("카테고리 삭제 시 캐시가 무효화된다")
  void deleteCategoryClearsCache() {
    // Given: TestFixtures로 데이터 생성 + 캐시 준비
    User testUser = fixtures.getDefaultUser();
    Family testFamily = fixtures.getDefaultFamily();
    Category category = fixtures.categories.category(testFamily)
                                           .name("To Delete Category")
                                           .color("#ff0000")
                                           .icon("🍎")
                                           .build();

    CustomUuid familyUuid = testFamily.getUuid();
    String familyUuidStr = familyUuid.getValue();
    categoryService.getFamilyCategories(testUser.getUuid(), familyUuid);

    var cache = cacheManager.getCache(CacheConfig.CATEGORIES_CACHE);
    assertThat(cache.get(familyUuidStr)).isNotNull();

    // When: 카테고리 삭제
    categoryService.deleteCategory(testUser.getUuid(), familyUuid, category.getUuid().getValue());

    // Then: 캐시가 무효화됨
    assertThat(cache.get(familyUuidStr)).isNull();
  }

  @Test
  @DisplayName("기본 카테고리 생성 시 캐시가 무효화된다")
  void createDefaultCategoriesClearsCache() {
    // Given: TestFixtures로 새 가족 생성 + 캐시 준비
    User testUser = fixtures.getDefaultUser();
    Family newFamily = fixtures.families.family()
                                        .name("New Family")
                                        .owner(testUser)
                                        .build();

    CustomUuid newFamilyUuid = newFamily.getUuid();
    String newFamilyUuidStr = newFamilyUuid.getValue();
    categoryService.getFamilyCategories(testUser.getUuid(), newFamilyUuid);

    var cache = cacheManager.getCache(CacheConfig.CATEGORIES_CACHE);
    assertThat(cache.get(newFamilyUuidStr)).isNotNull();

    // When: 기본 카테고리 생성
    categoryService.createDefaultCategoriesForFamily(newFamily.getUuid());

    // Then: 캐시가 무효화됨
    assertThat(cache.get(newFamilyUuidStr)).isNull();
  }

  @Test
  @DisplayName("findByUuidCached는 캐시를 활용하여 조회한다")
  void findByUuidCachedUsesCache() {
    // Given: TestFixtures로 두 개의 카테고리 생성
    Family testFamily = fixtures.getDefaultFamily();
    Category category1 = fixtures.categories.category(testFamily)
                                            .name("Category 1")
                                            .color("#ff0000")
                                            .icon("🍎")
                                            .build();

    Category category2 = fixtures.categories.category(testFamily)
                                            .name("Category 2")
                                            .color("#00ff00")
                                            .icon("🍏")
                                            .build();

    CustomUuid familyUuid = testFamily.getUuid();
    String familyUuidStr = familyUuid.getValue();
    com.bifos.accountbook.domain.value.CustomUuid category1Uuid = category1.getUuid();
    com.bifos.accountbook.domain.value.CustomUuid category2Uuid = category2.getUuid();
    var cache = cacheManager.getCache(CacheConfig.CATEGORIES_CACHE);

    // When: findByUuidCached로 첫 번째 카테고리 조회
    CategoryResponse result1 = categoryService.findByUuidCached(familyUuid, category1Uuid);

    // Then: 캐시에 가족의 전체 카테고리가 저장되어야 함
    assertThat(cache.get(familyUuidStr)).isNotNull();
    assertThat(result1).isNotNull();
    assertThat(result1.getName()).isEqualTo("Category 1");

    // When: 같은 가족의 다른 카테고리를 findByUuidCached로 조회
    CategoryResponse result2 = categoryService.findByUuidCached(familyUuid, category2Uuid);

    // Then: 캐시에서 조회되어야 함 (추가 DB 조회 없이)
    assertThat(result2).isNotNull();
    assertThat(result2.getName()).isEqualTo("Category 2");
    assertThat(cache.get(familyUuidStr)).isNotNull();
  }

  @Test
  @DisplayName("findByUuidCached로 조회 후 getFamilyCategories 호출 시 캐시가 재사용된다")
  void cachedCategoryIsReusedAcrossMethods() {
    // Given: TestFixtures로 데이터 생성
    User testUser = fixtures.getDefaultUser();
    Family testFamily = fixtures.getDefaultFamily();
    Category category = fixtures.categories.category(testFamily)
                                           .name("Test Category")
                                           .color("#ff0000")
                                           .icon("🍎")
                                           .build();

    CustomUuid familyUuid = testFamily.getUuid();
    String familyUuidStr = familyUuid.getValue();
    CustomUuid categoryUuid = category.getUuid();
    var cache = cacheManager.getCache(CacheConfig.CATEGORIES_CACHE);

    // When: findByUuidCached로 조회 (캐시 생성)
    categoryService.findByUuidCached(familyUuid, categoryUuid);

    // Then: 캐시가 생성되어 있어야 함
    assertThat(cache.get(familyUuidStr)).isNotNull();

    // When: getFamilyCategories로 조회 (캐시 재사용)
    List<CategoryResponse> categories = categoryService.getFamilyCategories(
        testUser.getUuid(),
        familyUuid
    );

    // Then: 동일한 캐시를 사용하여 결과 반환
    assertThat(categories).hasSize(1);
    assertThat(categories.getFirst().getUuid()).isEqualTo(categoryUuid.getValue());
  }
}

