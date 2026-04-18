package com.bifos.accountbook.invitation.domain.converter;

import com.bifos.accountbook.shared.converter.AbstractCodeEnumConverter;

import com.bifos.accountbook.invitation.domain.value.InvitationStatus;
import jakarta.persistence.Converter;

/**
 * InvitationStatus Enum을 DB 코드값으로 변환하는 Converter
 */
@Converter(autoApply = true)
public class InvitationStatusConverter extends AbstractCodeEnumConverter<InvitationStatus> {

  public InvitationStatusConverter() {
    super(InvitationStatus.class);
  }
}
