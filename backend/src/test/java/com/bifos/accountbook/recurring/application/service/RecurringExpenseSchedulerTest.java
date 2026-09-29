package com.bifos.accountbook.recurring.application.service;

import static org.assertj.core.api.Assertions.assertThat;

import com.bifos.accountbook.recurring.application.event.RecurringExpenseCreatedEvent;
import com.bifos.accountbook.shared.TestFixturesSupport;
import com.bifos.accountbook.category.domain.entity.Category;
import com.bifos.accountbook.expense.domain.entity.Expense;
import com.bifos.accountbook.family.domain.entity.Family;
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
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Primary;
import org.springframework.context.annotation.Import;
import org.springframework.test.context.event.ApplicationEvents;
import org.springframework.test.context.event.RecordApplicationEvents;

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
  private ExpenseRepository expenseRepository;

  @Autowired
  private FamilyRepository familyRepository;

  @Autowired
  private RecurringExpenseRepository recurringExpenseRepository;

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
}
