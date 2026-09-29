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
}
