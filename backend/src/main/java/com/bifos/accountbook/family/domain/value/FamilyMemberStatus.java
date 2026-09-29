package com.bifos.accountbook.family.domain.value;

import com.bifos.accountbook.shared.value.CodeEnum;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

/**
 * 가족 구성원 상태
 */
@Getter
@RequiredArgsConstructor
public enum FamilyMemberStatus implements CodeEnum {
  /**
   * 활성 상태 - 가족 구성원으로 활동 중
   */
  ACTIVE("ACTIVE"),

  /**
   * 탈퇴 - 가족에서 나감
   */
  LEFT("LEFT");

  private final String code;
}

