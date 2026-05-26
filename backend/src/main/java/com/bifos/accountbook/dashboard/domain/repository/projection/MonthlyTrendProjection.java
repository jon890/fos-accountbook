package com.bifos.accountbook.dashboard.domain.repository.projection;

import java.math.BigDecimal;

public interface MonthlyTrendProjection {

  int year();

  int month();

  BigDecimal totalExpense();
}
