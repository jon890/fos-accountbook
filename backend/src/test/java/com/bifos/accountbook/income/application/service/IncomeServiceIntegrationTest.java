package com.bifos.accountbook.income.application.service;

import com.bifos.accountbook.income.application.service.IncomeService;
import com.bifos.accountbook.family.application.service.FamilyService;

import com.bifos.accountbook.family.application.dto.CreateFamilyRequest;
import com.bifos.accountbook.family.application.dto.FamilyResponse;
import com.bifos.accountbook.income.application.dto.IncomeResponse;
import com.bifos.accountbook.income.application.dto.IncomeSearchRequest;
import com.bifos.accountbook.shared.TestFixturesSupport;
import com.bifos.accountbook.category.domain.entity.Category;
import com.bifos.accountbook.family.domain.entity.Family;
import com.bifos.accountbook.user.domain.entity.User;
import com.bifos.accountbook.category.domain.repository.CategoryRepository;
import com.bifos.accountbook.family.domain.repository.FamilyRepository;
import com.bifos.accountbook.shared.value.CustomUuid;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import static org.assertj.core.api.Assertions.assertThat;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;

/**
 * IncomeService 통합 테스트
 * - QueryDSL 동적 쿼리 필터링 검증
 * - 카테고리 정보 포함 응답 검증
 * - 페이징 및 정렬 검증
 */
@DisplayName("IncomeService 통합 테스트")
class IncomeServiceIntegrationTest extends TestFixturesSupport {

  @Autowired
  private IncomeService incomeService;

  @Autowired
  private FamilyService familyService;

  @Autowired
  private FamilyRepository familyRepository;

  @Autowired
  private CategoryRepository categoryRepository;

  private User testUser;
  private Family testFamily;
  private Category salaryCategory;
  private Category bonusCategory;
  private Category sideJobCategory;

  @BeforeEach
  void setUp() {

    // 테스트 데이터 생성
    testUser = fixtures.getDefaultUser();

    // FamilyService를 통해 가족 생성 (기본 카테고리 자동 생성)
    FamilyResponse familyResponse = familyService.createFamily(testUser.getUuid(),
                                                               CreateFamilyRequest.builder()
                                                                                  .name("Test Family")
                                                                                  .monthlyBudget(BigDecimal.ZERO)
                                                                                  .build());
    testFamily = familyRepository.findByUuid(CustomUuid.from(familyResponse.getUuid()))
                                 .orElseThrow();

    // 테스트용 수입 카테고리 생성
    salaryCategory = fixtures.categories.category(testFamily)
                                        .name("월급")
                                        .color("#4ade80")
                                        .icon("💰")
                                        .build();

    bonusCategory = fixtures.categories.category(testFamily)
                                       .name("보너스")
                                       .color("#fbbf24")
                                       .icon("🎁")
                                       .build();

    sideJobCategory = fixtures.categories.category(testFamily)
                                         .name("부업")
                                         .color("#60a5fa")
                                         .icon("💼")
                                         .build();

    // 테스트 수입 데이터 생성
    createTestIncomes();
  }

  private void createTestIncomes() {
    // TestFixtures를 사용하여 5개의 테스트 수입 데이터 생성
    // 2025-01-15 - 월급 3000000원
    fixtures.incomes.income(testFamily, salaryCategory)
                    .amount(BigDecimal.valueOf(3000000))
                    .description("1월 월급")
                    .date(LocalDateTime.of(2025, 1, 15, 9, 0))
                    .build();

    // 2025-01-20 - 부업 500000원
    fixtures.incomes.income(testFamily, sideJobCategory)
                    .amount(BigDecimal.valueOf(500000))
                    .description("프리랜서 수입")
                    .date(LocalDateTime.of(2025, 1, 20, 14, 0))
                    .build();

    // 2025-01-25 - 보너스 1000000원
    fixtures.incomes.income(testFamily, bonusCategory)
                    .amount(BigDecimal.valueOf(1000000))
                    .description("설날 보너스")
                    .date(LocalDateTime.of(2025, 1, 25, 10, 0))
                    .build();

    // 2025-02-05 - 월급 3000000원
    fixtures.incomes.income(testFamily, salaryCategory)
                    .amount(BigDecimal.valueOf(3000000))
                    .description("2월 월급")
                    .date(LocalDateTime.of(2025, 2, 5, 9, 0))
                    .build();

    // 2025-02-10 - 부업 700000원
    fixtures.incomes.income(testFamily, sideJobCategory)
                    .amount(BigDecimal.valueOf(700000))
                    .description("컨설팅 수입")
                    .date(LocalDateTime.of(2025, 2, 10, 16, 0))
                    .build();
  }

  @Test
  @DisplayName("수입 조회 시 날짜 내림차순으로 정렬되어야 한다")
  void getFamilyIncomes_ShouldBeSortedByDateDescending() {
    // Given
    IncomeSearchRequest searchRequest = IncomeSearchRequest.builder()
                                                           .page(0)
                                                           .size(10)
                                                           .build();

    // When
    Page<IncomeResponse> incomes = incomeService.getFamilyIncomes(
        testUser.getUuid(), testFamily.getUuid(), searchRequest);

    // Then
    assertThat(incomes.getContent()).hasSize(5);

    // 날짜가 내림차순으로 정렬되어 있는지 확인 (최신 날짜가 먼저)
    List<IncomeResponse> incomeList = incomes.getContent();
    assertThat(incomeList.get(0).getDescription()).isEqualTo("컨설팅 수입"); // 2025-02-10
    assertThat(incomeList.get(1).getDescription()).isEqualTo("2월 월급"); // 2025-02-05
    assertThat(incomeList.get(2).getDescription()).isEqualTo("설날 보너스"); // 2025-01-25
    assertThat(incomeList.get(3).getDescription()).isEqualTo("프리랜서 수입"); // 2025-01-20
    assertThat(incomeList.get(4).getDescription()).isEqualTo("1월 월급"); // 2025-01-15
  }

  @Test
  @DisplayName("수입 응답에 카테고리 정보가 포함되어야 한다")
  void getFamilyIncomes_ShouldIncludeCategoryInfo() {
    // Given
    IncomeSearchRequest searchRequest = IncomeSearchRequest.builder()
                                                           .page(0)
                                                           .size(10)
                                                           .build();

    // When
    Page<IncomeResponse> incomes = incomeService.getFamilyIncomes(
        testUser.getUuid(), testFamily.getUuid(), searchRequest);

    // Then - 모든 수입에 카테고리 정보가 포함되어 있어야 함
    incomes.getContent().forEach(income -> {
      assertThat(income.getCategory()).isNotNull();
      assertThat(income.getCategory().getUuid()).isNotNull();
      assertThat(income.getCategory().getName()).isNotNull();
      assertThat(income.getCategory().getColor()).isNotNull();
      assertThat(income.getCategory().getIcon()).isNotNull();
    });

    // 첫 번째 수입의 카테고리 정보 상세 확인
    IncomeResponse firstIncome = incomes.getContent().get(0);
    assertThat(firstIncome.getCategory().getName()).isEqualTo("부업");
    assertThat(firstIncome.getCategory().getColor()).isEqualTo("#60a5fa");
    assertThat(firstIncome.getCategory().getIcon()).isEqualTo("💼");
  }

  @Test
  @DisplayName("카테고리 필터링이 올바르게 동작해야 한다")
  void getFamilyIncomes_ShouldFilterByCategory() {
    // Given - 월급 카테고리로 필터링
    IncomeSearchRequest searchRequest = IncomeSearchRequest.builder()
                                                           .page(0)
                                                           .size(10)
                                                           .categoryUuid(salaryCategory.getUuid().getValue())
                                                           .build();

    // When
    Page<IncomeResponse> incomes = incomeService.getFamilyIncomes(
        testUser.getUuid(), testFamily.getUuid(), searchRequest);

    // Then - 월급 카테고리 수입만 2개 조회되어야 함
    assertThat(incomes.getContent()).hasSize(2);
    assertThat(incomes.getTotalElements()).isEqualTo(2);

    // 모든 수입이 월급 카테고리인지 확인
    incomes.getContent().forEach(income -> {
      assertThat(income.getCategoryUuid()).isEqualTo(salaryCategory.getUuid().getValue());
      assertThat(income.getCategory().getName()).isEqualTo("월급");
    });

    // 날짜 내림차순 정렬 확인
    List<IncomeResponse> incomeList = incomes.getContent();
    assertThat(incomeList.get(0).getDescription()).isEqualTo("2월 월급"); // 2025-02-05
    assertThat(incomeList.get(1).getDescription()).isEqualTo("1월 월급"); // 2025-01-15
  }

  @Test
  @DisplayName("날짜 범위 필터링이 올바르게 동작해야 한다")
  void getFamilyIncomes_ShouldFilterByDateRange() {
    // Given - 2025년 1월 수입만 조회
    IncomeSearchRequest searchRequest = IncomeSearchRequest.builder()
                                                           .page(0)
                                                           .size(10)
                                                           .startDate(LocalDateTime.of(2025, 1, 1, 0, 0))
                                                           .endDate(LocalDateTime.of(2025, 1, 31, 23, 59))
                                                           .build();

    // When
    Page<IncomeResponse> incomes = incomeService.getFamilyIncomes(
        testUser.getUuid(), testFamily.getUuid(), searchRequest);

    // Then - 1월 수입 3개만 조회되어야 함
    assertThat(incomes.getContent()).hasSize(3);
    assertThat(incomes.getTotalElements()).isEqualTo(3);

    // 날짜 내림차순 정렬 확인
    List<IncomeResponse> incomeList = incomes.getContent();
    assertThat(incomeList.get(0).getDescription()).isEqualTo("설날 보너스"); // 2025-01-25
    assertThat(incomeList.get(1).getDescription()).isEqualTo("프리랜서 수입"); // 2025-01-20
    assertThat(incomeList.get(2).getDescription()).isEqualTo("1월 월급"); // 2025-01-15
  }

  @Test
  @DisplayName("시작 날짜만 지정한 경우 해당 날짜 이후 수입이 조회되어야 한다")
  void getFamilyIncomes_ShouldFilterByStartDateOnly() {
    // Given - 2025-01-20 이후 수입만 조회
    IncomeSearchRequest searchRequest = IncomeSearchRequest.builder()
                                                           .page(0)
                                                           .size(10)
                                                           .startDate(LocalDateTime.of(2025, 1, 20, 0, 0))
                                                           .build();

    // When
    Page<IncomeResponse> incomes = incomeService.getFamilyIncomes(
        testUser.getUuid(), testFamily.getUuid(), searchRequest);

    // Then - 4개 조회되어야 함 (1-15는 제외)
    assertThat(incomes.getContent()).hasSize(4);
    assertThat(incomes.getTotalElements()).isEqualTo(4);

    // 1월 15일 수입은 포함되지 않아야 함
    incomes.getContent().forEach(income -> {
      assertThat(income.getDescription()).isNotEqualTo("1월 월급");
    });
  }

  @Test
  @DisplayName("종료 날짜만 지정한 경우 해당 날짜 이전 수입이 조회되어야 한다")
  void getFamilyIncomes_ShouldFilterByEndDateOnly() {
    // Given - 2025-01-31 이전 수입만 조회
    IncomeSearchRequest searchRequest = IncomeSearchRequest.builder()
                                                           .page(0)
                                                           .size(10)
                                                           .endDate(LocalDateTime.of(2025, 1, 31, 23, 59))
                                                           .build();

    // When
    Page<IncomeResponse> incomes = incomeService.getFamilyIncomes(
        testUser.getUuid(), testFamily.getUuid(), searchRequest);

    // Then - 1월 수입 3개만 조회되어야 함
    assertThat(incomes.getContent()).hasSize(3);
    assertThat(incomes.getTotalElements()).isEqualTo(3);

    // 2월 수입은 포함되지 않아야 함
    incomes.getContent().forEach(income -> {
      assertThat(income.getDescription()).isNotIn("2월 월급", "컨설팅 수입");
    });
  }

  @Test
  @DisplayName("카테고리와 날짜 범위를 함께 필터링할 수 있어야 한다")
  void getFamilyIncomes_ShouldFilterByCategoryAndDateRange() {
    // Given - 1월 부업 수입만 조회
    IncomeSearchRequest searchRequest = IncomeSearchRequest.builder()
                                                           .page(0)
                                                           .size(10)
                                                           .categoryUuid(sideJobCategory.getUuid().getValue())
                                                           .startDate(LocalDateTime.of(2025, 1, 1, 0, 0))
                                                           .endDate(LocalDateTime.of(2025, 1, 31, 23, 59))
                                                           .build();

    // When
    Page<IncomeResponse> incomes = incomeService.getFamilyIncomes(
        testUser.getUuid(), testFamily.getUuid(), searchRequest);

    // Then - 1월 부업 1개만 조회되어야 함
    assertThat(incomes.getContent()).hasSize(1);
    assertThat(incomes.getTotalElements()).isEqualTo(1);

    // 부업 카테고리이고, 1월 수입인지 확인
    IncomeResponse income = incomes.getContent().get(0);
    assertThat(income.getDescription()).isEqualTo("프리랜서 수입");
    assertThat(income.getCategoryUuid()).isEqualTo(sideJobCategory.getUuid().getValue());
    assertThat(income.getCategory().getName()).isEqualTo("부업");
  }

  @Test
  @DisplayName("페이징이 올바르게 동작해야 한다")
  void getFamilyIncomes_ShouldSupportPagination() {
    // Given - 페이지 크기 2, 첫 번째 페이지
    IncomeSearchRequest searchRequest1 = IncomeSearchRequest.builder()
                                                            .page(0)
                                                            .size(2)
                                                            .build();

    // When - 첫 번째 페이지 조회
    Page<IncomeResponse> page1 = incomeService.getFamilyIncomes(
        testUser.getUuid(), testFamily.getUuid(), searchRequest1);

    // Then
    assertThat(page1.getContent()).hasSize(2);
    assertThat(page1.getTotalElements()).isEqualTo(5);
    assertThat(page1.getTotalPages()).isEqualTo(3);
    assertThat(page1.getNumber()).isEqualTo(0);
    assertThat(page1.isFirst()).isTrue();
    assertThat(page1.isLast()).isFalse();

    // 최신 2개 수입인지 확인
    assertThat(page1.getContent().get(0).getDescription()).isEqualTo("컨설팅 수입"); // 2025-02-10
    assertThat(page1.getContent().get(1).getDescription()).isEqualTo("2월 월급"); // 2025-02-05

    // Given - 두 번째 페이지
    IncomeSearchRequest searchRequest2 = IncomeSearchRequest.builder()
                                                            .page(1)
                                                            .size(2)
                                                            .build();

    // When - 두 번째 페이지 조회
    Page<IncomeResponse> page2 = incomeService.getFamilyIncomes(
        testUser.getUuid(), testFamily.getUuid(), searchRequest2);

    // Then
    assertThat(page2.getContent()).hasSize(2);
    assertThat(page2.getNumber()).isEqualTo(1);
    assertThat(page2.isFirst()).isFalse();
    assertThat(page2.isLast()).isFalse();

    // 다음 2개 수입인지 확인
    assertThat(page2.getContent().get(0).getDescription()).isEqualTo("설날 보너스"); // 2025-01-25
    assertThat(page2.getContent().get(1).getDescription()).isEqualTo("프리랜서 수입"); // 2025-01-20
  }

  @Test
  @DisplayName("필터 조건에 맞는 수입이 없으면 빈 결과를 반환해야 한다")
  void getFamilyIncomes_ShouldReturnEmptyWhenNoMatch() {
    // Given - 3월 수입 조회 (실제로는 없음)
    IncomeSearchRequest searchRequest = IncomeSearchRequest.builder()
                                                           .page(0)
                                                           .size(10)
                                                           .startDate(LocalDateTime.of(2025, 3, 1, 0, 0))
                                                           .endDate(LocalDateTime.of(2025, 3, 31, 23, 59))
                                                           .build();

    // When
    Page<IncomeResponse> incomes = incomeService.getFamilyIncomes(
        testUser.getUuid(), testFamily.getUuid(), searchRequest);

    // Then
    assertThat(incomes.getContent()).isEmpty();
    assertThat(incomes.getTotalElements()).isEqualTo(0);
    assertThat(incomes.getTotalPages()).isEqualTo(0);
  }

  @Test
  @DisplayName("존재하지 않는 카테고리로 필터링하면 빈 결과를 반환해야 한다")
  void getFamilyIncomes_ShouldReturnEmptyWhenCategoryNotExists() {
    // Given - 존재하지 않는 카테고리 UUID
    IncomeSearchRequest searchRequest = IncomeSearchRequest.builder()
                                                           .page(0)
                                                           .size(10)
                                                           .categoryUuid("00000000-0000-0000-0000-000000000000")
                                                           .build();

    // When
    Page<IncomeResponse> incomes = incomeService.getFamilyIncomes(
        testUser.getUuid(), testFamily.getUuid(), searchRequest);

    // Then
    assertThat(incomes.getContent()).isEmpty();
    assertThat(incomes.getTotalElements()).isEqualTo(0);
  }

  @Test
  @DisplayName("null 조건은 자동으로 무시되고 전체 데이터를 조회해야 한다")
  void getFamilyIncomes_ShouldIgnoreNullConditions() {
    // Given - 모든 필터 조건이 null
    IncomeSearchRequest searchRequest = IncomeSearchRequest.builder()
                                                           .page(0)
                                                           .size(10)
                                                           .categoryUuid(null)
                                                           .startDate(null)
                                                           .endDate(null)
                                                           .build();

    // When
    Page<IncomeResponse> incomes = incomeService.getFamilyIncomes(
        testUser.getUuid(), testFamily.getUuid(), searchRequest);

    // Then - 전체 5개 조회되어야 함
    assertThat(incomes.getContent()).hasSize(5);
    assertThat(incomes.getTotalElements()).isEqualTo(5);
  }
}

