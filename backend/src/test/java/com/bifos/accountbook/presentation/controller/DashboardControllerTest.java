package com.bifos.accountbook.presentation.controller;

import com.bifos.accountbook.common.AbstractControllerTest;
import com.bifos.accountbook.domain.entity.Category;
import com.bifos.accountbook.domain.entity.Expense;
import com.bifos.accountbook.domain.entity.Family;
import com.bifos.accountbook.domain.entity.Income;
import com.bifos.accountbook.domain.entity.User;
import com.bifos.accountbook.domain.repository.ExpenseRepository;
import com.bifos.accountbook.domain.repository.IncomeRepository;
import com.bifos.accountbook.domain.value.CustomUuid;
import com.bifos.accountbook.domain.value.ExpenseStatus;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;

import java.math.BigDecimal;
import java.time.LocalDateTime;

import static org.hamcrest.Matchers.greaterThan;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

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

    @Test
    @DisplayName("카테고리별 지출 요약 조회 - 성공")
    void getCategoryExpenseSummary_Success() throws Exception {
        // Given: 테스트 데이터 생성
        User user = testUserHolder.getUser();
        Family family = testUserHolder.getFamily();
        Category foodCategory = testUserHolder.createCategory(family, "식비", "#FF5733", "🍕");
        Category transportCategory = testUserHolder.createCategory(family, "교통비", "#3498DB", "🚗");
        
        LocalDateTime now = LocalDateTime.now();

        // 식비 지출 3건
        createExpense(family.getUuid(), user.getUuid(), foodCategory.getUuid(), BigDecimal.valueOf(15000), now.minusDays(1));
        createExpense(family.getUuid(), user.getUuid(), foodCategory.getUuid(), BigDecimal.valueOf(20000), now.minusDays(2));
        createExpense(family.getUuid(), user.getUuid(), foodCategory.getUuid(), BigDecimal.valueOf(25000), now.minusDays(3));

        // 교통비 지출 2건
        createExpense(family.getUuid(), user.getUuid(), transportCategory.getUuid(), BigDecimal.valueOf(5000), now.minusDays(1));
        createExpense(family.getUuid(), user.getUuid(), transportCategory.getUuid(), BigDecimal.valueOf(10000), now.minusDays(2));

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
        // Given: 테스트 데이터 생성
        User user = testUserHolder.getUser();
        Family family = testUserHolder.getFamily();
        Category foodCategory = testUserHolder.getCategory();
        
        LocalDateTime now = LocalDateTime.now();

        createExpense(family.getUuid(), user.getUuid(), foodCategory.getUuid(), BigDecimal.valueOf(10000), now.minusDays(1));
        createExpense(family.getUuid(), user.getUuid(), foodCategory.getUuid(), BigDecimal.valueOf(20000), now.minusDays(10)); // 오래됨

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
        // Given: 테스트 데이터 생성
        User user = testUserHolder.getUser();
        Family family = testUserHolder.getFamily();
        Category foodCategory = testUserHolder.createCategory(family, "식비", "#FF5733", "🍕");
        Category transportCategory = testUserHolder.createCategory(family, "교통비", "#3498DB", "🚗");
        
        LocalDateTime now = LocalDateTime.now();

        createExpense(family.getUuid(), user.getUuid(), foodCategory.getUuid(), BigDecimal.valueOf(10000), now);
        createExpense(family.getUuid(), user.getUuid(), transportCategory.getUuid(), BigDecimal.valueOf(5000), now);

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
        Family family = testUserHolder.getFamily();

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
        CustomUuid otherFamilyUuid = CustomUuid.generate();
        
        // When & Then: 권한 없는 가족 조회 시 에러
        mockMvc.perform(get("/api/v1/families/{familyUuid}/dashboard/expenses/by-category", otherFamilyUuid.getValue())
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("월별 통계 조회 - 성공 (QueryDSL 집계)")
    void getMonthlyStats_Success() throws Exception {
        // Given: 테스트 데이터 생성
        User user = testUserHolder.getUser();
        Family family = testUserHolder.getFamily();
        Category foodCategory = testUserHolder.createCategory(family, "식비", "#FF5733", "🍕");
        Category transportCategory = testUserHolder.createCategory(family, "교통비", "#3498DB", "🚗");
        
        LocalDateTime now = LocalDateTime.now();
        int year = now.getYear();
        int month = now.getMonthValue();

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
        Family family = testUserHolder.getFamily();

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
        // Given: 테스트 데이터 생성
        User user = testUserHolder.getUser();
        Family family = testUserHolder.createFamily("우리집", BigDecimal.valueOf(500000)); // 50만원 예산
        Category foodCategory = testUserHolder.createCategory(family, "식비", "#FF5733", "🍕");
        Category transportCategory = testUserHolder.createCategory(family, "교통비", "#3498DB", "🚗");
        
        LocalDateTime now = LocalDateTime.now();
        int year = now.getYear();
        int month = now.getMonthValue();

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
        // Given: 테스트 데이터 생성
        User user = testUserHolder.getUser();
        Family family = testUserHolder.createFamily("우리집", BigDecimal.valueOf(100000)); // 10만원 예산
        Category foodCategory = testUserHolder.getCategory(family);
        
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

    // ===== Helper Methods =====

    private Expense createExpense(CustomUuid familyUuid, CustomUuid userUuid, CustomUuid categoryUuid,
                                  BigDecimal amount, LocalDateTime date) {
        Expense expense = Expense.builder()
                .uuid(CustomUuid.generate())
                .familyUuid(familyUuid)
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
        Income income = Income.builder()
                .uuid(CustomUuid.generate())
                .familyUuid(familyUuid)
                .userUuid(userUuid)
                .categoryUuid(categoryUuid)
                .amount(amount)
                .description("테스트 수입")
                .date(date)
                .build();
        return incomeRepository.save(income);
    }
}
