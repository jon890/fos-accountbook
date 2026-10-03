package com.bifos.accountbook.dashboard.application.dto;

import java.math.BigDecimal;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

/** 예산 요약의 한 줄(예산 또는 생활비). limit 이 0 이면 한도 없음이다. */
@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BudgetSummaryAmount {

  private BigDecimal spent;

  private BigDecimal limit;
}
