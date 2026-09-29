package com.bifos.accountbook.family.domain.converter;

import com.bifos.accountbook.shared.converter.AbstractCodeEnumConverter;

import com.bifos.accountbook.family.domain.value.FamilyMemberRole;
import jakarta.persistence.Converter;

/**
 * FamilyMemberRole Enum을 DB 코드값으로 변환하는 Converter
 */
@Converter(autoApply = true)
public class FamilyMemberRoleConverter extends AbstractCodeEnumConverter<FamilyMemberRole> {

  public FamilyMemberRoleConverter() {
    super(FamilyMemberRole.class);
  }
}
