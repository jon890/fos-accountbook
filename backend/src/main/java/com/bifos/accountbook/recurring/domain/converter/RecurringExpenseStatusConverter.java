package com.bifos.accountbook.recurring.domain.converter;

import com.bifos.accountbook.shared.converter.AbstractCodeEnumConverter;

import com.bifos.accountbook.recurring.domain.value.RecurringExpenseStatus;
import jakarta.persistence.Converter;

@Converter(autoApply = true)
public class RecurringExpenseStatusConverter
    extends AbstractCodeEnumConverter<RecurringExpenseStatus> {

  public RecurringExpenseStatusConverter() {
    super(RecurringExpenseStatus.class);
  }
}
