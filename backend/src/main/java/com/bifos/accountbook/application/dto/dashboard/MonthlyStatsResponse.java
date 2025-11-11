package com.bifos.accountbook.application.dto.dashboard;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

/**
 * 월별 통계 응답 DTO
 * - 지출 합계
 * - 수입 합계
 * - 가족 구성원 수
 * - 예산 정보
 */
@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MonthlyStatsResponse {

    /**
     * 해당 월의 지출 합계
     */
    private BigDecimal monthlyExpense;

    /**
     * 해당 월의 수입 합계
     */
    private BigDecimal monthlyIncome;

    /**
     * 남은 예산 (예산 - 지출)
     */
    private BigDecimal remainingBudget;

    /**
     * 가족 구성원 수
     */
    private Integer familyMembers;

    /**
     * 월 예산 (향후 예산 기능 구현 시 사용)
     */
    private BigDecimal budget;

    /**
     * 연도
     */
    private Integer year;

    /**
     * 월 (1~12)
     */
    private Integer month;
}

