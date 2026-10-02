package com.bifos.accountbook.dashboard.application.dto;

import java.math.BigDecimal;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

/** 예산 요약의 예산 항목. limit 이 0 이면 한도 없음이다. */
@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BudgetSummaryItem {

  private String budgetItemUuid;

  private String name;

  private BigDecimal limit;

  private BigDecimal spent;
}
