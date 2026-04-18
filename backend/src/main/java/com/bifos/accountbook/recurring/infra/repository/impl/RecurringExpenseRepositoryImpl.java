package com.bifos.accountbook.recurring.infra.repository.impl;

import com.bifos.accountbook.expense.domain.entity.QExpense;
import com.bifos.accountbook.recurring.domain.entity.QRecurringExpense;
import com.bifos.accountbook.recurring.domain.entity.RecurringExpense;
import com.bifos.accountbook.recurring.domain.value.RecurringExpenseStatus;
import com.bifos.accountbook.recurring.domain.repository.RecurringExpenseRepository;
import com.bifos.accountbook.shared.value.CustomUuid;
import com.bifos.accountbook.recurring.infra.repository.jpa.RecurringExpenseJpaRepository;
import com.querydsl.jpa.impl.JPAQueryFactory;
import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Repository;

@Repository
@RequiredArgsConstructor
public class RecurringExpenseRepositoryImpl implements RecurringExpenseRepository {

  private final RecurringExpenseJpaRepository jpaRepository;
  private final JPAQueryFactory queryFactory;

  private static final QRecurringExpense recurringExpense =
      QRecurringExpense.recurringExpense;

  @Override
  public RecurringExpense save(RecurringExpense recurringExpense) {
    return jpaRepository.save(recurringExpense);
  }

  @Override
  public Optional<RecurringExpense> findActiveByUuid(CustomUuid uuid) {
    return jpaRepository.findActiveByUuid(uuid);
  }

  @Override
  public List<RecurringExpense> findAllActiveByFamilyUuid(String familyUuid) {
    return queryFactory.selectFrom(recurringExpense)
        .where(
            recurringExpense.familyUuid.eq(familyUuid),
            recurringExpense.status.eq(RecurringExpenseStatus.ACTIVE))
        .orderBy(recurringExpense.dayOfMonth.asc())
        .fetch();
  }

  @Override
  public List<RecurringExpense> findAllActiveByDayOfMonth(int dayOfMonth) {
    return queryFactory.selectFrom(recurringExpense)
        .where(
            recurringExpense.dayOfMonth.eq(dayOfMonth),
            recurringExpense.status.eq(RecurringExpenseStatus.ACTIVE))
        .fetch();
  }

  @Override
  public boolean existsByRecurringExpenseUuidAndYearMonth(
      String recurringExpenseUuid, String yearMonth) {
    QExpense expense = QExpense.expense;

    Integer result = queryFactory.selectOne()
        .from(expense)
        .where(
            expense.recurringExpenseUuid.eq(recurringExpenseUuid),
            expense.yearMonth.eq(yearMonth))
        .fetchFirst();

    return result != null;
  }

  @Override
  public BigDecimal sumActiveAmountByFamilyUuid(String familyUuid) {
    BigDecimal sum = queryFactory.select(recurringExpense.amount.sum())
        .from(recurringExpense)
        .where(
            recurringExpense.familyUuid.eq(familyUuid),
            recurringExpense.status.eq(RecurringExpenseStatus.ACTIVE))
        .fetchOne();

    return sum != null ? sum : BigDecimal.ZERO;
  }

  @Override
  public void moveRecurringExpenses(CustomUuid oldCategoryUuid, CustomUuid newCategoryUuid) {
    queryFactory.update(recurringExpense)
        .set(recurringExpense.categoryUuid, newCategoryUuid.getValue())
        .where(
            recurringExpense.categoryUuid.eq(oldCategoryUuid.getValue()),
            recurringExpense.status.eq(RecurringExpenseStatus.ACTIVE))
        .execute();
  }
}
