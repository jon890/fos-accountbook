package com.bifos.accountbook.presentation.controller;

import com.bifos.accountbook.application.dto.expense.CategoryExpenseSummaryResponse;
import com.bifos.accountbook.application.dto.expense.ExpenseSummarySearchRequest;
import com.bifos.accountbook.application.service.DashboardService;
import com.bifos.accountbook.presentation.annotation.LoginUser;
import com.bifos.accountbook.presentation.dto.ApiSuccessResponse;
import com.bifos.accountbook.presentation.dto.LoginUserDto;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

/**
 * 대시보드 컨트롤러
 * - 대시보드 통계 데이터 API
 * - 지출/수입 요약
 * - 카테고리별 집계
 */
@Slf4j
@RestController
@RequestMapping("/api/v1/families/{familyUuid}/dashboard")
@RequiredArgsConstructor
public class DashboardController {

    private final DashboardService dashboardService;

    /**
     * 카테고리별 지출 요약 조회
     *
     * @param loginUser    로그인 사용자
     * @param familyUuid   가족 UUID
     * @param startDate    시작 날짜 (선택)
     * @param endDate      종료 날짜 (선택)
     * @param categoryUuid 카테고리 UUID (선택)
     * @return 카테고리별 지출 요약 (전체 합계 + 카테고리별 통계)
     */
    @GetMapping("/expenses/by-category")
    public ResponseEntity<ApiSuccessResponse<CategoryExpenseSummaryResponse>> getCategoryExpenseSummary(
            @LoginUser LoginUserDto loginUser,
            @PathVariable String familyUuid,
            @RequestParam(required = false) String startDate,
            @RequestParam(required = false) String endDate,
            @RequestParam(required = false) String categoryUuid) {

        ExpenseSummarySearchRequest searchRequest = ExpenseSummarySearchRequest.withDefaults(
                startDate, endDate, categoryUuid);

        CategoryExpenseSummaryResponse response = dashboardService.getCategoryExpenseSummary(
                loginUser.getUserUuid(), familyUuid, searchRequest);

        return ResponseEntity.ok(ApiSuccessResponse.of(response));
    }

    // ===== 향후 추가 가능한 대시보드 API =====

    /**
     * 월별 지출 트렌드 조회
     * TODO: 향후 구현
     */
    // @GetMapping("/expenses/monthly-trend")
    // public ResponseEntity<ApiSuccessResponse<MonthlyTrendResponse>> getMonthlyExpenseTrend(...) { }

    /**
     * 카테고리별 수입 요약 조회
     * TODO: 향후 구현
     */
    // @GetMapping("/incomes/by-category")
    // public ResponseEntity<ApiSuccessResponse<CategoryIncomeSummaryResponse>> getCategoryIncomeSummary(...) { }

    /**
     * 지출 vs 수입 비교
     * TODO: 향후 구현
     */
    // @GetMapping("/comparison")
    // public ResponseEntity<ApiSuccessResponse<ExpenseIncomeComparisonResponse>> compareExpenseAndIncome(...) { }
}

