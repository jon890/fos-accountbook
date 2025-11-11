package com.bifos.accountbook.infra.persistence.repository.projection;

import com.bifos.accountbook.domain.repository.projection.CategoryExpenseProjection;
import lombok.AllArgsConstructor;
import lombok.Getter;

import java.math.BigDecimal;

/**
 * CategoryExpenseProjection 구현체
 * - QueryDSL Tuple을 Projection 인터페이스로 변환하기 위한 구현 클래스
 * - Infrastructure Layer의 구현 세부사항
 */
@Getter
@AllArgsConstructor
public class CategoryExpenseProjectionImpl implements CategoryExpenseProjection {
    
    private final String categoryUuid;
    private final String categoryName;
    private final String categoryIcon;
    private final String categoryColor;
    private final BigDecimal totalAmount;
    private final Long count;
}

