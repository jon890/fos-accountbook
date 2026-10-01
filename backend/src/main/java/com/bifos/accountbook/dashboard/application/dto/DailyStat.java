package com.bifos.accountbook.dashboard.application.dto;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
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

  @Builder.Default private BigDecimal income = BigDecimal.ZERO;

  @Builder.Default private BigDecimal expense = BigDecimal.ZERO;

  @Builder.Default private List<MemberAmount> memberExpenses = new ArrayList<>();
}
