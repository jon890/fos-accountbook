package com.bifos.accountbook.recurring.application.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.BDDMockito.willAnswer;

import com.bifos.accountbook.recurring.application.event.RecurringExpenseCreatedEvent;
import com.bifos.accountbook.shared.TestFixturesSupport;
import com.bifos.accountbook.category.domain.entity.Category;
import com.bifos.accountbook.expense.domain.entity.Expense;
import com.bifos.accountbook.family.domain.entity.Family;
import com.bifos.accountbook.family.domain.entity.FamilyMember;
import com.bifos.accountbook.family.domain.repository.FamilyMemberRepository;
import com.bifos.accountbook.family.domain.value.FamilyMemberStatus;
import com.bifos.accountbook.notification.domain.entity.Notification;
import com.bifos.accountbook.notification.domain.repository.NotificationRepository;
import com.bifos.accountbook.notification.domain.value.NotificationType;
import com.bifos.accountbook.recurring.domain.entity.RecurringExpense;
import com.bifos.accountbook.user.domain.entity.User;
import com.bifos.accountbook.expense.domain.repository.ExpenseRepository;
import com.bifos.accountbook.family.domain.repository.FamilyRepository;
import com.bifos.accountbook.recurring.domain.repository.RecurringExpenseRepository;
import java.math.BigDecimal;
import java.time.Clock;
import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.List;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Primary;
import org.springframework.context.annotation.Import;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.context.event.ApplicationEvents;
import org.springframework.test.context.event.RecordApplicationEvents;
import org.springframework.test.context.bean.override.mockito.MockitoSpyBean;
import org.springframework.transaction.support.TransactionTemplate;

@DisplayName("RecurringExpenseScheduler 통합 테스트")
@RecordApplicationEvents
@Import(RecurringExpenseSchedulerTest.TestClockConfig.class)
class RecurringExpenseSchedulerTest extends TestFixturesSupport {

  private static final LocalDate FIXED_DATE = LocalDate.of(2025, 3, 15);
  private static final ZoneId ZONE = ZoneId.systemDefault();

  @TestConfiguration
  static class TestClockConfig {
    @Bean
    @Primary
    public Clock testClock() {
      Instant instant = FIXED_DATE.atStartOfDay(ZONE).toInstant();
      return Clock.fixed(instant, ZONE);
    }
  }

  @Autowired
  private RecurringExpenseScheduler scheduler;

  @Autowired
  private RecurringExpenseGenerator generator;

  @MockitoSpyBean
  private RecurringExpenseGenerator recurringExpenseGenerator;

  @Autowired
  private ExpenseRepository expenseRepository;

  @Autowired
  private FamilyRepository familyRepository;

  @Autowired
  private RecurringExpenseRepository recurringExpenseRepository;

  @Autowired
  private FamilyMemberRepository familyMemberRepository;

  @Autowired
  private NotificationRepository notificationRepository;

  @Autowired
  private ApplicationEventPublisher eventPublisher;

  @Autowired
  private TransactionTemplate transactionTemplate;

  @Autowired
  private JdbcTemplate jdbcTemplate;

  @Autowired
  private ApplicationEvents events;

  private User user;
  private Family family;
  private Category category;

  @BeforeEach
  void setUp() {
    user = fixtures.getDefaultUser();
    family = fixtures.getDefaultFamily();
    category = fixtures.getDefaultCategory();
  }

  @AfterEach
  void resetGeneratorSpy() {
    org.mockito.Mockito.reset(recurringExpenseGenerator);
  }

  @Test
  @DisplayName("TC-01: dayOfMonth 일치 시 지출 정상 생성")
  void shouldGenerateExpenseWhenDayMatches() {
    // Given
    RecurringExpense template = fixtures.recurringExpenses
        .recurringExpense(family, category)
        .dayOfMonth(15)
        .amount(BigDecimal.valueOf(50000))
        .name("월세")
        .build();

    // When
    scheduler.generateRecurringExpenses();

    // Then
    List<Expense> expenses = expenseRepository.findByFamilyUuidAndDateBetween(
        family.getUuid(),
        FIXED_DATE.atStartOfDay(),
        FIXED_DATE.plusDays(1).atStartOfDay());

    assertThat(expenses).hasSize(1);

    Expense created = expenses.get(0);
    assertThat(created.getRecurringExpenseUuid())
        .isEqualTo(template.getUuid().getValue());
    assertThat(created.getYearMonth()).isEqualTo("2025-03");
    assertThat(created.getAmount())
        .isEqualByComparingTo(BigDecimal.valueOf(50000));
    assertThat(created.getDescription()).isEqualTo("월세");
  }

  @Test
  @DisplayName("TC-02: dayOfMonth 불일치 시 생성 안 함")
  void shouldNotGenerateExpenseWhenDayDoesNotMatch() {
    // Given: dayOfMonth=20, Clock 날짜=15일
    fixtures.recurringExpenses
        .recurringExpense(family, category)
        .dayOfMonth(20)
        .build();

    // When
    scheduler.generateRecurringExpenses();

    // Then
    List<Expense> expenses = expenseRepository.findByFamilyUuidAndDateBetween(
        family.getUuid(),
        FIXED_DATE.atStartOfDay(),
        FIXED_DATE.plusDays(1).atStartOfDay());

    assertThat(expenses).isEmpty();
  }

  @Test
  @DisplayName("TC-03: 같은 달 2회 실행 시 중복 생성 없음 (멱등성)")
  void shouldBeIdempotentWhenRunTwiceInSameMonth() {
    // Given
    fixtures.recurringExpenses
        .recurringExpense(family, category)
        .dayOfMonth(15)
        .build();

    // When: 2회 실행
    scheduler.generateRecurringExpenses();
    scheduler.generateRecurringExpenses();

    // Then: 1건만 존재
    List<Expense> expenses = expenseRepository.findByFamilyUuidAndDateBetween(
        family.getUuid(),
        FIXED_DATE.atStartOfDay(),
        FIXED_DATE.plusDays(1).atStartOfDay());

    assertThat(expenses).hasSize(1);
  }

  @Test
  @DisplayName("TC-04: ENDED 상태 반복 지출은 생성 제외")
  void shouldNotGenerateExpenseForEndedRecurring() {
    // Given
    RecurringExpense template = fixtures.recurringExpenses
        .recurringExpense(family, category)
        .dayOfMonth(15)
        .build();
    template.end();
    recurringExpenseRepository.save(template);

    // When
    scheduler.generateRecurringExpenses();

    // Then
    List<Expense> expenses = expenseRepository.findByFamilyUuidAndDateBetween(
        family.getUuid(),
        FIXED_DATE.atStartOfDay(),
        FIXED_DATE.plusDays(1).atStartOfDay());

    assertThat(expenses).isEmpty();
  }

  @Test
  @DisplayName("TC-05: 삭제된 가족의 반복 지출은 에러 없이 skip")
  void shouldSkipDeletedFamilyWithoutError() {
    // Given
    fixtures.recurringExpenses
        .recurringExpense(family, category)
        .dayOfMonth(15)
        .build();

    // 가족 삭제 (soft delete)
    family.delete();
    familyRepository.save(family);

    // When: 에러 없이 실행되어야 함
    scheduler.generateRecurringExpenses();

    // Then
    List<Expense> expenses = expenseRepository.findByFamilyUuidAndDateBetween(
        family.getUuid(),
        FIXED_DATE.atStartOfDay(),
        FIXED_DATE.plusDays(1).atStartOfDay());

    assertThat(expenses).isEmpty();
  }

  @Test
  @DisplayName("TC-06: 정상 생성 시 RecurringExpenseCreatedEvent 발행")
  void shouldPublishEventWhenExpenseGenerated() {
    // Given
    fixtures.recurringExpenses
        .recurringExpense(family, category)
        .dayOfMonth(15)
        .name("보험료")
        .build();

    // When
    scheduler.generateRecurringExpenses();

    // Then
    long eventCount = events.stream(RecurringExpenseCreatedEvent.class).count();
    assertThat(eventCount).isEqualTo(1);

    RecurringExpenseCreatedEvent event = events
        .stream(RecurringExpenseCreatedEvent.class)
        .findFirst()
        .orElseThrow();
    assertThat(event.familyUuid()).isEqualTo(family.getUuid().getValue());
    assertThat(event.count()).isEqualTo(1);
  }

  @Test
  @DisplayName("한 템플릿이 실패해도 다른 템플릿의 지출과 이벤트는 생성한다")
  void shouldContinueWhenOneTemplateFails() {
    RecurringExpense failedTemplate = fixtures.recurringExpenses
        .recurringExpense(family, category)
        .dayOfMonth(15)
        .name("실패할 지출")
        .build();
    RecurringExpense successfulTemplate = fixtures.recurringExpenses
        .recurringExpense(family, category)
        .dayOfMonth(15)
        .name("생성할 지출")
        .build();

    willAnswer(invocation -> {
      boolean generated = (Boolean) invocation.callRealMethod();
      RecurringExpense template = invocation.getArgument(0);
      if (template.getUuid().equals(failedTemplate.getUuid())) {
        throw new IllegalStateException("template generation failed");
      }
      return generated;
    }).given(recurringExpenseGenerator).generate(any(RecurringExpense.class), any(), any());

    scheduler.generateRecurringExpenses();

    List<Expense> expenses = expenseRepository.findByFamilyUuidAndDateBetween(
        family.getUuid(),
        FIXED_DATE.atStartOfDay(),
        FIXED_DATE.plusDays(1).atStartOfDay());
    assertThat(expenses).extracting(Expense::getRecurringExpenseUuid)
        .containsExactly(successfulTemplate.getUuid().getValue());

    RecurringExpenseCreatedEvent event = events
        .stream(RecurringExpenseCreatedEvent.class)
        .findFirst()
        .orElseThrow();
    assertThat(event.count()).isEqualTo(1);
  }

  @Test
  @DisplayName("생성기 안에서 저장 뒤 예외가 나면 지출과 멱등성 키가 롤백된다")
  void shouldRollbackExpenseWhenGeneratorFailsAfterSave() {
    RecurringExpense template = fixtures.recurringExpenses
        .recurringExpense(family, category)
        .dayOfMonth(15)
        .build();

    willAnswer(invocation -> {
      invocation.callRealMethod();
      throw new IllegalStateException("failure after expense save");
    }).given(recurringExpenseGenerator).generate(any(RecurringExpense.class), any(), any());

    assertThatThrownBy(() -> generator.generate(template, "2025-03", FIXED_DATE))
        .isInstanceOf(IllegalStateException.class)
        .hasMessage("failure after expense save");

    List<Expense> expenses = expenseRepository.findByFamilyUuidAndDateBetween(
        family.getUuid(),
        FIXED_DATE.atStartOfDay(),
        FIXED_DATE.plusDays(1).atStartOfDay());
    assertThat(expenses).isEmpty();
    assertThat(recurringExpenseRepository.existsByRecurringExpenseUuidAndYearMonth(
        template.getUuid().getValue(), "2025-03")).isFalse();
  }

  @Test
  @DisplayName("반복 지출 생성 알림은 활성 구성원마다 한 번만 생성한다")
  void shouldCreateRecurringExpenseNotificationForEachActiveMember() {
    User secondUser = fixtures.users.getOtherUser();
    addMember(secondUser, FamilyMemberStatus.ACTIVE);
    fixtures.recurringExpenses.recurringExpense(family, category).dayOfMonth(15).build();

    scheduler.generateRecurringExpenses();
    scheduler.generateRecurringExpenses();

    assertThat(recurringNotificationsFor(user)).hasSize(1);
    assertThat(recurringNotificationsFor(secondUser)).hasSize(1);
  }

  @Test
  @DisplayName("탈퇴한 구성원에게는 반복 지출 생성 알림을 만들지 않는다")
  void shouldNotCreateRecurringExpenseNotificationForLeftMember() {
    User leftUser = fixtures.users.getOtherUser();
    addMember(leftUser, FamilyMemberStatus.LEFT);
    fixtures.recurringExpenses.recurringExpense(family, category).dayOfMonth(15).build();

    scheduler.generateRecurringExpenses();

    assertThat(recurringNotificationsFor(user)).hasSize(1);
    assertThat(recurringNotificationsFor(leftUser)).isEmpty();
  }

  @Test
  @DisplayName("생성된 반복 지출이 없으면 알림도 만들지 않는다")
  void shouldNotCreateRecurringExpenseNotificationWithoutGeneratedExpense() {
    fixtures.recurringExpenses.recurringExpense(family, category).dayOfMonth(20).build();

    scheduler.generateRecurringExpenses();

    assertThat(recurringNotificationsFor(user)).isEmpty();
  }

  @Test
  @DisplayName("트랜잭션 안에서 발행한 이벤트는 커밋 후에만 알림을 만든다")
  void shouldCreateRecurringExpenseNotificationsAfterTransactionCommit() {
    User secondUser = fixtures.users.getOtherUser();
    addMember(secondUser, FamilyMemberStatus.ACTIVE);

    transactionTemplate.executeWithoutResult(status -> {
      eventPublisher.publishEvent(new RecurringExpenseCreatedEvent(
          family.getUuid().getValue(), "반복 지출", 1));

      assertThat(recurringNotificationsFor(user)).isEmpty();
      assertThat(recurringNotificationsFor(secondUser)).isEmpty();
    });

    assertThat(recurringNotificationsFor(user)).hasSize(1);
    assertThat(recurringNotificationsFor(secondUser)).hasSize(1);
  }

  @Test
  @DisplayName("알림 저장 실패는 알림만 롤백하고 반복 지출 생성은 유지한다")
  void shouldRollbackAllRecurringExpenseNotificationsWhenSavingOneFails() {
    User secondUser = fixtures.users.getOtherUser();
    addMember(secondUser, FamilyMemberStatus.ACTIVE);
    RecurringExpense template = fixtures.recurringExpenses
        .recurringExpense(family, category)
        .dayOfMonth(15)
        .build();
    String rejectedUserUuid = familyMemberRepository.findAllActiveByFamilyUuid(family.getUuid())
        .get(1)
        .getUserUuid()
        .getValue();

    jdbcTemplate.execute("ALTER TABLE notifications ADD CONSTRAINT reject_second_recurring_user "
        + "CHECK (user_uuid <> '" + rejectedUserUuid + "')");
    try {
      scheduler.generateRecurringExpenses();

      assertThat(expenseRepository.findByFamilyUuidAndDateBetween(
          family.getUuid(), FIXED_DATE.atStartOfDay(), FIXED_DATE.plusDays(1).atStartOfDay()))
          .extracting(Expense::getRecurringExpenseUuid)
          .containsExactly(template.getUuid().getValue());
      assertThat(recurringNotificationsFor(user)).isEmpty();
      assertThat(recurringNotificationsFor(secondUser)).isEmpty();
    } finally {
      jdbcTemplate.execute("ALTER TABLE notifications DROP CONSTRAINT reject_second_recurring_user");
    }

    eventPublisher.publishEvent(new RecurringExpenseCreatedEvent(
        family.getUuid().getValue(), "반복 지출", 1));

    assertThat(recurringNotificationsFor(user)).hasSize(1);
    assertThat(recurringNotificationsFor(secondUser)).hasSize(1);
  }

  private FamilyMember addMember(User memberUser, FamilyMemberStatus status) {
    return familyMemberRepository.save(FamilyMember.builder()
        .familyUuid(family.getUuid())
        .userUuid(memberUser.getUuid())
        .status(status)
        .build());
  }

  private List<Notification> recurringNotificationsFor(User notificationRecipient) {
    return notificationRepository.findByFamilyAndUser(family.getUuid(), notificationRecipient.getUuid())
        .stream()
        .filter(notification -> notification.getType() == NotificationType.RECURRING_EXPENSE_CREATED)
        .toList();
  }
}
