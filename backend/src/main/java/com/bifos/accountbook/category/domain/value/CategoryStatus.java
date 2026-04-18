package com.bifos.accountbook.category.domain.value;

import com.bifos.accountbook.shared.value.CodeEnum;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

/**
 * 카테고리 상태
 */
@Getter
@RequiredArgsConstructor
public enum CategoryStatus implements CodeEnum {
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

