package com.bifos.accountbook.application.service;

import com.bifos.accountbook.application.event.RecurringExpenseCreatedEvent;
import com.bifos.accountbook.domain.entity.Expense;
import com.bifos.accountbook.domain.entity.Family;
import com.bifos.accountbook.domain.entity.RecurringExpense;
import com.bifos.accountbook.domain.repository.ExpenseRepository;
import com.bifos.accountbook.domain.repository.FamilyRepository;
import com.bifos.accountbook.domain.repository.RecurringExpenseRepository;
import com.bifos.accountbook.domain.value.CustomUuid;
import java.time.Clock;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Slf4j
@Component
@RequiredArgsConstructor
public class RecurringExpenseScheduler {

  private static final DateTimeFormatter YEAR_MONTH_FORMATTER =
      DateTimeFormatter.ofPattern("yyyy-MM");

  private final RecurringExpenseRepository recurringExpenseRepository;
  private final ExpenseRepository expenseRepository;
  private final FamilyRepository familyRepository;
  private final ApplicationEventPublisher eventPublisher;
  private final Clock clock;

  @Scheduled(cron = "0 0 1 * * ?")
  public void generateRecurringExpenses() {
    LocalDate today = LocalDate.now(clock);
    int dayOfMonth = today.getDayOfMonth();
    String yearMonth = today.format(YEAR_MONTH_FORMATTER);

    log.info("Starting recurring expense generation for day={}, yearMonth={}", dayOfMonth, yearMonth);

    List<RecurringExpense> templates =
        recurringExpenseRepository.findAllActiveByDayOfMonth(dayOfMonth);

    if (templates.isEmpty()) {
      log.info("No recurring expense templates found for day={}", dayOfMonth);
      return;
    }

    // 가족별 생성 수 추적
    Map<String, Integer> familyCountMap = new HashMap<>();

    for (RecurringExpense template : templates) {
      processTemplate(template, yearMonth, today, familyCountMap);
    }

    // 가족별 이벤트 발행
    for (Map.Entry<String, Integer> entry : familyCountMap.entrySet()) {
      eventPublisher.publishEvent(new RecurringExpenseCreatedEvent(
          entry.getKey(),
          "반복 지출",
          entry.getValue()));
    }

    log.info("Recurring expense generation completed. {} families, {} expenses created",
        familyCountMap.size(),
        familyCountMap.values().stream().mapToInt(Integer::intValue).sum());
  }

  @Transactional
  public void processTemplate(RecurringExpense template, String yearMonth,
                              LocalDate today, Map<String, Integer> familyCountMap) {
    String recurringUuid = template.getUuid().getValue();

    if (recurringExpenseRepository.existsByRecurringExpenseUuidAndYearMonth(
        recurringUuid, yearMonth)) {
      log.warn("Recurring expense already generated: recurringUuid={}, yearMonth={}",
          recurringUuid, yearMonth);
      return;
    }

    Family family = familyRepository.findActiveByUuid(
        CustomUuid.from(template.getFamilyUuid())).orElse(null);
    if (family == null) {
      log.warn("Family not found for recurring expense: familyUuid={}",
          template.getFamilyUuid());
      return;
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

    familyCountMap.merge(template.getFamilyUuid(), 1, Integer::sum);

    log.info("Generated expense from recurring template: recurringUuid={}, familyUuid={}, amount={}",
        recurringUuid, template.getFamilyUuid(), template.getAmount());
  }
}
