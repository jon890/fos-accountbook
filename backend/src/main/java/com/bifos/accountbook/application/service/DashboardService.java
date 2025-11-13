package com.bifos.accountbook.application.service;

import com.bifos.accountbook.application.dto.dashboard.MonthlyStatsResponse;
import com.bifos.accountbook.application.dto.expense.CategoryExpenseStat;
import com.bifos.accountbook.application.dto.expense.CategoryExpenseSummaryResponse;
import com.bifos.accountbook.application.dto.expense.ExpenseSummarySearchRequest;
import com.bifos.accountbook.domain.entity.Family;
import com.bifos.accountbook.domain.repository.DashboardRepository;
import com.bifos.accountbook.domain.repository.FamilyRepository;
import com.bifos.accountbook.domain.repository.projection.CategoryExpenseProjection;
import com.bifos.accountbook.domain.value.CustomUuid;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.ArrayList;
import java.util.List;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * 대시보드 서비스 - 대시보드 통계 데이터 조회 - 지출/수입 요약 통계 - 카테고리별 집계
 */
@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class DashboardService {

  private final DashboardRepository dashboardRepository;
  private final FamilyRepository familyRepository;
  private final FamilyValidationService familyValidationService;

  /**
   * 카테고리별 지출 요약 조회 - 전체 지출 합계 - 카테고리별 지출 통계 (금액, 건수, 비율)
   *
   * @param userUuid      사용자 UUID
   * @param familyUuid    가족 UUID
   * @param searchRequest 검색 조건 (날짜, 카테고리)
   * @return 카테고리별 지출 요약
   */
  public CategoryExpenseSummaryResponse getCategoryExpenseSummary(
      CustomUuid userUuid,
      String familyUuid,
      ExpenseSummarySearchRequest searchRequest) {

    CustomUuid familyCustomUuid = CustomUuid.from(familyUuid);

    // 권한 확인
    familyValidationService.validateFamilyAccess(userUuid, familyCustomUuid);

    // 카테고리 UUID 변환 (null 가능)
    CustomUuid categoryCustomUuid = searchRequest.getCategoryUuid() != null
        ? CustomUuid.from(searchRequest.getCategoryUuid())
        : null;

    // 전체 지출 합계 조회
    BigDecimal totalExpense = dashboardRepository.getTotalExpenseAmount(familyCustomUuid,
                                                                        categoryCustomUuid,
                                                                        searchRequest.getStartDate(),
                                                                        searchRequest.getEndDate());

    // 카테고리별 지출 통계 조회
    List<CategoryExpenseProjection> projections = dashboardRepository.getCategoryExpenseStats(familyCustomUuid,
                                                                                              categoryCustomUuid,
                                                                                              searchRequest.getStartDate(),
                                                                                              searchRequest.getEndDate());

    // DTO 변환 및 비율 계산
    List<CategoryExpenseStat> categoryStats = convertToStats(projections, totalExpense);

    return CategoryExpenseSummaryResponse.builder()
                                         .totalExpense(totalExpense)
                                         .categoryStats(categoryStats)
                                         .build();
  }

  /**
   * Projection을 DTO로 변환하고 비율 계산
   */
  private List<CategoryExpenseStat> convertToStats(
      List<CategoryExpenseProjection> projections,
      BigDecimal totalExpense) {

    List<CategoryExpenseStat> categoryStats = new ArrayList<>();

    for (CategoryExpenseProjection projection : projections) {
      // 비율 계산 (소수점 2자리)
      Double percentage = calculatePercentage(projection.totalAmount(), totalExpense);

      CategoryExpenseStat stat = CategoryExpenseStat.builder()
                                                    .categoryUuid(projection.categoryUuid())
                                                    .categoryName(projection.categoryName())
                                                    .categoryIcon(projection.categoryIcon())
                                                    .categoryColor(projection.categoryColor())
                                                    .totalAmount(projection.totalAmount())
                                                    .count(projection.count())
                                                    .percentage(percentage)
                                                    .build();

      categoryStats.add(stat);
    }

    return categoryStats;
  }

  /**
   * 비율 계산 (소수점 2자리)
   */
  private Double calculatePercentage(BigDecimal amount, BigDecimal total) {
    if (total.compareTo(BigDecimal.ZERO) <= 0) {
      return 0.0;
    }

    return amount
        .multiply(BigDecimal.valueOf(100))
        .divide(total, 2, RoundingMode.HALF_UP)
        .doubleValue();
  }

  /**
   * 월별 통계 조회 (QueryDSL 기반) - 이번 달 지출/수입 합계를 백엔드에서 직접 집계 - 프론트에서 1000개 가져와서 필터링하던 비효율 개선
   *
   * @param userUuid   사용자 UUID
   * @param familyUuid 가족 UUID
   * @param year       연도 (예: 2025)
   * @param month      월 (1~12)
   * @return 월별 통계 (지출, 수입, 예산, 가족 구성원 수)
   */
  public MonthlyStatsResponse getMonthlyStats(
      CustomUuid userUuid,
      String familyUuid,
      int year,
      int month) {

    CustomUuid familyCustomUuid = CustomUuid.from(familyUuid);

    // 권한 확인
    familyValidationService.validateFamilyAccess(userUuid, familyCustomUuid);

    // 가족 정보 조회 (구성원 수)
    Family family = familyRepository.findByUuid(familyCustomUuid)
                                    .orElseThrow(() -> new IllegalArgumentException("가족을 찾을 수 없습니다"));

    // QueryDSL로 월별 지출 합계 조회 (DB에서 직접 집계)
    BigDecimal monthlyExpense = dashboardRepository.getMonthlyExpenseAmount(
        familyCustomUuid, year, month);

    // QueryDSL로 월별 수입 합계 조회 (DB에서 직접 집계)
    BigDecimal monthlyIncome = dashboardRepository.getMonthlyIncomeAmount(
        familyCustomUuid, year, month);

    // 가족의 월 예산 조회
    BigDecimal budget = family.getMonthlyBudget() != null
        ? family.getMonthlyBudget()
        : BigDecimal.ZERO;

    // 남은 예산 계산 (예산 - 지출)
    BigDecimal remainingBudget = budget.subtract(monthlyExpense);

    return MonthlyStatsResponse.builder()
                               .monthlyExpense(monthlyExpense)
                               .monthlyIncome(monthlyIncome)
                               .remainingBudget(remainingBudget)
                               .familyMembers(family.getMembers() != null ? family.getMembers().size() : 0)
                               .budget(budget)
                               .year(year)
                               .month(month)
                               .build();
  }
}

