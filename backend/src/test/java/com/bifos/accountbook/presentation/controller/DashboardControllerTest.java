package com.bifos.accountbook.presentation.controller;

import com.bifos.accountbook.common.TestUserHolder;
import com.bifos.accountbook.common.DatabaseCleanupExtension;
import com.bifos.accountbook.domain.entity.Category;
import com.bifos.accountbook.domain.entity.Expense;
import com.bifos.accountbook.domain.entity.Family;
import com.bifos.accountbook.domain.entity.FamilyMember;
import com.bifos.accountbook.domain.entity.Income;
import com.bifos.accountbook.domain.entity.User;
import com.bifos.accountbook.domain.repository.CategoryRepository;
import com.bifos.accountbook.domain.repository.ExpenseRepository;
import com.bifos.accountbook.domain.repository.FamilyMemberRepository;
import com.bifos.accountbook.domain.repository.FamilyRepository;
import com.bifos.accountbook.domain.repository.IncomeRepository;
import com.bifos.accountbook.domain.repository.UserRepository;
import com.bifos.accountbook.domain.value.CategoryStatus;
import com.bifos.accountbook.domain.value.CustomUuid;
import com.bifos.accountbook.domain.value.ExpenseStatus;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.test.web.servlet.MockMvc;

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
 */
@SpringBootTest
@AutoConfigureMockMvc
@ExtendWith(DatabaseCleanupExtension.class)
@DisplayName("DashboardController 통합 테스트")
class DashboardControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private FamilyRepository familyRepository;

    @Autowired
    private FamilyMemberRepository familyMemberRepository;

    @Autowired
    private CategoryRepository categoryRepository;

    @Autowired
    private ExpenseRepository expenseRepository;

    @Autowired
    private IncomeRepository incomeRepository;

    private User testUser;
    private Family testFamily;
    private Category foodCategory;
    private Category transportCategory;
    private CustomUuid userUuid;
    private CustomUuid familyUuid;

    @BeforeEach
    void setUp() {
        // Given: 테스트 사용자 및 가족 생성
        userUuid = CustomUuid.generate();
        testUser = User.builder()
                .uuid(userUuid)
                .email("test@example.com")
                .name("테스트 사용자")
                .provider("GOOGLE")
                .providerId("google-123")
                .build();
        testUser = userRepository.save(testUser);

        familyUuid = CustomUuid.generate();
        testFamily = Family.builder()
                .uuid(familyUuid)
                .name("테스트 가족")
                .build();
        testFamily = familyRepository.save(testFamily);

        // 가족 멤버 추가
        FamilyMember member = FamilyMember.builder()
                .familyUuid(familyUuid)
                .userUuid(userUuid)
                .build();
        familyMemberRepository.save(member);

        // 카테고리 생성
        foodCategory = Category.builder()
                .uuid(CustomUuid.generate())
                .familyUuid(familyUuid)
                .name("식비")
                .icon("🍕")
                .color("#FF5733")
                .status(CategoryStatus.ACTIVE)
                .build();
        foodCategory = categoryRepository.save(foodCategory);

        transportCategory = Category.builder()
                .uuid(CustomUuid.generate())
                .familyUuid(familyUuid)
                .name("교통비")
                .icon("🚗")
                .color("#3498DB")
                .status(CategoryStatus.ACTIVE)
                .build();
        transportCategory = categoryRepository.save(transportCategory);

        // 로그인 사용자 설정 (SecurityContext에 인증 정보 설정)
        UsernamePasswordAuthenticationToken authentication =
                new UsernamePasswordAuthenticationToken(testUser.getUuid().getValue(), null, null);
        SecurityContextHolder.getContext().setAuthentication(authentication);
    }

    @Test
    @DisplayName("카테고리별 지출 요약 조회 - 성공")
    void getCategoryExpenseSummary_Success() throws Exception {
        // Given: 여러 지출 데이터 생성
        LocalDateTime now = LocalDateTime.now();

        // 식비 지출 3건
        createExpense(familyUuid, userUuid, foodCategory.getUuid(), BigDecimal.valueOf(15000), now.minusDays(1));
        createExpense(familyUuid, userUuid, foodCategory.getUuid(), BigDecimal.valueOf(20000), now.minusDays(2));
        createExpense(familyUuid, userUuid, foodCategory.getUuid(), BigDecimal.valueOf(25000), now.minusDays(3));

        // 교통비 지출 2건
        createExpense(familyUuid, userUuid, transportCategory.getUuid(), BigDecimal.valueOf(5000), now.minusDays(1));
        createExpense(familyUuid, userUuid, transportCategory.getUuid(), BigDecimal.valueOf(10000), now.minusDays(2));

        // When & Then: 대시보드 API 호출
        mockMvc.perform(get("/api/v1/families/{familyUuid}/dashboard/expenses/by-category", familyUuid.getValue())
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
        // Given: 다양한 날짜의 지출 데이터
        LocalDateTime now = LocalDateTime.now();

        createExpense(familyUuid, userUuid, foodCategory.getUuid(), BigDecimal.valueOf(10000), now.minusDays(1));
        createExpense(familyUuid, userUuid, foodCategory.getUuid(), BigDecimal.valueOf(20000), now.minusDays(10)); // 오래됨

        // When & Then: 최근 5일만 필터링
        mockMvc.perform(get("/api/v1/families/{familyUuid}/dashboard/expenses/by-category", familyUuid.getValue())
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
        // Given: 여러 카테고리 지출
        LocalDateTime now = LocalDateTime.now();

        createExpense(familyUuid, userUuid, foodCategory.getUuid(), BigDecimal.valueOf(10000), now);
        createExpense(familyUuid, userUuid, transportCategory.getUuid(), BigDecimal.valueOf(5000), now);

        // When & Then: 식비만 조회
        mockMvc.perform(get("/api/v1/families/{familyUuid}/dashboard/expenses/by-category", familyUuid.getValue())
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
        // Given: 지출 데이터 없음

        // When & Then: 빈 통계 반환
        mockMvc.perform(get("/api/v1/families/{familyUuid}/dashboard/expenses/by-category", familyUuid.getValue())
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.totalExpense").value(0))
                .andExpect(jsonPath("$.data.categoryStats").isEmpty());
    }

    @Test
    @DisplayName("카테고리별 지출 요약 - 권한 없는 가족 조회 실패")
    void getCategoryExpenseSummary_UnauthorizedFamily() throws Exception {
        // Given: 다른 가족 생성
        CustomUuid otherFamilyUuid = CustomUuid.generate();
        Family otherFamily = Family.builder()
                .uuid(otherFamilyUuid)
                .name("다른 가족")
                .build();
        familyRepository.save(otherFamily);

        // When & Then: 권한 없는 가족 조회 시 에러
        mockMvc.perform(get("/api/v1/families/{familyUuid}/dashboard/expenses/by-category", otherFamilyUuid.getValue())
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("월별 통계 조회 - 성공 (QueryDSL 집계)")
    void getMonthlyStats_Success() throws Exception {
        // Given: 이번 달 지출/수입 데이터 생성
        LocalDateTime now = LocalDateTime.now();
        int year = now.getYear();
        int month = now.getMonthValue();

        // 이번 달 지출: 50,000원 (음식) + 30,000원 (교통) = 80,000원
        createExpense(familyUuid, userUuid, foodCategory.getUuid(), 
                BigDecimal.valueOf(50000), now);
        createExpense(familyUuid, userUuid, transportCategory.getUuid(), 
                BigDecimal.valueOf(30000), now);

        // 이번 달 수입: 100,000원
        createIncome(familyUuid, userUuid, foodCategory.getUuid(), 
                BigDecimal.valueOf(100000), now);

        // 다른 달 지출 (집계에서 제외되어야 함)
        createExpense(familyUuid, userUuid, foodCategory.getUuid(), 
                BigDecimal.valueOf(20000), now.minusMonths(1));

        // When & Then: 월별 통계 조회
        mockMvc.perform(get("/api/v1/families/{familyUuid}/dashboard/stats/monthly", familyUuid.getValue())
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
        // Given: 데이터 없음

        // When & Then: 파라미터 없이 조회 (현재 연월 사용)
        mockMvc.perform(get("/api/v1/families/{familyUuid}/dashboard/stats/monthly", familyUuid.getValue())
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.monthlyExpense").value(0))
                .andExpect(jsonPath("$.data.monthlyIncome").value(0))
                .andExpect(jsonPath("$.data.year").exists())
                .andExpect(jsonPath("$.data.month").exists());
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

