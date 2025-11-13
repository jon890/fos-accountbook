package com.bifos.accountbook.domain.entity.converter;

import com.bifos.accountbook.domain.value.FamilyStatus;
import jakarta.persistence.Converter;

/**
 * FamilyStatus Enum을 DB 코드값으로 변환하는 Converter
 */
@Converter(autoApply = true)
public class FamilyStatusConverter extends AbstractCodeEnumConverter<FamilyStatus> {

  public FamilyStatusConverter() {
    super(FamilyStatus.class);
  }
}

