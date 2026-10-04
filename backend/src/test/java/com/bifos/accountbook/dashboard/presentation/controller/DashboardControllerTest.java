package com.bifos.accountbook.dashboard.presentation.controller;

import static org.hamcrest.Matchers.greaterThan;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.bifos.accountbook.budgetitem.application.dto.BudgetItemRequest;
import com.bifos.accountbook.category.domain.entity.Category;
import com.bifos.accountbook.expense.domain.entity.Expense;
import com.bifos.accountbook.expense.domain.repository.ExpenseRepository;
import com.bifos.accountbook.expense.domain.value.ExpenseStatus;
import com.bifos.accountbook.family.domain.entity.Family;
import com.bifos.accountbook.family.domain.repository.FamilyRepository;
import com.bifos.accountbook.income.domain.entity.Income;
import com.bifos.accountbook.income.domain.repository.IncomeRepository;
import com.bifos.accountbook.shared.AbstractControllerTest;
import com.bifos.accountbook.shared.value.CustomUuid;
import com.bifos.accountbook.user.domain.entity.User;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;

/**
 * DashboardController 통합 테스트 - 대시보드 통계 API 검증 - 카테고리별 지출 요약 - 실제 API 엔드포인트 테스트 -
 * AbstractControllerTest를 상속받아 테스트 환경 자동 설정
 */
@DisplayName("DashboardController 통합 테스트")
class DashboardControllerTest extends AbstractControllerTest {

  @Autowired private ExpenseRepository expenseRepository;

  @Autowired private IncomeRepository incomeRepository;

  @Autowired private FamilyRepository familyRepository;

  @Test
  @DisplayName("카테고리별 지출 요약 조회 - 성공")
  void getCategoryExpenseSummary_Success() throws Exception {
    // Given: 테스트 데이터 생성 (Fluent API)
    Family family = fixtures.getDefaultFamily();
    Category foodCategory =
        fixtures.categories.category(family).name("식비").color("#FF5733").icon("🍕").build();
    Category transportCategory =
        fixtures.categories.category(family).name("교통비").color("#3498DB").icon("🚗").build();

    LocalDateTime now = LocalDateTime.now();

    // 식비 지출 3건
    fixtures
        .expenses
        .expense(family, foodCategory)
        .amount(BigDecimal.valueOf(15000))
        .date(now.minusDays(1))
        .build();
    fixtures
        .expenses
        .expense(family, foodCategory)
        .amount(BigDecimal.valueOf(20000))
        .date(now.minusDays(2))
        .build();
    fixtures
        .expenses
        .expense(family, foodCategory)
        .amount(BigDecimal.valueOf(25000))
        .date(now.minusDays(3))
        .build();

    // 교통비 지출 2건
    fixtures
        .expenses
        .expense(family, transportCategory)
        .amount(BigDecimal.valueOf(5000))
        .date(now.minusDays(1))
        .build();
    fixtures
        .expenses
        .expense(family, transportCategory)
        .amount(BigDecimal.valueOf(10000))
        .date(now.minusDays(2))
        .build();

    // When & Then: 대시보드 API 호출
    mockMvc
        .perform(
            get(
                    "/api/v1/families/{familyUuid}/dashboard/expenses/by-category",
                    family.getUuid().getValue())
                .contentType(MediaType.APPLICATION_JSON))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.success").value(true))
        .andExpect(jsonPath("$.data.totalExpense").value(75000)) // 전체 합계
        .andExpect(jsonPath("$.data.categoryStats").isArray())
        .andExpect(jsonPath("$.data.categoryStats.length()").value(2))
        // 식비가 가장 많아서 첫 번째
        .andExpect(jsonPath("$.data.categoryStats[0].categoryName").value("식비"))
        .andExpect(jsonPath("$.data.categoryStats[0].totalAmount").value(60000))
        .andExpect(jsonPath("$.data.categoryStats[0].count").value(3))
        .andExpect(jsonPath("$.data.categoryStats[0].percentage").value(80.0))
        // 교통비가 두 번째
        .andExpect(jsonPath("$.data.categoryStats[1].categoryName").value("교통비"))
        .andExpect(jsonPath("$.data.categoryStats[1].totalAmount").value(15000))
        .andExpect(jsonPath("$.data.categoryStats[1].count").value(2))
        .andExpect(jsonPath("$.data.categoryStats[1].percentage").value(20.0));
  }

  @Test
  @DisplayName("카테고리별 지출 요약 - 날짜 필터링")
  void getCategoryExpenseSummary_WithDateFilter() throws Exception {
    // Given: 테스트 데이터 생성 (Fluent API)
    Family family = fixtures.getDefaultFamily();
    Category foodCategory = fixtures.getDefaultCategory();

    LocalDateTime now = LocalDateTime.now();

    fixtures
        .expenses
        .expense(family, foodCategory)
        .amount(BigDecimal.valueOf(10000))
        .date(now.minusDays(1))
        .build();
    fixtures
        .expenses
        .expense(family, foodCategory)
        .amount(BigDecimal.valueOf(20000))
        .date(now.minusDays(10))
        .build(); // 오래됨

    // When & Then: 최근 5일만 필터링
    mockMvc
        .perform(
            get(
                    "/api/v1/families/{familyUuid}/dashboard/expenses/by-category",
                    family.getUuid().getValue())
                .param("startDate", now.minusDays(5).toString())
                .param("endDate", now.toString())
                .contentType(MediaType.APPLICATION_JSON))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.data.totalExpense").value(10000))
        .andExpect(jsonPath("$.data.categoryStats.length()").value(1));
  }

  @Test
  @DisplayName("카테고리별 지출 요약 - 종료 시각 지출 포함")
  void getCategoryExpenseSummary_IncludesExpenseAtEndDate() throws Exception {
    Family family = fixtures.getDefaultFamily();
    Category foodCategory = fixtures.getDefaultCategory();
    LocalDateTime startDate = LocalDateTime.of(2026, 3, 1, 0, 0);
    LocalDateTime endDate = LocalDateTime.of(2026, 3, 31, 23, 59);

    fixtures
        .expenses
        .expense(family, foodCategory)
        .amount(BigDecimal.valueOf(10000))
        .date(startDate)
        .build();
    fixtures
        .expenses
        .expense(family, foodCategory)
        .amount(BigDecimal.valueOf(20000))
        .date(endDate)
        .build();

    mockMvc
        .perform(
            get(
                    "/api/v1/families/{familyUuid}/dashboard/expenses/by-category",
                    family.getUuid().getValue())
                .param("startDate", startDate.toString())
                .param("endDate", endDate.toString())
                .contentType(MediaType.APPLICATION_JSON))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.data.totalExpense").value(30000))
        .andExpect(jsonPath("$.data.categoryStats[0].totalAmount").value(30000));
  }

  @Test
  @DisplayName("카테고리별 지출 요약 - 카테고리 필터링")
  void getCategoryExpenseSummary_WithCategoryFilter() throws Exception {
    // Given: 테스트 데이터 생성 (Fluent API)
    Family family = fixtures.getDefaultFamily();
    Category foodCategory =
        fixtures.categories.category(family).name("식비").color("#FF5733").icon("🍕").build();
    Category transportCategory =
        fixtures.categories.category(family).name("교통비").color("#3498DB").icon("🚗").build();

    LocalDateTime now = LocalDateTime.now();

    fixtures
        .expenses
        .expense(family, foodCategory)
        .amount(BigDecimal.valueOf(10000))
        .date(now)
        .build();
    fixtures
        .expenses
        .expense(family, transportCategory)
        .amount(BigDecimal.valueOf(5000))
        .date(now)
        .build();

    // When & Then: 식비만 조회
    mockMvc
        .perform(
            get(
                    "/api/v1/families/{familyUuid}/dashboard/expenses/by-category",
                    family.getUuid().getValue())
                .param("categoryUuid", foodCategory.getUuid().getValue())
                .contentType(MediaType.APPLICATION_JSON))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.data.totalExpense").value(10000))
        .andExpect(jsonPath("$.data.categoryStats.length()").value(1))
        .andExpect(jsonPath("$.data.categoryStats[0].categoryName").value("식비"));
  }

  @Test
  @DisplayName("카테고리별 지출 요약 - 지출이 없을 때")
  void getCategoryExpenseSummary_NoExpenses() throws Exception {
    // Given: 빈 가족
    Family family = fixtures.getDefaultFamily();

    // When & Then: 빈 통계 반환
    mockMvc
        .perform(
            get(
                    "/api/v1/families/{familyUuid}/dashboard/expenses/by-category",
                    family.getUuid().getValue())
                .contentType(MediaType.APPLICATION_JSON))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.data.totalExpense").value(0))
        .andExpect(jsonPath("$.data.categoryStats").isEmpty());
  }

  @Test
  @DisplayName("카테고리별 지출 요약 - 권한 없는 가족 조회 실패")
  void getCategoryExpenseSummary_UnauthorizedFamily() throws Exception {
    // Given: 다른 가족 생성 (현재 사용자를 멤버로 추가하지 않음)
    User user = fixtures.getDefaultUser();
    CustomUuid otherFamilyUuid = CustomUuid.generate();

    // When & Then: 권한 없는 가족 조회 시 에러
    mockMvc
        .perform(
            get(
                    "/api/v1/families/{familyUuid}/dashboard/expenses/by-category",
                    otherFamilyUuid.getValue())
                .contentType(MediaType.APPLICATION_JSON))
        .andExpect(status().isForbidden());
  }

  @Test
  @DisplayName("월별 통계 조회 - 성공 (QueryDSL 집계)")
  void getMonthlyStats_Success() throws Exception {
    // Given: 테스트 데이터 생성 (Fluent API)
    User user = fixtures.getDefaultUser();
    Family family = fixtures.getDefaultFamily();
    Category foodCategory =
        fixtures.categories.category(family).name("식비").color("#FF5733").icon("🍕").build();
    Category transportCategory =
        fixtures.categories.category(family).name("교통비").color("#3498DB").icon("🚗").build();

    LocalDateTime now = LocalDateTime.now();
    final int year = now.getYear();
    final int month = now.getMonthValue();

    // 이번 달 지출: 50,000원 (음식) + 30,000원 (교통) = 80,000원
    createExpense(
        family.getUuid(), user.getUuid(), foodCategory.getUuid(), BigDecimal.valueOf(50000), now);
    createExpense(
        family.getUuid(),
        user.getUuid(),
        transportCategory.getUuid(),
        BigDecimal.valueOf(30000),
        now);

    // 이번 달 수입: 100,000원
    createIncome(
        family.getUuid(), user.getUuid(), foodCategory.getUuid(), BigDecimal.valueOf(100000), now);

    // 다른 달 지출 (집계에서 제외되어야 함)
    createExpense(
        family.getUuid(),
        user.getUuid(),
        foodCategory.getUuid(),
        BigDecimal.valueOf(20000),
        now.minusMonths(1));

    // When & Then: 월별 통계 조회
    mockMvc
        .perform(
            get(
                    "/api/v1/families/{familyUuid}/dashboard/stats/monthly",
                    family.getUuid().getValue())
                .param("year", String.valueOf(year))
                .param("month", String.valueOf(month))
                .contentType(MediaType.APPLICATION_JSON))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.success").value(true))
        .andExpect(jsonPath("$.data.monthlyExpense").value(80000))
        .andExpect(jsonPath("$.data.monthlyIncome").value(100000))
        .andExpect(jsonPath("$.data.familyMembers").value(greaterThan(0)))
        .andExpect(jsonPath("$.data.year").value(year))
        .andExpect(jsonPath("$.data.month").value(month));
  }

  @Test
  @DisplayName("월별 통계 조회 - 기본값 (현재 연월)")
  void getMonthlyStats_DefaultValues() throws Exception {
    // Given: 빈 가족
    Family family = fixtures.getDefaultFamily();

    // When & Then: 파라미터 없이 조회 (현재 연월 사용)
    mockMvc
        .perform(
            get(
                    "/api/v1/families/{familyUuid}/dashboard/stats/monthly",
                    family.getUuid().getValue())
                .contentType(MediaType.APPLICATION_JSON))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.success").value(true))
        .andExpect(jsonPath("$.data.monthlyExpense").value(0))
        .andExpect(jsonPath("$.data.monthlyIncome").value(0))
        .andExpect(jsonPath("$.data.year").exists())
        .andExpect(jsonPath("$.data.month").exists());
  }

  @Test
  @DisplayName("월별 통계 조회 - 예산 설정된 경우")
  void getMonthlyStats_WithBudget() throws Exception {
    // Given: 테스트 데이터 생성 (Fluent API)
    User user = fixtures.getDefaultUser();
    Family family =
        fixtures
            .families
            .family()
            .name("우리집")
            .budget(BigDecimal.valueOf(500000))
            .build(); // 50만원 예산
    Category foodCategory =
        fixtures.categories.category(family).name("식비").color("#FF5733").icon("🍕").build();
    Category transportCategory =
        fixtures.categories.category(family).name("교통비").color("#3498DB").icon("🚗").build();

    LocalDateTime now = LocalDateTime.now();
    final int year = now.getYear();
    final int month = now.getMonthValue();

    // 이번 달 지출: 200,000원
    createExpense(
        family.getUuid(), user.getUuid(), foodCategory.getUuid(), BigDecimal.valueOf(150000), now);
    createExpense(
        family.getUuid(),
        user.getUuid(),
        transportCategory.getUuid(),
        BigDecimal.valueOf(50000),
        now);

    // 이번 달 수입: 300,000원
    createIncome(
        family.getUuid(), user.getUuid(), foodCategory.getUuid(), BigDecimal.valueOf(300000), now);

    // When & Then: 월별 통계 조회
    mockMvc
        .perform(
            get(
                    "/api/v1/families/{familyUuid}/dashboard/stats/monthly",
                    family.getUuid().getValue())
                .param("year", String.valueOf(year))
                .param("month", String.valueOf(month))
                .contentType(MediaType.APPLICATION_JSON))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.success").value(true))
        .andExpect(jsonPath("$.data.monthlyExpense").value(200000))
        .andExpect(jsonPath("$.data.monthlyIncome").value(300000))
        .andExpect(jsonPath("$.data.budget").value(500000))
        .andExpect(jsonPath("$.data.remainingBudget").value(300000)) // 500,000 - 200,000
        .andExpect(jsonPath("$.data.familyMembers").value(greaterThan(0)))
        .andExpect(jsonPath("$.data.year").value(year))
        .andExpect(jsonPath("$.data.month").value(month));
  }

  @Test
  @DisplayName("월별 통계 조회 - 예산 초과한 경우")
  void getMonthlyStats_BudgetExceeded() throws Exception {
    // Given: 테스트 데이터 생성 (Fluent API)
    User user = fixtures.getDefaultUser();
    Family family =
        fixtures
            .families
            .family()
            .name("우리집")
            .budget(BigDecimal.valueOf(100000))
            .build(); // 10만원 예산
    Category foodCategory = fixtures.categories.category(family).build();

    LocalDateTime now = LocalDateTime.now();
    int year = now.getYear();
    int month = now.getMonthValue();

    // 이번 달 지출: 150,000원 (예산 초과)
    createExpense(
        family.getUuid(), user.getUuid(), foodCategory.getUuid(), BigDecimal.valueOf(150000), now);

    // When & Then: 남은 예산이 음수로 표시됨
    mockMvc
        .perform(
            get(
                    "/api/v1/families/{familyUuid}/dashboard/stats/monthly",
                    family.getUuid().getValue())
                .param("year", String.valueOf(year))
                .param("month", String.valueOf(month))
                .contentType(MediaType.APPLICATION_JSON))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.success").value(true))
        .andExpect(jsonPath("$.data.monthlyExpense").value(150000))
        .andExpect(jsonPath("$.data.budget").value(100000))
        .andExpect(jsonPath("$.data.remainingBudget").value(-50000)); // 100,000 - 150,000 = -50,000
  }

  // ===== 일별 통계 조회 (캘린더 뷰) 테스트 =====

  @Test
  @DisplayName("일별 통계 조회 - 성공 (캘린더 뷰)")
  void getDailyStats_Success() throws Exception {
    // Given: 테스트 데이터 생성
    User user = fixtures.getDefaultUser();
    Family family = fixtures.getDefaultFamily();
    Category foodCategory =
        fixtures.categories.category(family).name("식비").color("#FF5733").icon("🍕").build();
    Category transportCategory =
        fixtures.categories.category(family).name("교통비").color("#3498DB").icon("🚗").build();

    LocalDateTime now = LocalDateTime.now();

    createExpense(
        family.getUuid(),
        user.getUuid(),
        foodCategory.getUuid(),
        BigDecimal.valueOf(30000),
        now.withDayOfMonth(1));
    createExpense(
        family.getUuid(),
        user.getUuid(),
        transportCategory.getUuid(),
        BigDecimal.valueOf(20000),
        now.withDayOfMonth(1));
    createIncome(
        family.getUuid(),
        user.getUuid(),
        foodCategory.getUuid(),
        BigDecimal.valueOf(100000),
        now.withDayOfMonth(1));
    createExpense(
        family.getUuid(),
        user.getUuid(),
        foodCategory.getUuid(),
        BigDecimal.valueOf(15000),
        now.withDayOfMonth(5));
    createIncome(
        family.getUuid(),
        user.getUuid(),
        foodCategory.getUuid(),
        BigDecimal.valueOf(200000),
        now.withDayOfMonth(10));

    int year = now.getYear();
    int month = now.getMonthValue();

    mockMvc
        .perform(
            get("/api/v1/families/{familyUuid}/dashboard/daily-stats", family.getUuid().getValue())
                .param("year", String.valueOf(year))
                .param("month", String.valueOf(month))
                .contentType(MediaType.APPLICATION_JSON))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.success").value(true))
        .andExpect(jsonPath("$.data.year").value(year))
        .andExpect(jsonPath("$.data.month").value(month))
        .andExpect(jsonPath("$.data.totalExpense").value(65000)) // 50,000 + 15,000
        .andExpect(jsonPath("$.data.totalIncome").value(300000)) // 100,000 + 200,000
        .andExpect(jsonPath("$.data.dailyStats").isArray())
        .andExpect(jsonPath("$.data.dailyStats.length()").value(3)); // 거래가 있는 3일만 포함
  }

  @Test
  @DisplayName("일별 통계는 날짜마다 등록자 순서로 지출을 반환하고 삭제 및 다른 기간과 가족은 제외한다")
  void getDailyStats_MemberExpensesByDay() throws Exception {
    User firstUser = fixtures.getDefaultUser();
    User secondUser = fixtures.users.user().email("second@example.com").build();
    Family family = fixtures.getDefaultFamily();
    Category category = fixtures.categories.category(family).build();
    LocalDateTime firstDay = LocalDateTime.of(2025, 5, 1, 12, 0);

    createExpense(
        family.getUuid(),
        firstUser.getUuid(),
        category.getUuid(),
        new BigDecimal("100.25"),
        firstDay);
    createExpense(
        family.getUuid(),
        firstUser.getUuid(),
        category.getUuid(),
        new BigDecimal("20.75"),
        firstDay.plusHours(1));
    Expense excluded =
        createExpense(
            family.getUuid(),
            secondUser.getUuid(),
            category.getUuid(),
            new BigDecimal("200.50"),
            firstDay);
    excluded.setExcludeFromBudget(true);
    expenseRepository.save(excluded);
    createExpense(
        family.getUuid(),
        firstUser.getUuid(),
        category.getUuid(),
        new BigDecimal("30.50"),
        firstDay.withDayOfMonth(5));
    createIncome(
        family.getUuid(),
        firstUser.getUuid(),
        category.getUuid(),
        new BigDecimal("500.25"),
        firstDay.withDayOfMonth(3));
    User deletedUser = fixtures.users.user().email("deleted@example.com").build();
    Expense deleted =
        createExpense(
            family.getUuid(),
            deletedUser.getUuid(),
            category.getUuid(),
            BigDecimal.valueOf(999),
            firstDay.withDayOfMonth(9));
    deleted.delete();
    expenseRepository.save(deleted);
    createExpense(
        family.getUuid(),
        secondUser.getUuid(),
        category.getUuid(),
        BigDecimal.valueOf(888),
        firstDay.minusMonths(1));
    createExpense(
        family.getUuid(),
        secondUser.getUuid(),
        category.getUuid(),
        BigDecimal.valueOf(777),
        firstDay.minusYears(1));
    Family otherFamily = fixtures.families.family().name("다른 가족").build();
    Category otherCategory = fixtures.categories.category(otherFamily).build();
    createExpense(
        otherFamily.getUuid(),
        secondUser.getUuid(),
        otherCategory.getUuid(),
        BigDecimal.valueOf(666),
        firstDay);

    boolean firstUserBeforeSecond =
        firstUser.getUuid().getValue().compareTo(secondUser.getUuid().getValue()) < 0;
    String earlierUuid;
    String laterUuid;
    double earlierDailyAmount;
    double laterDailyAmount;
    if (firstUserBeforeSecond) {
      earlierUuid = firstUser.getUuid().getValue();
      laterUuid = secondUser.getUuid().getValue();
      earlierDailyAmount = 121;
      laterDailyAmount = 200.5;
    } else {
      earlierUuid = secondUser.getUuid().getValue();
      laterUuid = firstUser.getUuid().getValue();
      earlierDailyAmount = 200.5;
      laterDailyAmount = 121;
    }

    mockMvc
        .perform(
            get("/api/v1/families/{familyUuid}/dashboard/daily-stats", family.getUuid().getValue())
                .param("year", "2025")
                .param("month", "5"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.data.totalExpense").value(352))
        .andExpect(jsonPath("$.data.totalIncome").value(500.25))
        .andExpect(jsonPath("$.data.dailyStats.length()").value(3))
        .andExpect(jsonPath("$.data.dailyStats[0].date").value("2025-05-01"))
        .andExpect(jsonPath("$.data.dailyStats[0].expense").value(321.5))
        .andExpect(jsonPath("$.data.dailyStats[0].memberExpenses.length()").value(2))
        .andExpect(jsonPath("$.data.dailyStats[0].memberExpenses[0].userUuid").value(earlierUuid))
        .andExpect(
            jsonPath("$.data.dailyStats[0].memberExpenses[0].amount").value(earlierDailyAmount))
        .andExpect(jsonPath("$.data.dailyStats[0].memberExpenses[1].userUuid").value(laterUuid))
        .andExpect(
            jsonPath("$.data.dailyStats[0].memberExpenses[1].amount").value(laterDailyAmount))
        .andExpect(jsonPath("$.data.dailyStats[1].date").value("2025-05-03"))
        .andExpect(jsonPath("$.data.dailyStats[1].income").value(500.25))
        .andExpect(jsonPath("$.data.dailyStats[1].expense").value(0))
        .andExpect(jsonPath("$.data.dailyStats[1].memberExpenses").isEmpty())
        .andExpect(jsonPath("$.data.dailyStats[2].date").value("2025-05-05"))
        .andExpect(jsonPath("$.data.dailyStats[2].expense").value(30.5))
        .andExpect(jsonPath("$.data.dailyStats[2].memberExpenses.length()").value(1))
        .andExpect(
            jsonPath("$.data.dailyStats[2].memberExpenses[0].userUuid")
                .value(firstUser.getUuid().getValue()))
        .andExpect(jsonPath("$.data.dailyStats[2].memberExpenses[0].amount").value(30.5))
        .andExpect(jsonPath("$.data.memberExpenseTotals").doesNotExist());
  }

  @Test
  @DisplayName("수입만 있는 달은 날짜별 등록자 지출이 빈 배열이다")
  void getDailyStats_IncomeOnly() throws Exception {
    User user = fixtures.getDefaultUser();
    Family family = fixtures.getDefaultFamily();
    Category category = fixtures.categories.category(family).build();
    createIncome(
        family.getUuid(),
        user.getUuid(),
        category.getUuid(),
        BigDecimal.valueOf(100),
        LocalDateTime.of(2025, 5, 3, 12, 0));

    mockMvc
        .perform(
            get("/api/v1/families/{familyUuid}/dashboard/daily-stats", family.getUuid().getValue())
                .param("year", "2025")
                .param("month", "5"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.data.totalExpense").value(0))
        .andExpect(jsonPath("$.data.totalIncome").value(100))
        .andExpect(jsonPath("$.data.dailyStats.length()").value(1))
        .andExpect(jsonPath("$.data.dailyStats[0].memberExpenses").isEmpty());
  }

  @Test
  @DisplayName("일별 통계 조회 - 거래 없는 달")
  void getDailyStats_NoTransactions() throws Exception {
    // Given: 빈 가족
    Family family = fixtures.getDefaultFamily();

    LocalDateTime now = LocalDateTime.now();
    int year = now.getYear();
    int month = now.getMonthValue();

    // When & Then: 빈 통계 반환
    mockMvc
        .perform(
            get("/api/v1/families/{familyUuid}/dashboard/daily-stats", family.getUuid().getValue())
                .param("year", String.valueOf(year))
                .param("month", String.valueOf(month))
                .contentType(MediaType.APPLICATION_JSON))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.success").value(true))
        .andExpect(jsonPath("$.data.year").value(year))
        .andExpect(jsonPath("$.data.month").value(month))
        .andExpect(jsonPath("$.data.totalExpense").value(0))
        .andExpect(jsonPath("$.data.totalIncome").value(0))
        .andExpect(jsonPath("$.data.dailyStats").isEmpty());
  }

  @Test
  @DisplayName("일별 통계 조회 - 다른 달 데이터 제외")
  void getDailyStats_ExcludesOtherMonths() throws Exception {
    // Given: 테스트 데이터 생성
    User user = fixtures.getDefaultUser();
    Family family = fixtures.getDefaultFamily();
    Category foodCategory = fixtures.categories.category(family).build();

    LocalDateTime now = LocalDateTime.now();

    createExpense(
        family.getUuid(),
        user.getUuid(),
        foodCategory.getUuid(),
        BigDecimal.valueOf(30000),
        now.withDayOfMonth(1));
    createExpense(
        family.getUuid(),
        user.getUuid(),
        foodCategory.getUuid(),
        BigDecimal.valueOf(50000),
        now.minusMonths(1));
    createExpense(
        family.getUuid(),
        user.getUuid(),
        foodCategory.getUuid(),
        BigDecimal.valueOf(40000),
        now.plusMonths(1));

    int year = now.getYear();
    int month = now.getMonthValue();

    mockMvc
        .perform(
            get("/api/v1/families/{familyUuid}/dashboard/daily-stats", family.getUuid().getValue())
                .param("year", String.valueOf(year))
                .param("month", String.valueOf(month))
                .contentType(MediaType.APPLICATION_JSON))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.success").value(true))
        .andExpect(jsonPath("$.data.totalExpense").value(30000)) // 이번 달만
        .andExpect(jsonPath("$.data.dailyStats.length()").value(1));
  }

  @Test
  @DisplayName("일별 통계 조회 - 권한 없는 가족 조회 실패")
  void getDailyStats_UnauthorizedFamily() throws Exception {
    // Given: 다른 가족 생성 (현재 사용자를 멤버로 추가하지 않음)
    fixtures.getDefaultUser();
    CustomUuid otherFamilyUuid = CustomUuid.generate();

    // When & Then: 권한 없는 가족 조회 시 에러
    mockMvc
        .perform(
            get("/api/v1/families/{familyUuid}/dashboard/daily-stats", otherFamilyUuid.getValue())
                .param("year", "2024")
                .param("month", "1")
                .contentType(MediaType.APPLICATION_JSON))
        .andExpect(status().isForbidden())
        .andExpect(jsonPath("$.code").value("F003"));
  }

  // ===== monthly-trend 통합 테스트 =====

  @Test
  @DisplayName("월별 트렌드 조회 - 3개월 지출 데이터 성공")
  void getMonthlyTrend_Success() throws Exception {
    User user = fixtures.getDefaultUser();
    Family family = fixtures.getDefaultFamily();
    Category category = fixtures.categories.category(family).name("식비").build();

    LocalDateTime march = LocalDateTime.of(2025, 3, 15, 10, 0);
    LocalDateTime april = LocalDateTime.of(2025, 4, 15, 10, 0);
    LocalDateTime may = LocalDateTime.of(2025, 5, 15, 10, 0);

    createExpense(
        family.getUuid(), user.getUuid(), category.getUuid(), BigDecimal.valueOf(30000), march);
    createExpense(
        family.getUuid(), user.getUuid(), category.getUuid(), BigDecimal.valueOf(50000), april);
    createExpense(
        family.getUuid(), user.getUuid(), category.getUuid(), BigDecimal.valueOf(40000), may);

    mockMvc
        .perform(
            get(
                    "/api/v1/families/{familyUuid}/dashboard/stats/monthly-trend",
                    family.getUuid().getValue())
                .param("from", "2025-03")
                .param("to", "2025-05")
                .contentType(MediaType.APPLICATION_JSON))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.success").value(true))
        .andExpect(jsonPath("$.data.points").isArray())
        .andExpect(jsonPath("$.data.points.length()").value(3))
        .andExpect(jsonPath("$.data.average").value(40000.00));
  }

  @Test
  @DisplayName("월별 트렌드 조회 - 데이터 없으면 빈 points")
  void getMonthlyTrend_Empty() throws Exception {
    Family family = fixtures.getDefaultFamily();

    mockMvc
        .perform(
            get(
                    "/api/v1/families/{familyUuid}/dashboard/stats/monthly-trend",
                    family.getUuid().getValue())
                .param("from", "2025-01")
                .param("to", "2025-01")
                .contentType(MediaType.APPLICATION_JSON))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.data.points").isEmpty())
        .andExpect(jsonPath("$.data.average").value(0));
  }

  @Test
  @DisplayName("월별 트렌드 조회 - from > to 이면 400")
  void getMonthlyTrend_InvalidRange() throws Exception {
    Family family = fixtures.getDefaultFamily();

    mockMvc
        .perform(
            get(
                    "/api/v1/families/{familyUuid}/dashboard/stats/monthly-trend",
                    family.getUuid().getValue())
                .param("from", "2025-06")
                .param("to", "2025-01")
                .contentType(MediaType.APPLICATION_JSON))
        .andExpect(status().isBadRequest());
  }

  // ===== category-breakdown 통합 테스트 =====

  @Test
  @DisplayName("카테고리 분류 통계 - compareWithPrev=false (delta null)")
  void getCategoryBreakdown_WithoutPrev() throws Exception {
    User user = fixtures.getDefaultUser();
    Family family = fixtures.getDefaultFamily();
    Category foodCategory =
        fixtures.categories.category(family).name("식비").color("#FF5733").icon("🍕").build();
    Category transportCategory =
        fixtures.categories.category(family).name("교통비").color("#3498DB").icon("🚗").build();

    LocalDateTime may = LocalDateTime.of(2025, 5, 15, 10, 0);

    createExpense(
        family.getUuid(), user.getUuid(), foodCategory.getUuid(), BigDecimal.valueOf(60000), may);
    createExpense(
        family.getUuid(),
        user.getUuid(),
        transportCategory.getUuid(),
        BigDecimal.valueOf(40000),
        may);

    mockMvc
        .perform(
            get(
                    "/api/v1/families/{familyUuid}/dashboard/stats/category-breakdown",
                    family.getUuid().getValue())
                .param("year", "2025")
                .param("month", "5")
                .contentType(MediaType.APPLICATION_JSON))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.success").value(true))
        .andExpect(jsonPath("$.data.year").value(2025))
        .andExpect(jsonPath("$.data.month").value(5))
        .andExpect(jsonPath("$.data.totalExpense").value(100000))
        .andExpect(jsonPath("$.data.items").isArray())
        .andExpect(jsonPath("$.data.items.length()").value(2))
        .andExpect(jsonPath("$.data.items[0].deltaPercent").doesNotExist())
        .andExpect(jsonPath("$.data.items[0].previousAmount").doesNotExist());
  }

  @Test
  @DisplayName("카테고리 분류 통계 - compareWithPrev=true (delta 계산)")
  void getCategoryBreakdown_WithPrev() throws Exception {
    User user = fixtures.getDefaultUser();
    Family family = fixtures.getDefaultFamily();
    Category foodCategory =
        fixtures.categories.category(family).name("식비").color("#FF5733").icon("🍕").build();

    LocalDateTime april = LocalDateTime.of(2025, 4, 15, 10, 0);
    LocalDateTime may = LocalDateTime.of(2025, 5, 15, 10, 0);

    createExpense(
        family.getUuid(), user.getUuid(), foodCategory.getUuid(), BigDecimal.valueOf(50000), april);
    createExpense(
        family.getUuid(), user.getUuid(), foodCategory.getUuid(), BigDecimal.valueOf(75000), may);

    mockMvc
        .perform(
            get(
                    "/api/v1/families/{familyUuid}/dashboard/stats/category-breakdown",
                    family.getUuid().getValue())
                .param("year", "2025")
                .param("month", "5")
                .param("compareWithPrev", "true")
                .contentType(MediaType.APPLICATION_JSON))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.data.items[0].deltaPercent").value(50.0))
        .andExpect(jsonPath("$.data.items[0].previousAmount").value(50000));
  }

  @Test
  @DisplayName("카테고리 분류 통계 - 직전 달 지출이 없으면 previousAmount 0, deltaPercent 없음")
  void getCategoryBreakdown_NewCategoryThisMonth() throws Exception {
    User user = fixtures.getDefaultUser();
    Family family = fixtures.getDefaultFamily();
    Category giftCategory =
        fixtures.categories.category(family).name("선물").color("#FF5733").icon("🎁").build();

    createExpense(
        family.getUuid(),
        user.getUuid(),
        giftCategory.getUuid(),
        BigDecimal.valueOf(30000),
        LocalDateTime.of(2025, 5, 10, 10, 0));

    mockMvc
        .perform(
            get(
                    "/api/v1/families/{familyUuid}/dashboard/stats/category-breakdown",
                    family.getUuid().getValue())
                .param("year", "2025")
                .param("month", "5")
                .param("compareWithPrev", "true")
                .contentType(MediaType.APPLICATION_JSON))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.data.items[0].previousAmount").value(0))
        .andExpect(jsonPath("$.data.items[0].deltaPercent").doesNotExist());
  }

  @Test
  @DisplayName("카테고리 분류 통계 - 월 경계 지출 제외 및 전월 비교")
  void getCategoryBreakdown_ExcludesNextMonthBoundaryExpense() throws Exception {
    User user = fixtures.getDefaultUser();
    Family family = fixtures.getDefaultFamily();
    Category foodCategory =
        fixtures.categories.category(family).name("식비").color("#FF5733").icon("🍕").build();

    createExpense(
        family.getUuid(),
        user.getUuid(),
        foodCategory.getUuid(),
        BigDecimal.valueOf(10000),
        LocalDateTime.of(2026, 3, 31, 23, 59));
    createExpense(
        family.getUuid(),
        user.getUuid(),
        foodCategory.getUuid(),
        BigDecimal.valueOf(20000),
        LocalDateTime.of(2026, 4, 1, 0, 0));
    createExpense(
        family.getUuid(),
        user.getUuid(),
        foodCategory.getUuid(),
        BigDecimal.valueOf(30000),
        LocalDateTime.of(2026, 4, 2, 12, 0));

    mockMvc
        .perform(
            get(
                    "/api/v1/families/{familyUuid}/dashboard/stats/category-breakdown",
                    family.getUuid().getValue())
                .param("year", "2026")
                .param("month", "3")
                .contentType(MediaType.APPLICATION_JSON))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.data.totalExpense").value(10000))
        .andExpect(jsonPath("$.data.items[0].totalAmount").value(10000));

    mockMvc
        .perform(
            get(
                    "/api/v1/families/{familyUuid}/dashboard/stats/category-breakdown",
                    family.getUuid().getValue())
                .param("year", "2026")
                .param("month", "4")
                .param("compareWithPrev", "true")
                .contentType(MediaType.APPLICATION_JSON))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.data.totalExpense").value(50000))
        .andExpect(jsonPath("$.data.items[0].totalAmount").value(50000))
        .andExpect(jsonPath("$.data.items[0].deltaPercent").value(400.0));
  }

  @Test
  @DisplayName("카테고리 분류 통계 - 데이터 없으면 빈 items")
  void getCategoryBreakdown_Empty() throws Exception {
    Family family = fixtures.getDefaultFamily();

    mockMvc
        .perform(
            get(
                    "/api/v1/families/{familyUuid}/dashboard/stats/category-breakdown",
                    family.getUuid().getValue())
                .param("year", "2025")
                .param("month", "1")
                .contentType(MediaType.APPLICATION_JSON))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.data.totalExpense").value(0))
        .andExpect(jsonPath("$.data.items").isEmpty());
  }

  // ===== Helper Methods =====

  private String budgetSummaryPath(Family family) {
    return "/api/v1/families/" + family.getUuid().getValue() + "/dashboard/budget-summary";
  }

  private void createBudgetItem(Family family, String name, int limit, Category... categories)
      throws Exception {
    BudgetItemRequest request =
        new BudgetItemRequest(
            name,
            BigDecimal.valueOf(limit),
            java.util.Arrays.stream(categories).map(c -> c.getUuid().getValue()).toList());
    mockMvc
        .perform(
            post("/api/v1/families/" + family.getUuid().getValue() + "/budget-items")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
        .andExpect(status().isCreated());
  }

  /** 월 예산과 두 항목(한도 각 400,000)을 가진 가족에 예산 요약 시나리오의 지출을 넣는다. */
  private Family familyWithTwoItems(int monthlyBudget) throws Exception {
    Family family = fixtures.families.family().budget(BigDecimal.valueOf(monthlyBudget)).build();
    Category husband = fixtures.categories.category(family).name("남편 용돈 카테고리").build();
    Category wife = fixtures.categories.category(family).name("아내 용돈 카테고리").build();
    createBudgetItem(family, "남편 용돈", 400000, husband);
    createBudgetItem(family, "아내 용돈", 400000, wife);

    Category food = fixtures.categories.category(family).name("식비").build();
    LocalDateTime date = LocalDateTime.of(2026, 10, 5, 12, 0);
    fixtures
        .expenses
        .expense(family, husband)
        .amount(BigDecimal.valueOf(150000))
        .date(date)
        .build();
    fixtures.expenses.expense(family, wife).amount(BigDecimal.valueOf(410000)).date(date).build();
    fixtures.expenses.expense(family, food).amount(BigDecimal.valueOf(620000)).date(date).build();
    fixtures
        .expenses
        .expense(family, food)
        .amount(BigDecimal.valueOf(50000))
        .date(date)
        .recurringExpenseUuid(CustomUuid.generate().getValue())
        .build();
    return family;
  }

  @Test
  @DisplayName("예산 요약 조회 - 예산, 생활비, 항목별 쓴 금액과 한도를 돌려준다")
  void getBudgetSummary_Success() throws Exception {
    Family family = familyWithTwoItems(1800000);

    mockMvc
        .perform(get(budgetSummaryPath(family)).param("year", "2026").param("month", "10"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.data.year").value(2026))
        .andExpect(jsonPath("$.data.month").value(10))
        .andExpect(jsonPath("$.data.total.spent").value(1180000))
        .andExpect(jsonPath("$.data.total.limit").value(1800000))
        .andExpect(jsonPath("$.data.living.spent").value(620000))
        .andExpect(jsonPath("$.data.living.limit").value(1000000))
        .andExpect(jsonPath("$.data.allocationExceeded").value(false))
        .andExpect(jsonPath("$.data.items.length()").value(2))
        .andExpect(jsonPath("$.data.items[0].name").value("남편 용돈"))
        .andExpect(jsonPath("$.data.items[0].spent").value(150000))
        .andExpect(jsonPath("$.data.items[0].limit").value(400000))
        .andExpect(jsonPath("$.data.items[1].name").value("아내 용돈"))
        .andExpect(jsonPath("$.data.items[1].spent").value(410000));
  }

  @Test
  @DisplayName("예산 요약 조회 - 항목 한도 합이 월 예산을 넘으면 생활비 한도는 0 이고 allocationExceeded 는 true 다")
  void getBudgetSummary_AllocationExceeded() throws Exception {
    Family family = familyWithTwoItems(500000);

    mockMvc
        .perform(get(budgetSummaryPath(family)).param("year", "2026").param("month", "10"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.data.total.limit").value(500000))
        .andExpect(jsonPath("$.data.living.limit").value(0))
        .andExpect(jsonPath("$.data.allocationExceeded").value(true));
  }

  @Test
  @DisplayName("예산 요약 조회 - 월 예산이 0 이면 생활비 한도는 0 이고 allocationExceeded 는 false 다")
  void getBudgetSummary_ZeroBudgetWithItems() throws Exception {
    Family family = familyWithTwoItems(0);

    mockMvc
        .perform(get(budgetSummaryPath(family)).param("year", "2026").param("month", "10"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.data.total.limit").value(0))
        .andExpect(jsonPath("$.data.living.limit").value(0))
        .andExpect(jsonPath("$.data.allocationExceeded").value(false));
  }

  @Test
  @DisplayName("예산 요약 조회 - 항목이 없고 월 예산이 0 이면 빈 배열과 한도 0 이다")
  void getBudgetSummary_Empty() throws Exception {
    Family family = fixtures.families.family().budget(BigDecimal.ZERO).build();

    mockMvc
        .perform(get(budgetSummaryPath(family)).param("year", "2026").param("month", "10"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.data.items.length()").value(0))
        .andExpect(jsonPath("$.data.total.limit").value(0))
        .andExpect(jsonPath("$.data.total.spent").value(0))
        .andExpect(jsonPath("$.data.living.limit").value(0))
        .andExpect(jsonPath("$.data.living.spent").value(0))
        .andExpect(jsonPath("$.data.allocationExceeded").value(false));
  }

  @Test
  @DisplayName("예산 요약 조회 - 지출에 예산 제외 표시가 있으면 항목 합계에서 빠진다")
  void getBudgetSummary_ExcludedExpenseIsNotCounted() throws Exception {
    Family family = fixtures.families.family().budget(BigDecimal.valueOf(1000000)).build();
    Category allowance = fixtures.categories.category(family).name("용돈 카테고리").build();
    createBudgetItem(family, "용돈", 400000, allowance);

    LocalDateTime date = LocalDateTime.of(2026, 10, 5, 12, 0);
    fixtures
        .expenses
        .expense(family, allowance)
        .amount(BigDecimal.valueOf(30000))
        .date(date)
        .build();
    fixtures
        .expenses
        .expense(family, allowance)
        .amount(BigDecimal.valueOf(70000))
        .date(date)
        .excludeFromBudget(true)
        .build();

    mockMvc
        .perform(get(budgetSummaryPath(family)).param("year", "2026").param("month", "10"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.data.items[0].spent").value(30000));
  }

  @Test
  @DisplayName("예산 요약 조회 - year 나 month 가 없으면 400")
  void getBudgetSummary_MissingParams() throws Exception {
    Family family = fixtures.getDefaultFamily();

    mockMvc
        .perform(get(budgetSummaryPath(family)).param("month", "10"))
        .andExpect(status().isBadRequest());
    mockMvc
        .perform(get(budgetSummaryPath(family)).param("year", "2026"))
        .andExpect(status().isBadRequest());
  }

  @Test
  @DisplayName("예산 요약 조회 - month 가 1~12 밖이면 400")
  void getBudgetSummary_MonthOutOfRange() throws Exception {
    Family family = fixtures.getDefaultFamily();

    mockMvc
        .perform(get(budgetSummaryPath(family)).param("year", "2026").param("month", "13"))
        .andExpect(status().isBadRequest());
    mockMvc
        .perform(get(budgetSummaryPath(family)).param("year", "2026").param("month", "0"))
        .andExpect(status().isBadRequest());
  }

  private Expense createExpense(
      CustomUuid familyUuid,
      CustomUuid userUuid,
      CustomUuid categoryUuid,
      BigDecimal amount,
      LocalDateTime date) {
    com.bifos.accountbook.family.domain.entity.Family family =
        familyRepository
            .findByUuid(familyUuid)
            .orElseThrow(() -> new RuntimeException("Family not found"));

    Expense expense =
        Expense.builder()
            .uuid(CustomUuid.generate())
            .family(family) // JPA 연관관계 사용
            .userUuid(userUuid)
            .categoryUuid(categoryUuid)
            .amount(amount)
            .description("테스트 지출")
            .date(date)
            .status(ExpenseStatus.ACTIVE)
            .build();
    return expenseRepository.save(expense);
  }

  private Income createIncome(
      CustomUuid familyUuid,
      CustomUuid userUuid,
      CustomUuid categoryUuid,
      BigDecimal amount,
      LocalDateTime date) {
    com.bifos.accountbook.family.domain.entity.Family family =
        familyRepository
            .findByUuid(familyUuid)
            .orElseThrow(() -> new RuntimeException("Family not found"));

    Income income =
        Income.builder()
            .uuid(CustomUuid.generate())
            .family(family) // JPA 연관관계 사용
            .userUuid(userUuid)
            .categoryUuid(categoryUuid)
            .amount(amount)
            .description("테스트 수입")
            .date(date)
            .build();
    return incomeRepository.save(income);
  }
}
