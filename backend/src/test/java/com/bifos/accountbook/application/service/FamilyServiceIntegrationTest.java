package com.bifos.accountbook.application.service;

import com.bifos.accountbook.application.dto.family.CreateFamilyRequest;
import com.bifos.accountbook.application.dto.family.FamilyResponse;
import com.bifos.accountbook.domain.entity.Category;
import com.bifos.accountbook.domain.entity.User;
import com.bifos.accountbook.domain.repository.CategoryRepository;
import com.bifos.accountbook.domain.repository.FamilyRepository;
import com.bifos.accountbook.domain.repository.UserRepository;
import com.bifos.accountbook.domain.value.CustomUuid;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * FamilyService 통합 테스트
 * 실제 데이터베이스와 함께 동작하며, 가족 생성 시 기본 카테고리가 정상적으로 생성되는지 검증합니다.
 */
@SpringBootTest
@Transactional // 각 테스트 후 자동 롤백
@DisplayName("FamilyService 통합 테스트")
class FamilyServiceIntegrationTest {

    @Autowired
    private FamilyService familyService;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private FamilyRepository familyRepository;

    @Autowired
    private CategoryRepository categoryRepository;

    private User testUser;

    @BeforeEach
    void setUp() {
        // 테스트 사용자 생성
        testUser = User.builder()
                .email("integration-test@example.com")
                .name("통합테스트 사용자")
                .provider("google")
                .providerId("integration-test-provider-id")
                .build();
        testUser = userRepository.save(testUser);
    }

    @Test
    @DisplayName("가족 생성 시 기본 카테고리 10개가 자동으로 생성되어야 한다")
    void createFamily_ShouldCreateDefaultCategories() {
        // Given
        CreateFamilyRequest request = new CreateFamilyRequest("통합테스트 가족");

        // When
        FamilyResponse family = familyService.createFamily(testUser.getUuid(), request);

        // Then
        // 1. 가족이 정상적으로 생성되었는지 확인
        assertThat(family).isNotNull();
        assertThat(family.getName()).isEqualTo("통합테스트 가족");

        // 2. 실제 데이터베이스에서 카테고리 조회
        CustomUuid familyUuid = CustomUuid.from(family.getUuid());
        List<Category> categories = categoryRepository.findAllByFamilyUuid(familyUuid);

        // 3. 기본 카테고리가 10개 생성되었는지 확인
        assertThat(categories).hasSize(10);

        // 4. 각 카테고리의 이름과 속성 검증
        List<String> categoryNames = categories.stream()
                .map(Category::getName)
                .toList();

        assertThat(categoryNames).containsExactlyInAnyOrder(
                "식비", "카페", "간식", "생활비", "교통비",
                "쇼핑", "의료", "문화생활", "교육", "기타");

        // 5. 각 카테고리가 올바른 가족에 속해있는지 확인
        categories.forEach(category -> {
            assertThat(category.getFamilyUuid()).isEqualTo(familyUuid);
            assertThat(category.getColor()).isNotBlank();
            assertThat(category.getIcon()).isNotBlank();
            assertThat(category.getDeletedAt()).isNull();
        });
    }

    @Test
    @DisplayName("가족 생성 시 각 카테고리가 올바른 색상과 아이콘을 가져야 한다")
    void createFamily_ShouldCreateCategoriesWithCorrectColorsAndIcons() {
        // Given
        CreateFamilyRequest request = new CreateFamilyRequest("카테고리 속성 테스트 가족");

        // When
        FamilyResponse family = familyService.createFamily(testUser.getUuid(), request);

        // Then
        CustomUuid familyUuid = CustomUuid.from(family.getUuid());
        List<Category> categories = categoryRepository.findAllByFamilyUuid(familyUuid);

        // 특정 카테고리의 색상과 아이콘 검증
        Category foodCategory = categories.stream()
                .filter(c -> "식비".equals(c.getName()))
                .findFirst()
                .orElseThrow();
        assertThat(foodCategory.getColor()).isEqualTo("#ef4444");
        assertThat(foodCategory.getIcon()).isEqualTo("🍚");

        Category cafeCategory = categories.stream()
                .filter(c -> "카페".equals(c.getName()))
                .findFirst()
                .orElseThrow();
        assertThat(cafeCategory.getColor()).isEqualTo("#f59e0b");
        assertThat(cafeCategory.getIcon()).isEqualTo("☕");

        Category transportCategory = categories.stream()
                .filter(c -> "교통비".equals(c.getName()))
                .findFirst()
                .orElseThrow();
        assertThat(transportCategory.getColor()).isEqualTo("#3b82f6");
        assertThat(transportCategory.getIcon()).isEqualTo("🚗");
    }

    @Test
    @DisplayName("여러 가족을 생성해도 각각 독립적인 카테고리를 가져야 한다")
    void createMultipleFamilies_ShouldHaveIndependentCategories() {
        // Given
        CreateFamilyRequest request1 = new CreateFamilyRequest("첫 번째 가족");
        CreateFamilyRequest request2 = new CreateFamilyRequest("두 번째 가족");

        // When
        FamilyResponse family1 = familyService.createFamily(testUser.getUuid(), request1);
        FamilyResponse family2 = familyService.createFamily(testUser.getUuid(), request2);

        // Then
        CustomUuid family1Uuid = CustomUuid.from(family1.getUuid());
        CustomUuid family2Uuid = CustomUuid.from(family2.getUuid());

        List<Category> family1Categories = categoryRepository.findAllByFamilyUuid(family1Uuid);
        List<Category> family2Categories = categoryRepository.findAllByFamilyUuid(family2Uuid);

        // 각 가족이 독립적으로 10개의 카테고리를 가져야 함
        assertThat(family1Categories).hasSize(10);
        assertThat(family2Categories).hasSize(10);

        // 두 가족의 카테고리 UUID는 서로 달라야 함
        List<String> family1CategoryUuids = family1Categories.stream()
                .map(c -> c.getUuid().getValue())
                .toList();
        List<String> family2CategoryUuids = family2Categories.stream()
                .map(c -> c.getUuid().getValue())
                .toList();

        assertThat(family1CategoryUuids).doesNotContainAnyElementsOf(family2CategoryUuids);
    }

    @Test
    @DisplayName("가족 생성 후 기본 카테고리를 수정하거나 삭제할 수 있어야 한다")
    void createFamily_DefaultCategoriesShouldBeModifiable() {
        // Given
        CreateFamilyRequest request = new CreateFamilyRequest("수정 가능성 테스트 가족");

        // When
        FamilyResponse family = familyService.createFamily(testUser.getUuid(), request);

        // Then
        CustomUuid familyUuid = CustomUuid.from(family.getUuid());
        List<Category> categories = categoryRepository.findAllByFamilyUuid(familyUuid);

        // 카테고리 수정 테스트
        Category firstCategory = categories.get(0);
        firstCategory.setName("수정된 카테고리");
        firstCategory.setColor("#000000");
        categoryRepository.save(firstCategory);

        // 수정 확인
        Category updatedCategory = categoryRepository.findByUuid(firstCategory.getUuid())
                .orElseThrow();
        assertThat(updatedCategory.getName()).isEqualTo("수정된 카테고리");
        assertThat(updatedCategory.getColor()).isEqualTo("#000000");

        // 여전히 10개의 카테고리가 있어야 함
        List<Category> updatedCategories = categoryRepository.findAllByFamilyUuid(familyUuid);
        assertThat(updatedCategories).hasSize(10);
    }
}
