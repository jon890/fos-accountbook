package com.bifos.accountbook.notification.application.event;

import com.bifos.accountbook.recurring.application.event.RecurringExpenseCreatedEvent;
import com.bifos.accountbook.family.domain.entity.FamilyMember;
import com.bifos.accountbook.family.domain.repository.FamilyMemberRepository;
import com.bifos.accountbook.notification.domain.entity.Notification;
import com.bifos.accountbook.notification.domain.repository.NotificationRepository;
import com.bifos.accountbook.shared.value.CustomUuid;
import com.bifos.accountbook.notification.domain.value.NotificationType;
import java.time.Clock;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.List;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.interceptor.TransactionAspectSupport;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;

@Slf4j
@Component
@RequiredArgsConstructor
public class RecurringExpenseEventListener {

  private static final DateTimeFormatter YEAR_MONTH_FORMATTER =
      DateTimeFormatter.ofPattern("yyyy-MM");

  private final NotificationRepository notificationRepository;
  private final FamilyMemberRepository familyMemberRepository;
  private final Clock clock;

  @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT, fallbackExecution = true)
  @Transactional(propagation = Propagation.REQUIRES_NEW)
  public void handleRecurringExpenseCreated(RecurringExpenseCreatedEvent event) {
    try {
      CustomUuid familyUuid = CustomUuid.from(event.familyUuid());
      String yearMonth = LocalDate.now(clock).format(YEAR_MONTH_FORMATTER);
      List<FamilyMember> activeMembers = familyMemberRepository.findAllActiveByFamilyUuid(familyUuid);

      if (activeMembers.isEmpty()) {
        log.debug("No active members found for recurring expense notification: familyUuid={}",
            event.familyUuid());
        return;
      }

      List<Notification> existingNotifications = notificationRepository.findByFamilyAndType(
          familyUuid,
          NotificationType.RECURRING_EXPENSE_CREATED);

      for (FamilyMember member : activeMembers) {
        boolean notificationExists = existingNotifications.stream()
            .anyMatch(notification -> member.getUserUuid().equals(notification.getUserUuid())
                && yearMonth.equals(notification.getYearMonth()));

        if (notificationExists) {
          continue;
        }

        Notification notification = Notification.builder()
            .familyUuid(familyUuid)
            .userUuid(member.getUserUuid())
            .type(NotificationType.RECURRING_EXPENSE_CREATED)
            .title("반복 지출 자동 생성")
            .message(String.format("오늘 반복 지출 %d건이 자동으로 생성되었습니다.", event.count()))
            .yearMonth(yearMonth)
            .build();

        notificationRepository.save(notification);
      }

      log.info("Recurring expense notification created: familyUuid={}, count={}",
          event.familyUuid(), event.count());
    } catch (Exception e) {
      TransactionAspectSupport.currentTransactionStatus().setRollbackOnly();
      log.error("Failed to create recurring expense notification: familyUuid={}",
          event.familyUuid(), e);
    }
  }
}
