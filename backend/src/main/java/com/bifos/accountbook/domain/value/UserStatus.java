package com.bifos.accountbook.domain.value;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

/**
 * 사용자 상태
 */
@Getter
@RequiredArgsConstructor
public enum UserStatus implements CodeEnum {
  /**
   * 활성 상태 - 정상적으로 서비스 이용 중
   */
  ACTIVE("ACTIVE"),

  /**
   * 삭제됨 - 탈퇴 처리된 사용자
   */
  DELETED("DELETED");

  private final String code;
}

