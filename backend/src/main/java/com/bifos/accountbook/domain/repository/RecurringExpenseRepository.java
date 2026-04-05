package com.bifos.accountbook.domain.repository;

import com.bifos.accountbook.domain.entity.RecurringExpense;
import com.bifos.accountbook.domain.value.CustomUuid;
import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

public interface RecurringExpenseRepository {

  RecurringExpense save(RecurringExpense recurringExpense);

  Optional<RecurringExpense> findActiveByUuid(CustomUuid uuid);

  List<RecurringExpense> findAllActiveByFamilyUuid(String familyUuid);

  List<RecurringExpense> findAllActiveByDayOfMonth(int dayOfMonth);

  boolean existsByRecurringExpenseUuidAndYearMonth(
      String recurringExpenseUuid, String yearMonth);

  BigDecimal sumActiveAmountByFamilyUuid(String familyUuid);

  void moveRecurringExpenses(CustomUuid oldCategoryUuid, CustomUuid newCategoryUuid);
}
