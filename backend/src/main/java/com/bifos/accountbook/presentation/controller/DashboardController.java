package com.bifos.accountbook.presentation.controller;

import com.bifos.accountbook.application.dto.dashboard.MonthlyStatsResponse;
import com.bifos.accountbook.application.dto.expense.CategoryExpenseSummaryResponse;
import com.bifos.accountbook.application.dto.expense.ExpenseSummarySearchRequest;
import com.bifos.accountbook.application.service.DashboardService;
import com.bifos.accountbook.domain.value.CustomUuid;
import com.bifos.accountbook.presentation.annotation.LoginUser;
import com.bifos.accountbook.presentation.dto.ApiSuccessResponse;
import com.bifos.accountbook.presentation.dto.LoginUserDto;
import java.time.LocalDate;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

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
      @PathVariable CustomUuid familyUuid,
      @RequestParam(required = false) String startDate,
      @RequestParam(required = false) String endDate,
      @RequestParam(required = false) String categoryUuid) {

    ExpenseSummarySearchRequest searchRequest = ExpenseSummarySearchRequest.withDefaults(
        startDate, endDate, categoryUuid);

    CategoryExpenseSummaryResponse response = dashboardService.getCategoryExpenseSummary(
        loginUser.userUuid(), familyUuid, searchRequest);

    return ResponseEntity.ok(ApiSuccessResponse.of(response));
  }

  /**
   * 월별 통계 조회 (QueryDSL 기반)
   * - 지출 합계, 수입 합계를 DB에서 직접 집계
   * - 기존 프론트에서 1000개 가져와서 필터링하던 방식 개선
   *
   * @param loginUser  로그인 사용자
   * @param familyUuid 가족 UUID
   * @param year       연도 (선택, 기본값: 현재 연도)
   * @param month      월 (선택, 기본값: 현재 월)
   * @return 월별 통계 (지출, 수입, 예산, 가족 구성원 수)
   */
  @GetMapping("/stats/monthly")
  public ResponseEntity<ApiSuccessResponse<MonthlyStatsResponse>> getMonthlyStats(
      @LoginUser LoginUserDto loginUser,
      @PathVariable CustomUuid familyUuid,
      @RequestParam(required = false) Integer year,
      @RequestParam(required = false) Integer month) {

    // 기본값: 현재 연도/월
    LocalDate now = LocalDate.now();
    int targetYear = year != null ? year : now.getYear();
    int targetMonth = month != null ? month : now.getMonthValue();

    MonthlyStatsResponse response = dashboardService.getMonthlyStats(
        loginUser.userUuid(), familyUuid, targetYear, targetMonth);

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

