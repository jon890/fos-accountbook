package com.bifos.accountbook.common.fixtures;

import com.bifos.accountbook.domain.entity.Category;
import com.bifos.accountbook.domain.entity.Expense;
import com.bifos.accountbook.domain.entity.Family;
import com.bifos.accountbook.domain.entity.User;
import com.bifos.accountbook.domain.repository.ExpenseRepository;
import com.bifos.accountbook.domain.value.ExpenseStatus;
import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * Expense 도메인 테스트 Fixture
 *
 * 지출 생성 및 관리를 담당
 */
public class ExpenseFixtures {

  private final ExpenseRepository expenseRepository;
  private final UserFixtures userFixtures;

  public ExpenseFixtures(
      ExpenseRepository expenseRepository,
      UserFixtures userFixtures) {
    this.expenseRepository = expenseRepository;
    this.userFixtures = userFixtures;
  }

  /**
   * Expense Builder 시작점
   *
   * @param family 지출이 속할 가족
   * @param category 지출 카테고리
   */
  public ExpenseBuilder expense(Family family, Category category) {
    return new ExpenseBuilder(
        expenseRepository,
        family,
        category,
        userFixtures.getDefaultUser());
  }

  /**
   * Expense Builder - 지출 생성
   */
  public static class ExpenseBuilder {
    private BigDecimal amount = BigDecimal.valueOf(10000);
    private String description = "Test Expense";
    private LocalDateTime date = LocalDateTime.now();
    private User user;

    private final ExpenseRepository expenseRepository;
    private final Family family;
    private final Category category;

    ExpenseBuilder(
        ExpenseRepository expenseRepository,
        Family family,
        Category category,
        User defaultUser) {
      this.expenseRepository = expenseRepository;
      this.family = family;
      this.category = category;
      this.user = defaultUser;
    }

    public ExpenseBuilder amount(BigDecimal amount) {
      this.amount = amount;
      return this;
    }

    public ExpenseBuilder description(String description) {
      this.description = description;
      return this;
    }

    public ExpenseBuilder date(LocalDateTime date) {
      this.date = date;
      return this;
    }

    public ExpenseBuilder user(User user) {
      this.user = user;
      return this;
    }

    public Expense build() {
      // Expense 직접 생성 (@Transactional 없이도 동작)
      Expense expense = Expense.builder()
                               .family(family)
                               .categoryUuid(category.getUuid())
                               .userUuid(user.getUuid())
                               .amount(amount)
                               .description(description)
                               .date(date)
                               .status(ExpenseStatus.ACTIVE)
                               .build();
      return expenseRepository.save(expense);
    }
  }
}

