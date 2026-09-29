package com.bifos.accountbook.expense.domain.converter;

import com.bifos.accountbook.shared.converter.AbstractCodeEnumConverter;

import com.bifos.accountbook.expense.domain.value.ExpenseStatus;
import jakarta.persistence.Converter;

/**
 * ExpenseStatus Enum을 DB 코드값으로 변환하는 Converter
 */
@Converter(autoApply = true)
public class ExpenseStatusConverter extends AbstractCodeEnumConverter<ExpenseStatus> {

  public ExpenseStatusConverter() {
    super(ExpenseStatus.class);
  }
}

