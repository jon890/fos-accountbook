package com.bifos.accountbook.domain.repository.projection;

import java.math.BigDecimal;

/**
 * 카테고리별 지출 집계 프로젝션
 */
public interface CategoryExpenseProjection {
    
    /**
     * 카테고리 UUID
     */
    String getCategoryUuid();
    
    /**
     * 카테고리 이름
     */
    String getCategoryName();
    
    /**
     * 카테고리 아이콘
     */
    String getCategoryIcon();
    
    /**
     * 카테고리 색상
     */
    String getCategoryColor();
    
    /**
     * 총 지출 금액
     */
    BigDecimal getTotalAmount();
    
    /**
     * 지출 건수
     */
    Long getCount();
}

