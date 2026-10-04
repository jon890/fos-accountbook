package com.bifos.accountbook.installment.domain.value;

import java.math.BigDecimal;
import java.time.YearMonth;

/** 기준 월에서 본 할부 납부 계획. 금액은 모두 원 단위 정수(scale 0)다. */
public record InstallmentSchedule(
    YearMonth endMonth,
    BigDecimal monthlyAmount,
    BigDecimal firstMonthAmount,
    int currentRound,
    BigDecimal thisMonthAmount,
    BigDecimal remainingAmount,
    InstallmentProgress progress) {}
