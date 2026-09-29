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
public class MonthlyTrendResponse {

  private List<MonthlyTrendPoint> points;
  private BigDecimal average;
}
