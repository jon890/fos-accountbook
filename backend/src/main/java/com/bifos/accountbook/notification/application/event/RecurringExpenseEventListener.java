package com.bifos.accountbook.notification.application.event;

import com.bifos.accountbook.recurring.application.event.RecurringExpenseCreatedEvent;
import com.bifos.accountbook.notification.domain.entity.Notification;
import com.bifos.accountbook.notification.domain.repository.NotificationRepository;
import com.bifos.accountbook.shared.value.CustomUuid;
import com.bifos.accountbook.notification.domain.value.NotificationType;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;

@Slf4j
@Component
@RequiredArgsConstructor
public class RecurringExpenseEventListener {

  private static final DateTimeFormatter YEAR_MONTH_FORMATTER =
      DateTimeFormatter.ofPattern("yyyy-MM");

  private final NotificationRepository notificationRepository;

  @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
  public void handleRecurringExpenseCreated(RecurringExpenseCreatedEvent event) {
    try {
      String yearMonth = LocalDate.now().format(YEAR_MONTH_FORMATTER);

      Notification notification = Notification.builder()
          .familyUuid(CustomUuid.from(event.familyUuid()))
          .userUuid(null)
          .type(NotificationType.RECURRING_EXPENSE_CREATED)
          .title("반복 지출 자동 생성")
          .message(String.format("오늘 반복 지출 %d건이 자동으로 생성되었습니다.", event.count()))
          .yearMonth(yearMonth)
          .build();

      notificationRepository.save(notification);

      log.info("Recurring expense notification created: familyUuid={}, count={}",
          event.familyUuid(), event.count());
    } catch (Exception e) {
      log.error("Failed to create recurring expense notification: familyUuid={}",
          event.familyUuid(), e);
    }
  }
}
