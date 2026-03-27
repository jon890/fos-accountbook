package com.bifos.accountbook.domain.entity.converter;

import com.bifos.accountbook.domain.value.FamilyMemberRole;
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
