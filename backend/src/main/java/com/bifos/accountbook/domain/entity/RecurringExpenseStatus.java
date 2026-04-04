package com.bifos.accountbook.domain.entity;

import com.bifos.accountbook.domain.value.CodeEnum;
import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum RecurringExpenseStatus implements CodeEnum {

  ACTIVE("ACTIVE"),

  ENDED("ENDED");

  private final String code;
}
