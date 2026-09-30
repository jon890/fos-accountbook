package com.bifos.accountbook.apitoken.domain.converter;

import com.bifos.accountbook.apitoken.domain.value.ApiTokenStatus;
import com.bifos.accountbook.shared.converter.AbstractCodeEnumConverter;
import jakarta.persistence.Converter;

@Converter(autoApply = true)
public class ApiTokenStatusConverter extends AbstractCodeEnumConverter<ApiTokenStatus> {

  public ApiTokenStatusConverter() {
    super(ApiTokenStatus.class);
  }
}
