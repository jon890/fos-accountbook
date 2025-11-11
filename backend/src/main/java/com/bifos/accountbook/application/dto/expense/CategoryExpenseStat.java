package com.bifos.accountbook.application.dto.expense;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

/**
 * 카테고리별 지출 통계 DTO
 */
@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CategoryExpenseStat {

    /**
     * 카테고리 UUID
     */
    private String categoryUuid;

    /**
     * 카테고리 이름
     */
    private String categoryName;

    /**
     * 카테고리 아이콘
     */
    private String categoryIcon;

    /**
     * 카테고리 색상
     */
    private String categoryColor;

    /**
     * 해당 카테고리 지출 합계
     */
    private BigDecimal totalAmount;

    /**
     * 지출 건수
     */
    private Long count;

    /**
     * 전체 대비 비율 (%)
     */
    private Double percentage;
}

