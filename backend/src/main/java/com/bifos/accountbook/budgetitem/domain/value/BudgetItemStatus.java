package com.bifos.accountbook.budgetitem.domain.value;

import com.bifos.accountbook.shared.value.CodeEnum;
import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum BudgetItemStatus implements CodeEnum {
  ACTIVE("ACTIVE"),

  DELETED("DELETED");

  private final String code;
}
