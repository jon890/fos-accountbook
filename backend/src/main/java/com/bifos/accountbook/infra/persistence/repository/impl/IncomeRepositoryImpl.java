package com.bifos.accountbook.infra.persistence.repository.impl;

import com.bifos.accountbook.domain.entity.Income;
import com.bifos.accountbook.domain.entity.QIncome;
import com.bifos.accountbook.domain.repository.IncomeRepository;
import com.bifos.accountbook.domain.value.CustomUuid;
import com.bifos.accountbook.domain.value.IncomeStatus;
import com.bifos.accountbook.infra.persistence.repository.jpa.IncomeJpaRepository;
import com.querydsl.core.types.dsl.BooleanExpression;
import com.querydsl.jpa.impl.JPAQueryFactory;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Repository;

/**
 * IncomeRepository 구현체
 * - JpaRepository: 기본 CRUD 작업
 * - QueryDSL: 동적 쿼리 및 복잡한 조건 처리
 */
@Repository
@RequiredArgsConstructor
public class IncomeRepositoryImpl implements IncomeRepository {

  private final IncomeJpaRepository jpaRepository;
  private final JPAQueryFactory queryFactory;

  @Override
  public Income save(Income income) {
    return jpaRepository.save(income);
  }

  @Override
  public Optional<Income> findByUuid(CustomUuid uuid) {
    return jpaRepository.findByUuid(uuid);
  }

  @Override
  public Optional<Income> findActiveByUuid(CustomUuid uuid) {
    return jpaRepository.findActiveByUuid(uuid);
  }

  @Override
  public Page<Income> findAllByFamilyUuid(CustomUuid familyUuid, Pageable pageable) {
    return jpaRepository.findAllByFamilyUuid(familyUuid, pageable);
  }

  @Override
  public List<Income> findByFamilyUuidAndDateBetween(CustomUuid familyUuid,
                                                     LocalDateTime startDate,
                                                     LocalDateTime endDate) {
    return jpaRepository.findByFamilyUuidAndDateBetween(familyUuid, startDate, endDate);
  }

  @Override
  public List<Income> findByFamilyUuidAndCategoryUuid(CustomUuid familyUuid,
                                                      CustomUuid categoryUuid) {
    return jpaRepository.findByFamilyUuidAndCategoryUuid(familyUuid, categoryUuid);
  }

  /**
   * 가족 UUID와 필터링 조건으로 수입 조회 (QueryDSL)
   * - 동적 조건을 BooleanExpression으로 처리
   * - null 조건은 자동으로 무시됨
   * - 페이징 지원
   */
  @Override
  public Page<Income> findByFamilyUuidWithFilters(CustomUuid familyUuid,
                                                  CustomUuid categoryUuid,
                                                  LocalDateTime startDate,
                                                  LocalDateTime endDate,
                                                  Pageable pageable) {

    QIncome income = QIncome.income;

    // QueryDSL로 동적 쿼리 실행
    List<Income> incomes = queryFactory
        .selectFrom(income)
        .where(income.family.uuid.eq(familyUuid),
               income.status.eq(IncomeStatus.ACTIVE),
               categoryUuidEq(income, categoryUuid),
               dateGoe(income, startDate),
               dateLoe(income, endDate))
        .orderBy(income.date.desc())
        .offset(pageable.getOffset())
        .limit(pageable.getPageSize())
        .fetch();

    // 전체 카운트 조회
    Long total = queryFactory
        .select(income.count())
        .from(income)
        .where(income.family.uuid.eq(familyUuid),
               income.status.eq(IncomeStatus.ACTIVE),
               categoryUuidEq(income, categoryUuid),
               dateGoe(income, startDate),
               dateLoe(income, endDate))
        .fetchOne();

    return new PageImpl<>(incomes, pageable, total != null ? total : 0L);
  }

  // ===== 동적 쿼리 조건 메서드 =====

  /**
   * 카테고리 UUID 동적 조건
   * null이면 조건 미적용 (전체 카테고리)
   */
  private BooleanExpression categoryUuidEq(QIncome income, CustomUuid categoryUuid) {
    return categoryUuid != null ? income.categoryUuid.eq(categoryUuid) : null;
  }

  /**
   * 시작 날짜 동적 조건 (>= startDate)
   * null이면 조건 미적용
   */
  private BooleanExpression dateGoe(QIncome income, LocalDateTime startDate) {
    return startDate != null ? income.date.goe(startDate) : null;
  }

  /**
   * 종료 날짜 동적 조건 (<= endDate)
   * null이면 조건 미적용
   */
  private BooleanExpression dateLoe(QIncome income, LocalDateTime endDate) {
    return endDate != null ? income.date.loe(endDate) : null;
  }
}

