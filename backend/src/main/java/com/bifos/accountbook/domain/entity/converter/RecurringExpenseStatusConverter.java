package com.bifos.accountbook.domain.entity.converter;

import com.bifos.accountbook.domain.entity.RecurringExpenseStatus;
import jakarta.persistence.Converter;

@Converter(autoApply = true)
public class RecurringExpenseStatusConverter
    extends AbstractCodeEnumConverter<RecurringExpenseStatus> {

  public RecurringExpenseStatusConverter() {
    super(RecurringExpenseStatus.class);
  }
}
