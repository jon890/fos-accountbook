package com.bifos.accountbook.application.service;

import com.bifos.accountbook.application.dto.category.CategoryResponse;
import com.bifos.accountbook.application.dto.category.CreateCategoryRequest;
import com.bifos.accountbook.application.dto.category.UpdateCategoryRequest;
import com.bifos.accountbook.common.DatabaseCleanupExtension;
import com.bifos.accountbook.common.TestUserHolder;
import com.bifos.accountbook.config.CacheConfig;
import com.bifos.accountbook.domain.entity.Category;
import com.bifos.accountbook.domain.entity.Family;
import com.bifos.accountbook.domain.entity.FamilyMember;
import com.bifos.accountbook.domain.entity.User;
import com.bifos.accountbook.domain.repository.CategoryRepository;
import com.bifos.accountbook.domain.repository.FamilyMemberRepository;
import com.bifos.accountbook.domain.repository.FamilyRepository;
import com.bifos.accountbook.domain.value.CustomUuid;
import com.bifos.accountbook.domain.value.FamilyMemberStatus;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.junit.jupiter.api.extension.RegisterExtension;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.cache.CacheManager;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

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
 * 
 * 주의:
 * - TestUserHolder: 테스트 사용자 자동 생성 및 관리
 * - DatabaseCleanupExtension: 각 테스트 후 데이터 자동 정리
 */
@SpringBootTest
@ExtendWith(DatabaseCleanupExtension.class)
@DisplayName("카테고리 서비스 캐시 테스트")
class CategoryServiceCacheTest {

    @RegisterExtension
    TestUserHolder testUserHolder = new TestUserHolder();

    @Autowired
    private CategoryService categoryService;

    @Autowired
    private CategoryRepository categoryRepository;

    @Autowired
    private FamilyRepository familyRepository;

    @Autowired
    private FamilyMemberRepository familyMemberRepository;

    @Autowired
    private CacheManager cacheManager;

    private User testUser;
    private Family testFamily;

    @BeforeEach
    void setUp() {
        // 캐시 초기화
        cacheManager.getCache(CacheConfig.CATEGORIES_CACHE).clear();

        // TestUserHolder에서 생성된 사용자 가져오기
        testUser = testUserHolder.getUser();

        // 테스트 가족 생성
        testFamily = Family.builder()
                .name("Cache Test Family")
                .build();
        testFamily = familyRepository.save(testFamily);

        // 가족 구성원 추가
        FamilyMember member = FamilyMember.builder()
                .familyUuid(testFamily.getUuid())
                .userUuid(testUser.getUuid())
                .role("OWNER")
                .status(FamilyMemberStatus.ACTIVE)
                .build();
        familyMemberRepository.save(member);
    }

    @Test
    @DisplayName("카테고리 조회 시 캐시가 적용된다")
    void getCategoriesWithCache() {
        // Given: 카테고리 생성
        Category category = Category.builder()
                .familyUuid(testFamily.getUuid())
                .name("Test Category")
                .color("#ff0000")
                .icon("🍎")
                .build();
        categoryRepository.save(category);

        String familyUuidStr = testFamily.getUuid().getValue();

        // When: 첫 번째 조회 (DB에서 조회)
        List<CategoryResponse> firstCall = categoryService.getFamilyCategories(
                testUser.getUuid(),
                familyUuidStr
        );

        // Then: 캐시에 저장되어 있어야 함
        var cache = cacheManager.getCache(CacheConfig.CATEGORIES_CACHE);
        assertThat(cache).isNotNull();
        assertThat(cache.get(familyUuidStr)).isNotNull();

        // When: 두 번째 조회 (캐시에서 조회)
        List<CategoryResponse> secondCall = categoryService.getFamilyCategories(
                testUser.getUuid(),
                familyUuidStr
        );

        // Then: 동일한 결과 반환
        assertThat(firstCall).hasSize(1);
        assertThat(secondCall).hasSize(1);
        assertThat(firstCall.get(0).getUuid()).isEqualTo(secondCall.get(0).getUuid());
    }

    @Test
    @DisplayName("카테고리 생성 시 캐시가 무효화된다")
    void createCategoryClearsCache() {
        // Given: 캐시 데이터 생성
        String familyUuidStr = testFamily.getUuid().getValue();
        categoryService.getFamilyCategories(testUser.getUuid(), familyUuidStr);

        var cache = cacheManager.getCache(CacheConfig.CATEGORIES_CACHE);
        assertThat(cache.get(familyUuidStr)).isNotNull();

        // When: 카테고리 생성
        CreateCategoryRequest request = new CreateCategoryRequest(
                "New Category",
                "#00ff00",
                "🍏"
        );
        categoryService.createCategory(testUser.getUuid(), familyUuidStr, request);

        // Then: 캐시가 무효화됨
        assertThat(cache.get(familyUuidStr)).isNull();
    }

    @Test
    @DisplayName("카테고리 수정 시 캐시가 무효화된다")
    void updateCategoryClearsCache() {
        // Given: 카테고리 생성 및 캐시
        Category category = Category.builder()
                .familyUuid(testFamily.getUuid())
                .name("Original Category")
                .color("#ff0000")
                .icon("🍎")
                .build();
        category = categoryRepository.save(category);

        String familyUuidStr = testFamily.getUuid().getValue();
        categoryService.getFamilyCategories(testUser.getUuid(), familyUuidStr);

        var cache = cacheManager.getCache(CacheConfig.CATEGORIES_CACHE);
        assertThat(cache.get(familyUuidStr)).isNotNull();

        // When: 카테고리 수정
        UpdateCategoryRequest request = new UpdateCategoryRequest(
                "Updated Category",
                null,
                null
        );
        categoryService.updateCategory(testUser.getUuid(), category.getUuid().getValue(), request);

        // Then: 캐시가 무효화됨
        assertThat(cache.get(familyUuidStr)).isNull();
    }

    @Test
    @DisplayName("카테고리 삭제 시 캐시가 무효화된다")
    void deleteCategoryClearsCache() {
        // Given: 카테고리 생성 및 캐시
        Category category = Category.builder()
                .familyUuid(testFamily.getUuid())
                .name("To Delete Category")
                .color("#ff0000")
                .icon("🍎")
                .build();
        category = categoryRepository.save(category);

        String familyUuidStr = testFamily.getUuid().getValue();
        categoryService.getFamilyCategories(testUser.getUuid(), familyUuidStr);

        var cache = cacheManager.getCache(CacheConfig.CATEGORIES_CACHE);
        assertThat(cache.get(familyUuidStr)).isNotNull();

        // When: 카테고리 삭제
        categoryService.deleteCategory(testUser.getUuid(), category.getUuid().getValue());

        // Then: 캐시가 무효화됨
        assertThat(cache.get(familyUuidStr)).isNull();
    }

    @Test
    @DisplayName("기본 카테고리 생성 시 캐시가 무효화된다")
    void createDefaultCategoriesClearsCache() {
        // Given: 새로운 가족 생성 및 캐시
        Family newFamily = Family.builder()
                .name("New Family")
                .build();
        newFamily = familyRepository.save(newFamily);

        FamilyMember member = FamilyMember.builder()
                .familyUuid(newFamily.getUuid())
                .userUuid(testUser.getUuid())
                .role("OWNER")
                .status(FamilyMemberStatus.ACTIVE)
                .build();
        familyMemberRepository.save(member);

        String newFamilyUuidStr = newFamily.getUuid().getValue();
        categoryService.getFamilyCategories(testUser.getUuid(), newFamilyUuidStr);

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
        // Given: 두 개의 카테고리 생성
        Category category1 = Category.builder()
                .familyUuid(testFamily.getUuid())
                .name("Category 1")
                .color("#ff0000")
                .icon("🍎")
                .build();
        category1 = categoryRepository.save(category1);

        Category category2 = Category.builder()
                .familyUuid(testFamily.getUuid())
                .name("Category 2")
                .color("#00ff00")
                .icon("🍏")
                .build();
        category2 = categoryRepository.save(category2);

        String familyUuidStr = testFamily.getUuid().getValue();
        CustomUuid category1Uuid = category1.getUuid();
        CustomUuid category2Uuid = category2.getUuid();
        var cache = cacheManager.getCache(CacheConfig.CATEGORIES_CACHE);

        // When: findByUuidCached로 첫 번째 카테고리 조회
        CategoryResponse result1 = categoryService.findByUuidCached(familyUuidStr, category1Uuid);

        // Then: 캐시에 가족의 전체 카테고리가 저장되어야 함
        assertThat(cache.get(familyUuidStr)).isNotNull();
        assertThat(result1).isNotNull();
        assertThat(result1.getName()).isEqualTo("Category 1");

        // When: 같은 가족의 다른 카테고리를 findByUuidCached로 조회
        CategoryResponse result2 = categoryService.findByUuidCached(familyUuidStr, category2Uuid);

        // Then: 캐시에서 조회되어야 함 (추가 DB 조회 없이)
        assertThat(result2).isNotNull();
        assertThat(result2.getName()).isEqualTo("Category 2");
        assertThat(cache.get(familyUuidStr)).isNotNull();
    }

    @Test
    @DisplayName("findByUuidCached로 조회 후 getFamilyCategories 호출 시 캐시가 재사용된다")
    void cachedCategoryIsReusedAcrossMethods() {
        // Given: 카테고리 생성
        Category category = Category.builder()
                .familyUuid(testFamily.getUuid())
                .name("Test Category")
                .color("#ff0000")
                .icon("🍎")
                .build();
        category = categoryRepository.save(category);

        String familyUuidStr = testFamily.getUuid().getValue();
        CustomUuid categoryUuid = category.getUuid();
        var cache = cacheManager.getCache(CacheConfig.CATEGORIES_CACHE);

        // When: findByUuidCached로 조회 (캐시 생성)
        categoryService.findByUuidCached(familyUuidStr, categoryUuid);

        // Then: 캐시가 생성되어 있어야 함
        assertThat(cache.get(familyUuidStr)).isNotNull();

        // When: getFamilyCategories로 조회 (캐시 재사용)
        List<CategoryResponse> categories = categoryService.getFamilyCategories(
                testUser.getUuid(),
                familyUuidStr
        );

        // Then: 동일한 캐시를 사용하여 결과 반환
        assertThat(categories).hasSize(1);
        assertThat(categories.get(0).getUuid()).isEqualTo(categoryUuid.getValue());
    }
}

