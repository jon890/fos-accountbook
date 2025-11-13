package com.bifos.accountbook.domain.value;

/**
 * 코드값을 가진 Enum을 위한 공통 인터페이스
 * DB에 코드값으로 저장하고, 코드값으로부터 Enum을 복원할 수 있습니다.
 */
public interface CodeEnum {
  /**
   * DB에 저장될 코드값을 반환합니다.
   *
   * @return 코드값
   */
  String getCode();
}

