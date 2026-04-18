package com.bifos.accountbook.income.domain.value;

import com.bifos.accountbook.shared.value.CodeEnum;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

/**
 * 수입 상태
 */
@Getter
@RequiredArgsConstructor
public enum IncomeStatus implements CodeEnum {
  /**
   * 활성 상태
   */
  ACTIVE("ACTIVE"),

  /**
   * 삭제됨
   */
  DELETED("DELETED");

  private final String code;
}

