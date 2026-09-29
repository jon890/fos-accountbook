package com.bifos.accountbook.dashboard.presentation.controller;

import com.bifos.accountbook.dashboard.application.dto.CategoryBreakdownResponse;
import com.bifos.accountbook.dashboard.application.dto.DailyStatsResponse;
import com.bifos.accountbook.dashboard.application.dto.MonthlyStatsResponse;
import com.bifos.accountbook.dashboard.application.dto.MonthlyTrendResponse;
import com.bifos.accountbook.expense.application.dto.CategoryExpenseSummaryResponse;
import com.bifos.accountbook.expense.application.dto.ExpenseSummarySearchRequest;
import com.bifos.accountbook.dashboard.application.service.DashboardService;
import com.bifos.accountbook.shared.value.CustomUuid;
import com.bifos.accountbook.shared.auth.LoginUser;
import com.bifos.accountbook.shared.dto.ApiSuccessResponse;
import com.bifos.accountbook.shared.auth.LoginUserDto;
import com.bifos.accountbook.shared.exception.BusinessException;
import com.bifos.accountbook.shared.exception.ErrorCode;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import java.time.LocalDate;
import java.time.YearMonth;
import java.time.format.DateTimeParseException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@Tag(name = "대시보드 (Dashboard)", description = "지출 통계 및 대시보드 API")
@Slf4j
@RestController
@RequestMapping("/api/v1/families/{familyUuid}/dashboard")
@RequiredArgsConstructor
@SecurityRequirement(name = "bearerAuth")
public class DashboardController {

  private final DashboardService dashboardService;

  @Operation(summary = "카테고리별 지출 요약", description = "가족의 카테고리별 지출 요약을 조회합니다.")
  @ApiResponse(responseCode = "200", description = "조회 성공")
  @GetMapping("/expenses/by-category")
  public ResponseEntity<ApiSuccessResponse<CategoryExpenseSummaryResponse>> getCategoryExpenseSummary(
      @LoginUser LoginUserDto loginUser,
      @Parameter(description = "가족 UUID") @PathVariable CustomUuid familyUuid,
      @RequestParam(required = false) String startDate,
      @RequestParam(required = false) String endDate,
      @RequestParam(required = false) String categoryUuid) {

    ExpenseSummarySearchRequest searchRequest = ExpenseSummarySearchRequest.withDefaults(
        startDate, endDate, categoryUuid);

    CategoryExpenseSummaryResponse response = dashboardService.getCategoryExpenseSummary(
        loginUser.userUuid(), familyUuid, searchRequest);

    return ResponseEntity.ok(ApiSuccessResponse.of(response));
  }

  @Operation(summary = "월별 통계 조회", description = "가족의 월별 통계를 조회합니다.")
  @ApiResponse(responseCode = "200", description = "조회 성공")
  @GetMapping("/stats/monthly")
  public ResponseEntity<ApiSuccessResponse<MonthlyStatsResponse>> getMonthlyStats(
      @LoginUser LoginUserDto loginUser,
      @Parameter(description = "가족 UUID") @PathVariable CustomUuid familyUuid,
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

  @Operation(summary = "월별 트렌드 조회", description = "가족의 월별 지출 트렌드를 조회합니다.")
  @ApiResponse(responseCode = "200", description = "조회 성공")
  @GetMapping("/stats/monthly-trend")
  public ResponseEntity<ApiSuccessResponse<MonthlyTrendResponse>> getMonthlyTrend(
      @LoginUser LoginUserDto loginUser,
      @Parameter(description = "가족 UUID") @PathVariable CustomUuid familyUuid,
      @RequestParam String from,
      @RequestParam String to) {

    YearMonth fromYearMonth;
    YearMonth toYearMonth;
    try {
      fromYearMonth = YearMonth.parse(from);
      toYearMonth = YearMonth.parse(to);
    } catch (DateTimeParseException e) {
      throw new BusinessException(ErrorCode.INVALID_INPUT_VALUE);
    }

    if (fromYearMonth.isAfter(toYearMonth)) {
      throw new BusinessException(ErrorCode.INVALID_INPUT_VALUE);
    }

    MonthlyTrendResponse response = dashboardService.getMonthlyTrend(
        loginUser.userUuid(), familyUuid, fromYearMonth, toYearMonth);

    return ResponseEntity.ok(ApiSuccessResponse.of(response));
  }

  @Operation(summary = "카테고리 분류 통계", description = "가족의 월별 카테고리 분류 통계를 조회합니다.")
  @ApiResponse(responseCode = "200", description = "조회 성공")
  @GetMapping("/stats/category-breakdown")
  public ResponseEntity<ApiSuccessResponse<CategoryBreakdownResponse>> getCategoryBreakdown(
      @LoginUser LoginUserDto loginUser,
      @Parameter(description = "가족 UUID") @PathVariable CustomUuid familyUuid,
      @RequestParam Integer year,
      @RequestParam Integer month,
      @RequestParam(defaultValue = "false") boolean compareWithPrev) {

    CategoryBreakdownResponse response = dashboardService.getCategoryBreakdown(
        loginUser.userUuid(), familyUuid, year, month, compareWithPrev);

    return ResponseEntity.ok(ApiSuccessResponse.of(response));
  }

  @Operation(summary = "일별 통계 조회", description = "가족의 일별 통계를 조회합니다.")
  @ApiResponse(responseCode = "200", description = "조회 성공")
  @GetMapping("/daily-stats")
  public ResponseEntity<ApiSuccessResponse<DailyStatsResponse>> getDailyStats(
      @LoginUser LoginUserDto loginUser,
      @Parameter(description = "가족 UUID") @PathVariable CustomUuid familyUuid,
      @RequestParam Integer year,
      @RequestParam Integer month) {

    DailyStatsResponse response = dashboardService.getDailyStats(
        loginUser.userUuid(), familyUuid, year, month);

    return ResponseEntity.ok(ApiSuccessResponse.of(response));
  }
}

