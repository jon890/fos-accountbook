package com.bifos.accountbook.apitoken.domain.value;

import com.bifos.accountbook.shared.value.CodeEnum;
import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum ApiTokenStatus implements CodeEnum {

  ACTIVE("ACTIVE"),

  REVOKED("REVOKED");

  private final String code;
}
