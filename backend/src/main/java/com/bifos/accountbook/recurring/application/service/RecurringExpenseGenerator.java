package com.bifos.accountbook.recurring.application.service;

import com.bifos.accountbook.expense.domain.entity.Expense;
import com.bifos.accountbook.expense.domain.repository.ExpenseRepository;
import com.bifos.accountbook.family.domain.entity.Family;
import com.bifos.accountbook.family.domain.repository.FamilyRepository;
import com.bifos.accountbook.recurring.domain.entity.RecurringExpense;
import com.bifos.accountbook.recurring.domain.repository.RecurringExpenseRepository;
import com.bifos.accountbook.shared.value.CustomUuid;
import java.time.LocalDate;
import java.time.LocalDateTime;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Slf4j
@Component
@RequiredArgsConstructor
public class RecurringExpenseGenerator {

  private final RecurringExpenseRepository recurringExpenseRepository;
  private final ExpenseRepository expenseRepository;
  private final FamilyRepository familyRepository;

  @Transactional
  public boolean generate(RecurringExpense template, String yearMonth, LocalDate today) {
    String recurringUuid = template.getUuid().getValue();

    if (recurringExpenseRepository.existsByRecurringExpenseUuidAndYearMonth(
        recurringUuid, yearMonth)) {
      log.warn("Recurring expense already generated: recurringUuid={}, yearMonth={}",
          recurringUuid, yearMonth);
      return false;
    }

    Family family = familyRepository.findActiveByUuid(
        CustomUuid.from(template.getFamilyUuid())).orElse(null);
    if (family == null) {
      log.warn("Family not found for recurring expense: familyUuid={}",
          template.getFamilyUuid());
      return false;
    }

    LocalDateTime expenseDate = today.atTime(0, 0);

    Expense expense = Expense.builder()
        .family(family)
        .categoryUuid(CustomUuid.from(template.getCategoryUuid()))
        .userUuid(CustomUuid.from(template.getUserUuid()))
        .amount(template.getAmount())
        .description(template.getName())
        .date(expenseDate)
        .recurringExpenseUuid(recurringUuid)
        .yearMonth(yearMonth)
        .build();

    expenseRepository.save(expense);

    log.info("Generated expense from recurring template: recurringUuid={}, familyUuid={}, amount={}",
        recurringUuid, template.getFamilyUuid(), template.getAmount());
    return true;
  }
}
