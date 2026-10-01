package com.bifos.accountbook.recurring.application.service;

import com.bifos.accountbook.recurring.application.event.RecurringExpenseCreatedEvent;
import com.bifos.accountbook.recurring.domain.entity.RecurringExpense;
import com.bifos.accountbook.recurring.domain.repository.RecurringExpenseRepository;
import java.time.Clock;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Slf4j
@Component
@RequiredArgsConstructor
public class RecurringExpenseScheduler {

  private static final DateTimeFormatter YEAR_MONTH_FORMATTER =
      DateTimeFormatter.ofPattern("yyyy-MM");

  private final RecurringExpenseRepository recurringExpenseRepository;
  private final RecurringExpenseGenerator recurringExpenseGenerator;
  private final ApplicationEventPublisher eventPublisher;
  private final Clock clock;

  @Scheduled(cron = "0 0 1 * * ?", zone = "Asia/Seoul")
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
      try {
        boolean generated = recurringExpenseGenerator.generate(template, yearMonth, today);
        if (generated) {
          familyCountMap.merge(template.getFamilyUuid(), 1, Integer::sum);
        }
      } catch (Exception exception) {
        log.warn("Failed to generate recurring expense: recurringUuid={}, message={}",
            template.getUuid().getValue(), exception.getMessage());
      }
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

}
