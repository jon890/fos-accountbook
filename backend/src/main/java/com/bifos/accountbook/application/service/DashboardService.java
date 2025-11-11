package com.bifos.accountbook.application.service;

import com.bifos.accountbook.application.dto.expense.CategoryExpenseStat;
import com.bifos.accountbook.application.dto.expense.CategoryExpenseSummaryResponse;
import com.bifos.accountbook.application.dto.expense.ExpenseSummarySearchRequest;
import com.bifos.accountbook.domain.repository.DashboardRepository;
import com.bifos.accountbook.domain.repository.projection.CategoryExpenseProjection;
import com.bifos.accountbook.domain.value.CustomUuid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.ArrayList;
import java.util.List;

/**
 * 대시보드 서비스
 * - 대시보드 통계 데이터 조회
 * - 지출/수입 요약 통계
 * - 카테고리별 집계
 */
@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class DashboardService {

    private final DashboardRepository dashboardRepository;
    private final FamilyValidationService familyValidationService;

    /**
     * 카테고리별 지출 요약 조회
     * - 전체 지출 합계
     * - 카테고리별 지출 통계 (금액, 건수, 비율)
     * 
     * @param userUuid 사용자 UUID
     * @param familyUuid 가족 UUID
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
        BigDecimal totalExpense = dashboardRepository.getTotalExpenseAmount(
                familyCustomUuid,
                categoryCustomUuid,
                searchRequest.getStartDate(),
                searchRequest.getEndDate());

        // 카테고리별 지출 통계 조회
        List<CategoryExpenseProjection> projections = dashboardRepository.getCategoryExpenseStats(
                familyCustomUuid,
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
            Double percentage = calculatePercentage(projection.getTotalAmount(), totalExpense);

            CategoryExpenseStat stat = CategoryExpenseStat.builder()
                    .categoryUuid(projection.getCategoryUuid())
                    .categoryName(projection.getCategoryName())
                    .categoryIcon(projection.getCategoryIcon())
                    .categoryColor(projection.getCategoryColor())
                    .totalAmount(projection.getTotalAmount())
                    .count(projection.getCount())
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
}

