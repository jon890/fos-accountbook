package com.bifos.accountbook.budgetitem.domain.converter;

import com.bifos.accountbook.budgetitem.domain.value.BudgetItemStatus;
import com.bifos.accountbook.shared.converter.AbstractCodeEnumConverter;
import jakarta.persistence.Converter;

@Converter(autoApply = true)
public class BudgetItemStatusConverter extends AbstractCodeEnumConverter<BudgetItemStatus> {

  public BudgetItemStatusConverter() {
    super(BudgetItemStatus.class);
  }
}
