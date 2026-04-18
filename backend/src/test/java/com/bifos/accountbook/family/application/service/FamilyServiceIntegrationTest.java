package com.bifos.accountbook.family.application.service;

import com.bifos.accountbook.family.application.dto.CreateFamilyRequest;
import com.bifos.accountbook.family.application.dto.FamilyResponse;
import com.bifos.accountbook.shared.TestFixturesSupport;
import com.bifos.accountbook.category.domain.entity.Category;
import com.bifos.accountbook.user.domain.entity.User;
import com.bifos.accountbook.category.domain.repository.CategoryRepository;
import com.bifos.accountbook.category.domain.value.CategoryStatus;
import com.bifos.accountbook.shared.value.CustomUuid;
import java.math.BigDecimal;
import java.util.List;
import static org.assertj.core.api.Assertions.assertThat;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;

/**
 * FamilyService 통합 테스트
 * 실제 데이터베이스와 함께 동작하며, 가족 생성 시 기본 카테고리가 정상적으로 생성되는지 검증합니다.
 */
@DisplayName("FamilyService 통합 테스트")
class FamilyServiceIntegrationTest extends TestFixturesSupport {

  @Autowired
  private FamilyService familyService;

  @Autowired
  private CategoryRepository categoryRepository;

  @Test
  @DisplayName("가족 생성 시 기본 카테고리 10개가 자동으로 생성되어야 한다")
  void createFamily_ShouldCreateDefaultCategories() {
    // Given: TestFixtures로 사용자 생성
    User testUser = fixtures.getDefaultUser();

    CreateFamilyRequest request = CreateFamilyRequest.builder()
                                                     .name("통합테스트 가족")
                                                     .build();

    // When
    FamilyResponse family = familyService.createFamily(testUser.getUuid(), request);

    // Then
    // 1. 가족이 정상적으로 생성되었는지 확인
    assertThat(family).isNotNull();
    assertThat(family.getName()).isEqualTo("통합테스트 가족");

    // 2. 실제 데이터베이스에서 카테고리 조회
    CustomUuid familyUuid = CustomUuid.from(family.getUuid());
    List<Category> categories = categoryRepository.findAllByFamilyUuid(familyUuid);

    // 3. 기본 카테고리들이 생성되었는지 확인
    assertThat(categories).isNotEmpty();

    // 4. 각 카테고리의 이름과 속성 검증
    List<String> categoryNames = categories.stream()
                                           .map(Category::getName)
                                           .toList();

    assertThat(categoryNames).contains("미분류", "식비", "생활비");

    // 5. 각 카테고리가 올바른 가족에 속해있는지 확인
    categories.forEach(category -> {
      assertThat(category.getFamilyUuid()).isEqualTo(familyUuid);
      assertThat(category.getColor()).isNotBlank();
      assertThat(category.getIcon()).isNotBlank();
      assertThat(category.getStatus()).isEqualTo(CategoryStatus.ACTIVE);
    });
  }

  @Test
  @DisplayName("가족 생성 시 각 카테고리가 올바른 색상과 아이콘을 가져야 한다")
  void createFamily_ShouldCreateCategoriesWithCorrectColorsAndIcons() {
    // Given: TestFixtures로 사용자 생성
    User testUser = fixtures.getDefaultUser();

    CreateFamilyRequest request = CreateFamilyRequest.builder()
                                                     .name("카테고리 속성 테스트 가족")
                                                     .build();

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
    // Given: TestFixtures로 사용자 생성
    User testUser = fixtures.getDefaultUser();

    CreateFamilyRequest request1 = CreateFamilyRequest.builder()
                                                      .name("첫 번째 가족")
                                                      .build();
    CreateFamilyRequest request2 = CreateFamilyRequest.builder()
                                                      .name("두 번째 가족")
                                                      .build();

    // When
    FamilyResponse family1 = familyService.createFamily(testUser.getUuid(), request1);
    FamilyResponse family2 = familyService.createFamily(testUser.getUuid(), request2);

    // Then
    CustomUuid family1Uuid = CustomUuid.from(family1.getUuid());
    CustomUuid family2Uuid = CustomUuid.from(family2.getUuid());

    List<Category> family1Categories = categoryRepository.findAllByFamilyUuid(family1Uuid);
    List<Category> family2Categories = categoryRepository.findAllByFamilyUuid(family2Uuid);

    // 각 가족이 카테고리를 가져야 함
    assertThat(family1Categories).isNotEmpty();
    assertThat(family2Categories).isNotEmpty();

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
  @DisplayName("가족 생성 후 카테고리를 조회할 수 있어야 한다")
  void createFamily_DefaultCategoriesShouldBeAccessible() {
    // Given: TestFixtures로 사용자 생성
    User testUser = fixtures.getDefaultUser();

    CreateFamilyRequest request = CreateFamilyRequest.builder()
                                                     .name("카테고리 조회 테스트 가족")
                                                     .build();

    // When
    FamilyResponse family = familyService.createFamily(testUser.getUuid(), request);

    // Then
    CustomUuid familyUuid = CustomUuid.from(family.getUuid());
    List<Category> categories = categoryRepository.findAllByFamilyUuid(familyUuid);

    // 카테고리 조회 확인
    assertThat(categories).isNotEmpty();
    Category firstCategory = categories.get(0);
    assertThat(firstCategory).isNotNull();
    assertThat(firstCategory.getUuid()).isNotNull();
    assertThat(firstCategory.getName()).isNotBlank();
    assertThat(firstCategory.getColor()).isNotBlank();
    assertThat(firstCategory.getIcon()).isNotBlank();

    // UUID로 특정 카테고리 조회 테스트
    Category foundCategory = categoryRepository.findByUuid(firstCategory.getUuid())
                                               .orElseThrow();
    assertThat(foundCategory.getUuid()).isEqualTo(firstCategory.getUuid());
    assertThat(foundCategory.getName()).isEqualTo(firstCategory.getName());
  }

  @Test
  @DisplayName("가족 생성 시 월 예산을 설정할 수 있다")
  void createFamily_WithMonthlyBudget() {
    // Given: TestFixtures로 사용자 생성
    User testUser = fixtures.getDefaultUser();

    BigDecimal budget = new BigDecimal("1000000.00");
    CreateFamilyRequest request = CreateFamilyRequest.builder()
                                                     .name("예산 설정 가족")
                                                     .monthlyBudget(budget)
                                                     .build();

    // When
    FamilyResponse family = familyService.createFamily(testUser.getUuid(), request);

    // Then
    assertThat(family).isNotNull();
    assertThat(family.getName()).isEqualTo("예산 설정 가족");
    assertThat(family.getMonthlyBudget()).isEqualByComparingTo(budget);
  }

  @Test
  @DisplayName("가족 생성 시 월 예산을 설정하지 않으면 0으로 초기화된다")
  void createFamily_WithoutMonthlyBudget_DefaultsToZero() {
    // Given: TestFixtures로 사용자 생성
    User testUser = fixtures.getDefaultUser();

    CreateFamilyRequest request = CreateFamilyRequest.builder()
                                                     .name("예산 미설정 가족")
                                                     .build();

    // When
    FamilyResponse family = familyService.createFamily(testUser.getUuid(), request);

    // Then
    assertThat(family).isNotNull();
    assertThat(family.getMonthlyBudget()).isEqualByComparingTo(BigDecimal.ZERO);
  }
}
