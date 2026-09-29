package com.bifos.accountbook.family.domain.converter;

import com.bifos.accountbook.shared.converter.AbstractCodeEnumConverter;

import com.bifos.accountbook.family.domain.value.FamilyStatus;
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

