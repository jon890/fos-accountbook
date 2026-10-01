package com.bifos.accountbook.category.domain.value;

import com.bifos.accountbook.shared.value.CodeEnum;
import lombok.Getter;
import lombok.RequiredArgsConstructor;

/** 카테고리가 사용할 수 있는 거래 종류입니다. */
@Getter
@RequiredArgsConstructor
public enum CategoryType implements CodeEnum {
  EXPENSE("EXPENSE"),
  INCOME("INCOME");

  private final String code;
}
