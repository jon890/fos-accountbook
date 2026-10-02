package com.bifos.accountbook.dashboard.application.dto;

import java.math.BigDecimal;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

/** 예산 요약의 생활비. limit 은 가족의 월 예산이다. */
@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BudgetSummaryLiving {

  private BigDecimal spent;

  private BigDecimal limit;
}
