package com.bifos.accountbook.presentation.controller;

import com.bifos.accountbook.application.dto.dashboard.DailyStatsResponse;
import com.bifos.accountbook.application.dto.dashboard.MonthlyStatsResponse;
import com.bifos.accountbook.application.dto.expense.CategoryExpenseSummaryResponse;
import com.bifos.accountbook.application.dto.expense.ExpenseSummarySearchRequest;
import com.bifos.accountbook.application.service.DashboardService;
import com.bifos.accountbook.domain.value.CustomUuid;
import com.bifos.accountbook.presentation.annotation.LoginUser;
import com.bifos.accountbook.presentation.dto.ApiSuccessResponse;
import com.bifos.accountbook.presentation.dto.LoginUserDto;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import java.time.LocalDate;
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

