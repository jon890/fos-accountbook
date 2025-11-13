package com.bifos.accountbook.domain.repository;

import com.bifos.accountbook.domain.repository.projection.CategoryExpenseProjection;
import com.bifos.accountbook.domain.value.CustomUuid;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

/**
 * 대시보드 통계 Repository 인터페이스
 * - 지출/수입 통계 조회
 * - 카테고리별 집계
 * - 기간별 트렌드 분석
 *
 * QueryDSL 기반으로 복잡한 통계 쿼리 제공
 */
public interface DashboardRepository {

  /**
   * 카테고리별 지출 통계 조회
   * - LEFT JOIN으로 Category 정보 결합
   * - GROUP BY로 카테고리별 집계
   * - 금액 기준 내림차순 정렬
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
      LocalDateTime endDate
  );

  /**
   * 전체 지출 합계 조회
   * - SUM 집계
   * - 동적 조건 필터링
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
      LocalDateTime endDate
  );

  /**
   * 특정 월의 지출 합계 조회 (QueryDSL)
   * - YEAR(date), MONTH(date) 조건 사용
   * - ACTIVE 상태만 집계
   *
   * @param familyUuid 가족 UUID (필수)
   * @param year 연도 (예: 2025)
   * @param month 월 (1~12)
   * @return 지출 합계 (없으면 0)
   */
  BigDecimal getMonthlyExpenseAmount(
      CustomUuid familyUuid,
      int year,
      int month
  );

  /**
   * 특정 월의 수입 합계 조회 (QueryDSL)
   * - YEAR(date), MONTH(date) 조건 사용
   * - ACTIVE 상태만 집계
   *
   * @param familyUuid 가족 UUID (필수)
   * @param year 연도 (예: 2025)
   * @param month 월 (1~12)
   * @return 수입 합계 (없으면 0)
   */
  BigDecimal getMonthlyIncomeAmount(
      CustomUuid familyUuid,
      int year,
      int month
  );

  // ===== 향후 추가 가능한 메서드 =====

  /**
   * 월별 지출 트렌드 조회
   * TODO: 향후 구현
   */
  // List<MonthlyExpenseTrend> getMonthlyExpenseTrend(CustomUuid familyUuid, int months);

  /**
   * 카테고리별 수입 통계 조회
   * TODO: 향후 구현
   */
  // List<CategoryIncomeProjection> getCategoryIncomeStats(...);

  /**
   * 가족 멤버별 지출 통계 조회
   * TODO: 향후 구현
   */
  // List<MemberExpenseProjection> getMemberExpenseStats(...);
}

