package com.bifos.accountbook.dashboard.application.dto;

import java.math.BigDecimal;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CategoryBreakdownItem {

  private String categoryUuid;
  private String name;
  private String icon;
  private String color;
  private BigDecimal totalAmount;
  private Double percentage;
  private Double deltaPercent;

  /** 직전 달 같은 카테고리 금액. 비교를 요청하지 않으면 null, 직전 달 지출이 없으면 0 이다. */
  private BigDecimal previousAmount;
}
