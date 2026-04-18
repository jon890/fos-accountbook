package com.bifos.accountbook.dashboard.presentation.controller;

import com.bifos.accountbook.shared.AbstractControllerTest;

import com.bifos.accountbook.category.domain.entity.Category;
import com.bifos.accountbook.expense.domain.entity.Expense;
import com.bifos.accountbook.family.domain.entity.Family;
import com.bifos.accountbook.income.domain.entity.Income;
import com.bifos.accountbook.user.domain.entity.User;
import com.bifos.accountbook.expense.domain.repository.ExpenseRepository;
import com.bifos.accountbook.family.domain.repository.FamilyRepository;
import com.bifos.accountbook.income.domain.repository.IncomeRepository;
import com.bifos.accountbook.shared.value.CustomUuid;
import com.bifos.accountbook.expense.domain.value.ExpenseStatus;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import static org.hamcrest.Matchers.greaterThan;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * DashboardController 통합 테스트
 * - 대시보드 통계 API 검증
 * - 카테고리별 지출 요약
 * - 실제 API 엔드포인트 테스트
 * - AbstractControllerTest를 상속받아 테스트 환경 자동 설정
 */
@DisplayName("DashboardController 통합 테스트")
class DashboardControllerTest extends AbstractControllerTest {

  @Autowired
  private ExpenseRepository expenseRepository;

  @Autowired
  private IncomeRepository incomeRepository;

  @Autowired
  private FamilyRepository familyRepository;

  @Test
  @DisplayName("카테고리별 지출 요약 조회 - 성공")
  void getCategoryExpenseSummary_Success() throws Exception {
    // Given: 테스트 데이터 생성 (Fluent API)
    Family family = fixtures.getDefaultFamily();
    Category foodCategory = fixtures.categories.category(family).name("식비").color("#FF5733").icon("🍕").build();
    Category transportCategory = fixtures.categories.category(family).name("교통비").color("#3498DB").icon("🚗").build();

    LocalDateTime now = LocalDateTime.now();

    // 식비 지출 3건
    fixtures.expenses.expense(family, foodCategory).amount(BigDecimal.valueOf(15000)).date(now.minusDays(1)).build();
    fixtures.expenses.expense(family, foodCategory).amount(BigDecimal.valueOf(20000)).date(now.minusDays(2)).build();
    fixtures.expenses.expense(family, foodCategory).amount(BigDecimal.valueOf(25000)).date(now.minusDays(3)).build();

    // 교통비 지출 2건
    fixtures.expenses.expense(family, transportCategory).amount(BigDecimal.valueOf(5000)).date(now.minusDays(1)).build();
    fixtures.expenses.expense(family, transportCategory).amount(BigDecimal.valueOf(10000)).date(now.minusDays(2)).build();

    // When & Then: 대시보드 API 호출
    mockMvc.perform(get("/api/v1/families/{familyUuid}/dashboard/expenses/by-category", family.getUuid().getValue())
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

    fixtures.expenses.expense(family, foodCategory).amount(BigDecimal.valueOf(10000)).date(now.minusDays(1)).build();
    fixtures.expenses.expense(family, foodCategory).amount(BigDecimal.valueOf(20000)).date(now.minusDays(10)).build(); // 오래됨

    // When & Then: 최근 5일만 필터링
    mockMvc.perform(get("/api/v1/families/{familyUuid}/dashboard/expenses/by-category", family.getUuid().getValue())
                        .param("startDate", now.minusDays(5).toString())
                        .param("endDate", now.toString())
                        .contentType(MediaType.APPLICATION_JSON))
           .andExpect(status().isOk())
           .andExpect(jsonPath("$.data.totalExpense").value(10000))
           .andExpect(jsonPath("$.data.categoryStats.length()").value(1));
  }

  @Test
  @DisplayName("카테고리별 지출 요약 - 카테고리 필터링")
  void getCategoryExpenseSummary_WithCategoryFilter() throws Exception {
    // Given: 테스트 데이터 생성 (Fluent API)
    Family family = fixtures.getDefaultFamily();
    Category foodCategory = fixtures.categories.category(family).name("식비").color("#FF5733").icon("🍕").build();
    Category transportCategory = fixtures.categories.category(family).name("교통비").color("#3498DB").icon("🚗").build();

    LocalDateTime now = LocalDateTime.now();

    fixtures.expenses.expense(family, foodCategory).amount(BigDecimal.valueOf(10000)).date(now).build();
    fixtures.expenses.expense(family, transportCategory).amount(BigDecimal.valueOf(5000)).date(now).build();

    // When & Then: 식비만 조회
    mockMvc.perform(get("/api/v1/families/{familyUuid}/dashboard/expenses/by-category", family.getUuid().getValue())
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
    mockMvc.perform(get("/api/v1/families/{familyUuid}/dashboard/expenses/by-category", family.getUuid().getValue())
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
    mockMvc.perform(get("/api/v1/families/{familyUuid}/dashboard/expenses/by-category", otherFamilyUuid.getValue())
                        .contentType(MediaType.APPLICATION_JSON))
           .andExpect(status().isForbidden());
  }

  @Test
  @DisplayName("월별 통계 조회 - 성공 (QueryDSL 집계)")
  void getMonthlyStats_Success() throws Exception {
    // Given: 테스트 데이터 생성 (Fluent API)
    User user = fixtures.getDefaultUser();
    Family family = fixtures.getDefaultFamily();
    Category foodCategory = fixtures.categories.category(family).name("식비").color("#FF5733").icon("🍕").build();
    Category transportCategory = fixtures.categories.category(family).name("교통비").color("#3498DB").icon("🚗").build();

    LocalDateTime now = LocalDateTime.now();
    final int year = now.getYear();
    final int month = now.getMonthValue();

    // 이번 달 지출: 50,000원 (음식) + 30,000원 (교통) = 80,000원
    createExpense(family.getUuid(), user.getUuid(), foodCategory.getUuid(),
                  BigDecimal.valueOf(50000), now);
    createExpense(family.getUuid(), user.getUuid(), transportCategory.getUuid(),
                  BigDecimal.valueOf(30000), now);

    // 이번 달 수입: 100,000원
    createIncome(family.getUuid(), user.getUuid(), foodCategory.getUuid(),
                 BigDecimal.valueOf(100000), now);

    // 다른 달 지출 (집계에서 제외되어야 함)
    createExpense(family.getUuid(), user.getUuid(), foodCategory.getUuid(),
                  BigDecimal.valueOf(20000), now.minusMonths(1));

    // When & Then: 월별 통계 조회
    mockMvc.perform(get("/api/v1/families/{familyUuid}/dashboard/stats/monthly", family.getUuid().getValue())
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
    mockMvc.perform(get("/api/v1/families/{familyUuid}/dashboard/stats/monthly", family.getUuid().getValue())
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
    Family family = fixtures.families.family().name("우리집").budget(BigDecimal.valueOf(500000)).build(); // 50만원 예산
    Category foodCategory = fixtures.categories.category(family).name("식비").color("#FF5733").icon("🍕").build();
    Category transportCategory = fixtures.categories.category(family).name("교통비").color("#3498DB").icon("🚗").build();

    LocalDateTime now = LocalDateTime.now();
    final int year = now.getYear();
    final int month = now.getMonthValue();

    // 이번 달 지출: 200,000원
    createExpense(family.getUuid(), user.getUuid(), foodCategory.getUuid(),
                  BigDecimal.valueOf(150000), now);
    createExpense(family.getUuid(), user.getUuid(), transportCategory.getUuid(),
                  BigDecimal.valueOf(50000), now);

    // 이번 달 수입: 300,000원
    createIncome(family.getUuid(), user.getUuid(), foodCategory.getUuid(),
                 BigDecimal.valueOf(300000), now);

    // When & Then: 월별 통계 조회
    mockMvc.perform(get("/api/v1/families/{familyUuid}/dashboard/stats/monthly", family.getUuid().getValue())
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
    Family family = fixtures.families.family().name("우리집").budget(BigDecimal.valueOf(100000)).build(); // 10만원 예산
    Category foodCategory = fixtures.categories.category(family).build();

    LocalDateTime now = LocalDateTime.now();
    int year = now.getYear();
    int month = now.getMonthValue();

    // 이번 달 지출: 150,000원 (예산 초과)
    createExpense(family.getUuid(), user.getUuid(), foodCategory.getUuid(),
                  BigDecimal.valueOf(150000), now);

    // When & Then: 남은 예산이 음수로 표시됨
    mockMvc.perform(get("/api/v1/families/{familyUuid}/dashboard/stats/monthly", family.getUuid().getValue())
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
    Category foodCategory = fixtures.categories.category(family).name("식비").color("#FF5733").icon("🍕").build();
    Category transportCategory = fixtures.categories.category(family).name("교통비").color("#3498DB").icon("🚗").build();

    LocalDateTime now = LocalDateTime.now();

    createExpense(family.getUuid(), user.getUuid(), foodCategory.getUuid(),
                  BigDecimal.valueOf(30000), now.withDayOfMonth(1));
    createExpense(family.getUuid(), user.getUuid(), transportCategory.getUuid(),
                  BigDecimal.valueOf(20000), now.withDayOfMonth(1));
    createIncome(family.getUuid(), user.getUuid(), foodCategory.getUuid(),
                 BigDecimal.valueOf(100000), now.withDayOfMonth(1));
    createExpense(family.getUuid(), user.getUuid(), foodCategory.getUuid(),
                  BigDecimal.valueOf(15000), now.withDayOfMonth(5));
    createIncome(family.getUuid(), user.getUuid(), foodCategory.getUuid(),
                 BigDecimal.valueOf(200000), now.withDayOfMonth(10));

    int year = now.getYear();
    int month = now.getMonthValue();

    mockMvc.perform(get("/api/v1/families/{familyUuid}/dashboard/daily-stats", family.getUuid().getValue())
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
  @DisplayName("일별 통계 조회 - 거래 없는 달")
  void getDailyStats_NoTransactions() throws Exception {
    // Given: 빈 가족
    Family family = fixtures.getDefaultFamily();

    LocalDateTime now = LocalDateTime.now();
    int year = now.getYear();
    int month = now.getMonthValue();

    // When & Then: 빈 통계 반환
    mockMvc.perform(get("/api/v1/families/{familyUuid}/dashboard/daily-stats", family.getUuid().getValue())
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

    createExpense(family.getUuid(), user.getUuid(), foodCategory.getUuid(),
                  BigDecimal.valueOf(30000), now.withDayOfMonth(1));
    createExpense(family.getUuid(), user.getUuid(), foodCategory.getUuid(),
                  BigDecimal.valueOf(50000), now.minusMonths(1));
    createExpense(family.getUuid(), user.getUuid(), foodCategory.getUuid(),
                  BigDecimal.valueOf(40000), now.plusMonths(1));

    int year = now.getYear();
    int month = now.getMonthValue();

    mockMvc.perform(get("/api/v1/families/{familyUuid}/dashboard/daily-stats", family.getUuid().getValue())
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
    CustomUuid otherFamilyUuid = CustomUuid.generate();

    // When & Then: 권한 없는 가족 조회 시 에러
    mockMvc.perform(get("/api/v1/families/{familyUuid}/dashboard/daily-stats", otherFamilyUuid.getValue())
                        .param("year", "2024")
                        .param("month", "1")
                        .contentType(MediaType.APPLICATION_JSON))
           .andExpect(status().isForbidden());
  }

  // ===== Helper Methods =====

  private Expense createExpense(CustomUuid familyUuid, CustomUuid userUuid, CustomUuid categoryUuid,
                                BigDecimal amount, LocalDateTime date) {
    com.bifos.accountbook.family.domain.entity.Family family = familyRepository.findByUuid(familyUuid)
                                                                        .orElseThrow(() -> new RuntimeException("Family not found"));

    Expense expense = Expense.builder()
                             .uuid(CustomUuid.generate())
                             .family(family)  // JPA 연관관계 사용
                             .userUuid(userUuid)
                             .categoryUuid(categoryUuid)
                             .amount(amount)
                             .description("테스트 지출")
                             .date(date)
                             .status(ExpenseStatus.ACTIVE)
                             .build();
    return expenseRepository.save(expense);
  }

  private Income createIncome(CustomUuid familyUuid, CustomUuid userUuid, CustomUuid categoryUuid,
                              BigDecimal amount, LocalDateTime date) {
    com.bifos.accountbook.family.domain.entity.Family family = familyRepository.findByUuid(familyUuid)
                                                                        .orElseThrow(() -> new RuntimeException("Family not found"));

    Income income = Income.builder()
                          .uuid(CustomUuid.generate())
                          .family(family)  // JPA 연관관계 사용
                          .userUuid(userUuid)
                          .categoryUuid(categoryUuid)
                          .amount(amount)
                          .description("테스트 수입")
                          .date(date)
                          .build();
    return incomeRepository.save(income);
  }
}
