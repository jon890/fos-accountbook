package com.bifos.accountbook.infra.persistence.repository.impl;

import com.bifos.accountbook.domain.entity.Expense;
import com.bifos.accountbook.domain.entity.QExpense;
import com.bifos.accountbook.domain.repository.ExpenseRepository;
import com.bifos.accountbook.domain.value.CustomUuid;
import com.bifos.accountbook.domain.value.ExpenseStatus;
import com.bifos.accountbook.infra.persistence.repository.jpa.ExpenseJpaRepository;
import com.querydsl.core.types.dsl.BooleanExpression;
import com.querydsl.jpa.impl.JPAQueryFactory;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Repository;

/**
 * ExpenseRepository 구현체
 * - JpaRepository: 기본 CRUD 작업
 * - QueryDSL: 동적 쿼리 및 복잡한 조건 처리
 * - 통계 쿼리는 DashboardRepository로 분리됨
 */
@Repository
@RequiredArgsConstructor
public class ExpenseRepositoryImpl implements ExpenseRepository {

  private final ExpenseJpaRepository jpaRepository;
  private final JPAQueryFactory queryFactory;

  @Override
  public Expense save(Expense expense) {
    return jpaRepository.save(expense);
  }

  @Override
  public Optional<Expense> findByUuid(CustomUuid uuid) {
    return jpaRepository.findByUuid(uuid);
  }

  @Override
  public Optional<Expense> findActiveByUuid(CustomUuid uuid) {
    return jpaRepository.findActiveByUuid(uuid);
  }

  @Override
  public Page<Expense> findAllByFamilyUuid(CustomUuid familyUuid, Pageable pageable) {
    return jpaRepository.findAllByFamilyUuid(familyUuid, pageable);
  }

  @Override
  public List<Expense> findByFamilyUuidAndDateBetween(CustomUuid familyUuid,
                                                      LocalDateTime startDate,
                                                      LocalDateTime endDate) {
    return jpaRepository.findByFamilyUuidAndDateBetween(familyUuid, startDate, endDate);
  }

  @Override
  public List<Expense> findByFamilyUuidAndCategoryUuid(CustomUuid familyUuid,
                                                       CustomUuid categoryUuid) {
    return jpaRepository.findByFamilyUuidAndCategoryUuid(familyUuid, categoryUuid);
  }

  /**
   * 가족 UUID와 필터링 조건으로 지출 조회 (QueryDSL)
   * - 동적 조건을 BooleanExpression으로 처리
   * - null 조건은 자동으로 무시됨
   * - 페이징 지원
   */
  @Override
  public Page<Expense> findByFamilyUuidWithFilters(
      CustomUuid familyUuid,
      CustomUuid categoryUuid,
      LocalDateTime startDate,
      LocalDateTime endDate,
      Pageable pageable) {

    QExpense expense = QExpense.expense;

    // QueryDSL로 동적 쿼리 실행
    List<Expense> expenses = queryFactory.selectFrom(expense)
                                         .where(expense.family.uuid.eq(familyUuid),
                                                expense.status.eq(ExpenseStatus.ACTIVE),
                                                categoryUuidEq(expense, categoryUuid),
                                                dateGoe(expense, startDate),
                                                dateLoe(expense, endDate))
                                         .orderBy(expense.date.desc())
                                         .offset(pageable.getOffset())
                                         .limit(pageable.getPageSize())
                                         .fetch();

    // 전체 카운트 조회
    Long total = queryFactory.select(expense.count())
                             .from(expense)
                             .where(expense.family.uuid.eq(familyUuid),
                                    expense.status.eq(ExpenseStatus.ACTIVE),
                                    categoryUuidEq(expense, categoryUuid),
                                    dateGoe(expense, startDate),
                                    dateLoe(expense, endDate)
                             )
                             .fetchOne();

    return new PageImpl<>(expenses, pageable, total != null ? total : 0L);
  }

  // ===== 동적 쿼리 조건 메서드 =====

  /**
   * 카테고리 UUID 동적 조건
   * null이면 조건 미적용 (전체 카테고리)
   */
  private BooleanExpression categoryUuidEq(QExpense expense, CustomUuid categoryUuid) {
    return categoryUuid != null ? expense.categoryUuid.eq(categoryUuid) : null;
  }

  /**
   * 시작 날짜 동적 조건 (>= startDate)
   * null이면 조건 미적용
   */
  private BooleanExpression dateGoe(QExpense expense, LocalDateTime startDate) {
    return startDate != null ? expense.date.goe(startDate) : null;
  }

  /**
   * 종료 날짜 동적 조건 (<= endDate)
   * null이면 조건 미적용
   */
  private BooleanExpression dateLoe(QExpense expense, LocalDateTime endDate) {
    return endDate != null ? expense.date.loe(endDate) : null;
  }

  @Override
  public int countByFamilyUuid(CustomUuid familyUuid) {
    return jpaRepository.countByFamilyUuid(familyUuid);
  }

  @Override
  public BigDecimal sumAmountByFamilyUuidAndDateBetween(CustomUuid familyUuid,
                                                        LocalDateTime startDate,
                                                        LocalDateTime endDate) {
    return jpaRepository.sumAmountByFamilyUuidAndDateBetween(familyUuid, startDate, endDate);
  }
}
