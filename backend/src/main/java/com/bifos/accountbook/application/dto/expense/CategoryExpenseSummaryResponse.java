package com.bifos.accountbook.application.dto.expense;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.List;

/**
 * 카테고리별 지출 요약 응답 DTO
 */
@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CategoryExpenseSummaryResponse {

    /**
     * 전체 지출 합계
     */
    private BigDecimal totalExpense;

    /**
     * 카테고리별 통계 목록 (금액 내림차순 정렬)
     */
    private List<CategoryExpenseStat> categoryStats;
}

