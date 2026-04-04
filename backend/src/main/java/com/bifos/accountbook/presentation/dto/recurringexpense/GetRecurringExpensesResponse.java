package com.bifos.accountbook.presentation.dto.recurringexpense;

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
public class GetRecurringExpensesResponse {

  private BigDecimal totalMonthlyAmount;
  private List<RecurringExpenseResponse> items;
}
