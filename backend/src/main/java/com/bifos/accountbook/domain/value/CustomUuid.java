package com.bifos.accountbook.domain.value;

import java.io.Serializable;
import java.util.UUID;
import lombok.EqualsAndHashCode;
import lombok.Getter;

/**
 * Custom UUID Value Object
 * <p>
 * DB에는 VARCHAR(36)으로 저장되지만, 애플리케이션에서는 타입 안전한 객체로 사용
 * 불변 객체로 설계되어 안전성 보장
 */
@Getter
@EqualsAndHashCode
public class CustomUuid implements Serializable {

  private final String value;

  private CustomUuid(String value) {
    if (value == null || value.trim().isEmpty()) {
      throw new IllegalArgumentException("UUID value cannot be null or empty");
    }
    // UUID 형식 검증
    try {
      UUID.fromString(value);
    } catch (IllegalArgumentException e) {
      throw new IllegalArgumentException("Invalid UUID format: " + value, e);
    }
    this.value = value;
  }

  /**
   * 새로운 UUID 생성
   */
  public static CustomUuid generate() {
    return new CustomUuid(UUID.randomUUID().toString());
  }

  /**
   * 기존 UUID 문자열로부터 생성
   */
  public static CustomUuid from(String value) {
    return new CustomUuid(value);
  }
}
