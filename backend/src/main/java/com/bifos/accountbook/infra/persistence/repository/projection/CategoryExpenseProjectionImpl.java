package com.bifos.accountbook.infra.persistence.repository.projection;

import com.bifos.accountbook.domain.repository.projection.CategoryExpenseProjection;
import java.math.BigDecimal;

/**
 * CategoryExpenseProjection 구현체
 * - QueryDSL Tuple을 Projection 인터페이스로 변환하기 위한 구현 클래스
 * - Infrastructure Layer의 구현 세부사항
 */
public record CategoryExpenseProjectionImpl(String categoryUuid,
                                            String categoryName,
                                            String categoryIcon,
                                            String categoryColor,
                                            BigDecimal totalAmount,
                                            Long count) implements CategoryExpenseProjection {

}

