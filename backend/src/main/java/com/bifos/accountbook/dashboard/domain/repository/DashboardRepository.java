package com.bifos.accountbook.dashboard.domain.repository;

import com.bifos.accountbook.dashboard.domain.repository.projection.MonthlyTrendProjection;
import com.bifos.accountbook.expense.domain.repository.projection.CategoryExpenseProjection;
import com.bifos.accountbook.shared.value.CustomUuid;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

/**
 * 대시보드 통계 Repository 인터페이스 - 지출/수입 통계 조회 - 카테고리별 집계 - 기간별 트렌드 분석
 *
 * <p>QueryDSL 기반으로 복잡한 통계 쿼리 제공
 */
public interface DashboardRepository {

  /**
   * 카테고리별 지출 통계 조회 - LEFT JOIN으로 Category 정보 결합 - GROUP BY로 카테고리별 집계 - 금액 기준 내림차순 정렬
   *
   * @param familyUuid 가족 UUID (필수)
   * @param categoryUuid 카테고리 UUID (선택, null이면 전체)
   * @param startDate 시작 날짜 (선택, null이면 제한 없음)
   * @param endDate 종료 날짜 (선택, null이면 제한 없음)
   * @return 카테고리별 지출 통계 목록
   */
  List<CategoryExpenseProjection> getCategoryExpenseStats(
      CustomUuid familyUuid,
      CustomUuid categoryUuid,
      LocalDateTime startDate,
      LocalDateTime endDate);

  /**
   * 종료 날짜를 포함하지 않는 카테고리별 지출 통계 조회
   *
   * @param familyUuid 가족 UUID (필수)
   * @param categoryUuid 카테고리 UUID (선택, null이면 전체)
   * @param startDate 시작 날짜 (선택, null이면 제한 없음)
   * @param endDate 종료 날짜 (선택, null이면 제한 없음)
   * @return 카테고리별 지출 통계 목록
   */
  List<CategoryExpenseProjection> getCategoryExpenseStatsBefore(
      CustomUuid familyUuid,
      CustomUuid categoryUuid,
      LocalDateTime startDate,
      LocalDateTime endDate);

  /**
   * 전체 지출 합계 조회 - SUM 집계 - 동적 조건 필터링
   *
   * @param familyUuid 가족 UUID (필수)
   * @param categoryUuid 카테고리 UUID (선택, null이면 전체)
   * @param startDate 시작 날짜 (선택, null이면 제한 없음)
   * @param endDate 종료 날짜 (선택, null이면 제한 없음)
   * @return 지출 합계 (지출이 없으면 0)
   */
  BigDecimal getTotalExpenseAmount(
      CustomUuid familyUuid,
      CustomUuid categoryUuid,
      LocalDateTime startDate,
      LocalDateTime endDate);

  /**
   * 특정 월의 예산 합계 조회 (QueryDSL) - YEAR(date), MONTH(date) 조건 사용 - ACTIVE 상태만 집계
   *
   * <p>예산 제외 지출, 예산 제외 카테고리의 지출, 반복 지출이 만든 지출은 뺀다. 예산 항목에 속한 카테고리의 지출은 포함한다 (ADR-B26).
   *
   * @param familyUuid 가족 UUID (필수)
   * @param year 연도 (예: 2025)
   * @param month 월 (1~12)
   * @return 예산 합계 (없으면 0)
   */
  BigDecimal getMonthlyExpenseAmount(CustomUuid familyUuid, int year, int month);

  /**
   * 특정 월의 생활비 합계 조회. 예산 합계에서 예산 항목에 속한 카테고리의 지출을 뺀 값이다 (ADR-B26).
   *
   * @param familyUuid 가족 UUID (필수)
   * @param year 연도 (예: 2025)
   * @param month 월 (1~12)
   * @return 생활비 합계 (없으면 0)
   */
  BigDecimal getMonthlyLivingExpenseAmount(CustomUuid familyUuid, int year, int month);

  /**
   * 특정 월의 예산 항목별 지출 합계 조회. ACTIVE 지출 가운데 카테고리가 항목에 속하고 지출 자체에 예산 제외 표시가 없는 것을 더한다 (ADR-B25).
   *
   * @return 예산 항목 UUID 값별 합계. 지출이 없는 항목은 키가 없다
   */
  Map<String, BigDecimal> getMonthlyExpenseAmountsByBudgetItem(
      CustomUuid familyUuid, int year, int month);

  /**
   * 특정 월의 수입 합계 조회 (QueryDSL) - YEAR(date), MONTH(date) 조건 사용 - ACTIVE 상태만 집계
   *
   * @param familyUuid 가족 UUID (필수)
   * @param year 연도 (예: 2025)
   * @param month 월 (1~12)
   * @return 수입 합계 (없으면 0)
   */
  BigDecimal getMonthlyIncomeAmount(CustomUuid familyUuid, int year, int month);

  Map<Integer, Map<String, BigDecimal>> getDailyExpenseAmountsByMember(
      CustomUuid familyUuid, int year, int month);

  java.util.Map<Integer, BigDecimal> getDailyIncomeAmounts(
      CustomUuid familyUuid, int year, int month);

  List<MonthlyTrendProjection> getMonthlyExpenseTrend(
      CustomUuid familyUuid, LocalDateTime from, LocalDateTime to);
}
