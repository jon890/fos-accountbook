package com.bifos.accountbook.recurring.domain.value;

import com.bifos.accountbook.shared.value.CodeEnum;
import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum RecurringExpenseStatus implements CodeEnum {

  ACTIVE("ACTIVE"),

  ENDED("ENDED");

  private final String code;
}
