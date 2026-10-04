package com.bifos.accountbook.installment.domain.converter;

import com.bifos.accountbook.installment.domain.value.InstallmentStatus;
import com.bifos.accountbook.shared.converter.AbstractCodeEnumConverter;
import jakarta.persistence.Converter;

@Converter(autoApply = true)
public class InstallmentStatusConverter extends AbstractCodeEnumConverter<InstallmentStatus> {

  public InstallmentStatusConverter() {
    super(InstallmentStatus.class);
  }
}
