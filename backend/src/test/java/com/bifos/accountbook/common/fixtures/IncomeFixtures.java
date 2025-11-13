package com.bifos.accountbook.common.fixtures;

import com.bifos.accountbook.domain.entity.Category;
import com.bifos.accountbook.domain.entity.Family;
import com.bifos.accountbook.domain.entity.Income;
import com.bifos.accountbook.domain.entity.User;
import com.bifos.accountbook.domain.repository.IncomeRepository;
import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * Income 도메인 테스트 Fixture
 *
 * 수입 생성 및 관리를 담당
 */
public class IncomeFixtures {

  private final IncomeRepository incomeRepository;
  private final UserFixtures userFixtures;

  public IncomeFixtures(
      IncomeRepository incomeRepository,
      UserFixtures userFixtures) {
    this.incomeRepository = incomeRepository;
    this.userFixtures = userFixtures;
  }

  /**
   * Income Builder 시작점
   *
   * @param family 수입이 속할 가족
   * @param category 수입 카테고리
   */
  public IncomeBuilder income(Family family, Category category) {
    return new IncomeBuilder(
        incomeRepository,
        family,
        category,
        userFixtures.getDefaultUser());
  }

  /**
   * Income Builder - 수입 생성
   */
  public static class IncomeBuilder {
    private BigDecimal amount = BigDecimal.valueOf(100000);
    private String description = "Test Income";
    private LocalDateTime date = LocalDateTime.now();
    private User user;

    private final IncomeRepository incomeRepository;
    private final Family family;
    private final Category category;

    IncomeBuilder(
        IncomeRepository incomeRepository,
        Family family,
        Category category,
        User defaultUser) {
      this.incomeRepository = incomeRepository;
      this.family = family;
      this.category = category;
      this.user = defaultUser;
    }

    public IncomeBuilder amount(BigDecimal amount) {
      this.amount = amount;
      return this;
    }

    public IncomeBuilder description(String description) {
      this.description = description;
      return this;
    }

    public IncomeBuilder date(LocalDateTime date) {
      this.date = date;
      return this;
    }

    public IncomeBuilder user(User user) {
      this.user = user;
      return this;
    }

    public Income build() {
      // Income 직접 생성 (@Transactional 없이도 동작)
      Income income = Income.builder()
                            .family(family)
                            .categoryUuid(category.getUuid())
                            .userUuid(user.getUuid())
                            .amount(amount)
                            .description(description)
                            .date(date)
                            .build();
      return incomeRepository.save(income);
    }
  }
}

