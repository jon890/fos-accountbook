package com.bifos.accountbook.application.dto.dashboard;

import java.math.BigDecimal;
import java.time.LocalDate;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DailyStat {

  private LocalDate date;

  @Builder.Default
  private BigDecimal income = BigDecimal.ZERO;

  @Builder.Default
  private BigDecimal expense = BigDecimal.ZERO;
}
