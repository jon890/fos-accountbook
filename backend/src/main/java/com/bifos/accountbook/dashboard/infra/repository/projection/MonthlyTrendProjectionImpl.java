package com.bifos.accountbook.dashboard.infra.repository.projection;

import com.bifos.accountbook.dashboard.domain.repository.projection.MonthlyTrendProjection;
import java.math.BigDecimal;

public record MonthlyTrendProjectionImpl(int year, int month, BigDecimal totalExpense)
    implements MonthlyTrendProjection {

}
