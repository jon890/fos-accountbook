package com.bifos.accountbook.domain.value;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

/**
 * 초대 상태
 */
@Getter
@RequiredArgsConstructor
public enum InvitationStatus implements CodeEnum {
  /**
   * 대기 중 - 수락 대기 상태
   */
  PENDING("PENDING"),

  /**
   * 수락됨 - 초대가 수락된 상태
   */
  ACCEPTED("ACCEPTED");

  private final String code;
}
