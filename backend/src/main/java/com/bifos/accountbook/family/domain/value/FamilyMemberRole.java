package com.bifos.accountbook.family.domain.value;

import com.bifos.accountbook.shared.value.CodeEnum;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

/**
 * 가족 구성원 역할
 */
@Getter
@RequiredArgsConstructor
public enum FamilyMemberRole implements CodeEnum {
  /**
   * 소유자 - 가족을 생성한 관리자
   */
  OWNER("owner"),

  /**
   * 일반 구성원
   */
  MEMBER("member");

  private final String code;
}
