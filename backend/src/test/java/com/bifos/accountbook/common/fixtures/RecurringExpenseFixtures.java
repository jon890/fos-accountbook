package com.bifos.accountbook.common.fixtures;

import com.bifos.accountbook.domain.entity.Category;
import com.bifos.accountbook.domain.entity.Family;
import com.bifos.accountbook.domain.entity.RecurringExpense;
import com.bifos.accountbook.domain.entity.User;
import com.bifos.accountbook.domain.repository.RecurringExpenseRepository;
import java.math.BigDecimal;

/**
 * RecurringExpense 도메인 테스트 Fixture
 *
 * 반복 지출 생성 및 관리를 담당
 */
public class RecurringExpenseFixtures {

  private final RecurringExpenseRepository recurringExpenseRepository;
  private final UserFixtures userFixtures;

  public RecurringExpenseFixtures(
      RecurringExpenseRepository recurringExpenseRepository,
      UserFixtures userFixtures) {
    this.recurringExpenseRepository = recurringExpenseRepository;
    this.userFixtures = userFixtures;
  }

  /**
   * RecurringExpense Builder 시작점
   *
   * @param family 반복 지출이 속할 가족
   * @param category 반복 지출 카테고리
   */
  public RecurringExpenseBuilder recurringExpense(Family family, Category category) {
    return new RecurringExpenseBuilder(
        recurringExpenseRepository,
        family,
        category,
        userFixtures.getDefaultUser());
  }

  /**
   * RecurringExpense Builder - 반복 지출 생성
   */
  public static class RecurringExpenseBuilder {
    private String name = "Test Recurring Expense";
    private BigDecimal amount = BigDecimal.valueOf(50000);
    private int dayOfMonth = 15;
    private User user;

    private final RecurringExpenseRepository recurringExpenseRepository;
    private final Family family;
    private final Category category;

    RecurringExpenseBuilder(
        RecurringExpenseRepository recurringExpenseRepository,
        Family family,
        Category category,
        User defaultUser) {
      this.recurringExpenseRepository = recurringExpenseRepository;
      this.family = family;
      this.category = category;
      this.user = defaultUser;
    }

    public RecurringExpenseBuilder name(String name) {
      this.name = name;
      return this;
    }

    public RecurringExpenseBuilder amount(BigDecimal amount) {
      this.amount = amount;
      return this;
    }

    public RecurringExpenseBuilder dayOfMonth(int dayOfMonth) {
      this.dayOfMonth = dayOfMonth;
      return this;
    }

    public RecurringExpenseBuilder user(User user) {
      this.user = user;
      return this;
    }

    public RecurringExpense build() {
      RecurringExpense recurringExpense = RecurringExpense.builder()
          .familyUuid(family.getUuid().getValue())
          .categoryUuid(category.getUuid().getValue())
          .userUuid(user.getUuid().getValue())
          .name(name)
          .amount(amount)
          .dayOfMonth(dayOfMonth)
          .build();
      return recurringExpenseRepository.save(recurringExpense);
    }
  }
}
