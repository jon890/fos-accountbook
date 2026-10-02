package com.bifos.accountbook.dashboard.application.dto;

import java.util.List;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

/** 달력 홈이 한 번에 받는 생활비와 예산 항목별 쓴 금액과 한도. */
@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BudgetSummaryResponse {

  private Integer year;

  private Integer month;

  private BudgetSummaryLiving living;

  private List<BudgetSummaryItem> items;
}
