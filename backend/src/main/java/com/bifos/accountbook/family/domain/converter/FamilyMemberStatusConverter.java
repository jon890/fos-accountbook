package com.bifos.accountbook.family.domain.converter;

import com.bifos.accountbook.shared.converter.AbstractCodeEnumConverter;

import com.bifos.accountbook.family.domain.value.FamilyMemberStatus;
import jakarta.persistence.Converter;

/**
 * FamilyMemberStatus Enum을 DB 코드값으로 변환하는 Converter
 */
@Converter(autoApply = true)
public class FamilyMemberStatusConverter extends AbstractCodeEnumConverter<FamilyMemberStatus> {

  public FamilyMemberStatusConverter() {
    super(FamilyMemberStatus.class);
  }
}

