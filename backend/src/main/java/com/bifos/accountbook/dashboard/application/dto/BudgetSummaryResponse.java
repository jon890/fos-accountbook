package com.bifos.accountbook.dashboard.application.dto;

import java.util.List;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

/** 달력 홈이 한 번에 받는 예산, 생활비와 예산 항목별 쓴 금액과 한도. */
@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BudgetSummaryResponse {

  private Integer year;

  private Integer month;

  /** 예산 합계(항목 지출 포함)와 월 예산 */
  private BudgetSummaryAmount total;

  /** 생활비(항목 지출 제외)와 계산된 한도 */
  private BudgetSummaryAmount living;

  /** 항목 한도 합이 월 예산을 넘었는지 */
  private Boolean allocationExceeded;

  private List<BudgetSummaryItem> items;
}
