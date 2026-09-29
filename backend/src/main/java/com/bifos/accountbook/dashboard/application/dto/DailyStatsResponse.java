package com.bifos.accountbook.dashboard.application.dto;

import java.math.BigDecimal;
import java.util.List;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DailyStatsResponse {

  private Integer year;
  private Integer month;
  private List<DailyStat> dailyStats;
  private BigDecimal totalIncome;
  private BigDecimal totalExpense;
}
