package com.bifos.accountbook.domain.entity.converter;

import com.bifos.accountbook.domain.value.UserStatus;
import jakarta.persistence.Converter;

/**
 * UserStatus Enum을 DB 코드값으로 변환하는 Converter
 * <p>
 * autoApply = true로 설정하여 모든 UserStatus 필드에 자동 적용됩니다.
 * </p>
 */
@Converter(autoApply = true)
public class UserStatusConverter extends AbstractCodeEnumConverter<UserStatus> {

  public UserStatusConverter() {
    super(UserStatus.class);
  }
}

