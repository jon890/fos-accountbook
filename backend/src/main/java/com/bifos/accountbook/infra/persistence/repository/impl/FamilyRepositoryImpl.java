package com.bifos.accountbook.infra.persistence.repository.impl;

import com.bifos.accountbook.domain.entity.Family;
import com.bifos.accountbook.domain.entity.QCategory;
import com.bifos.accountbook.domain.entity.QExpense;
import com.bifos.accountbook.domain.entity.QFamily;
import com.bifos.accountbook.domain.entity.QFamilyMember;
import com.bifos.accountbook.domain.repository.FamilyRepository;
import com.bifos.accountbook.domain.repository.projection.FamilyWithCountsProjection;
import com.bifos.accountbook.domain.value.CategoryStatus;
import com.bifos.accountbook.infra.persistence.repository.jpa.FamilyJpaRepository;
import com.bifos.accountbook.domain.value.CustomUuid;
import com.bifos.accountbook.domain.value.ExpenseStatus;
import com.bifos.accountbook.domain.value.FamilyMemberStatus;
import com.bifos.accountbook.domain.value.FamilyStatus;
import com.querydsl.core.Tuple;
import com.querydsl.jpa.JPQLQuery;
import com.querydsl.jpa.JPAExpressions;
import com.querydsl.jpa.impl.JPAQueryFactory;
import java.util.List;
import java.util.Optional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Repository;

/**
 * FamilyRepository 구현체
 * JpaRepository를 내부적으로 사용하여 도메인 인터페이스 구현
 */
@Repository
@RequiredArgsConstructor
public class FamilyRepositoryImpl implements FamilyRepository {

  private final FamilyJpaRepository jpaRepository;
  private final JPAQueryFactory queryFactory;

  @Override
  public Family save(Family family) {
    return jpaRepository.save(family);
  }

  @Override
  public Optional<Family> findByUuid(CustomUuid uuid) {
    return jpaRepository.findByUuid(uuid);
  }

  @Override
  public Optional<Family> findActiveByUuid(CustomUuid uuid) {
    return jpaRepository.findActiveByUuid(uuid);
  }

  @Override
  public List<Family> findAllActive() {
    return jpaRepository.findAllActive();
  }

  @Override
  public List<FamilyWithCountsProjection> findFamiliesWithCountsByUserUuid(CustomUuid userUuid) {
    QFamily f = QFamily.family;
    QFamilyMember fm = new QFamilyMember("fm");
    QFamilyMember fmc = new QFamilyMember("fmc");
    QExpense exp = QExpense.expense;
    QCategory cat = new QCategory("cat");

    JPQLQuery<Long> memberCountSubQ = JPAExpressions
        .select(fmc.id.count())
        .from(fmc)
        .where(fmc.familyUuid.eq(f.uuid)
                             .and(fmc.status.eq(FamilyMemberStatus.ACTIVE)));

    JPQLQuery<Long> expenseCountSubQ = JPAExpressions
        .select(exp.id.count())
        .from(exp)
        .where(exp.family.uuid.eq(f.uuid)
                              .and(exp.status.eq(ExpenseStatus.ACTIVE)));

    JPQLQuery<Long> categoryCountSubQ = JPAExpressions
        .select(cat.id.count())
        .from(cat)
        .where(cat.familyUuid.eq(f.uuid)
                              .and(cat.status.eq(CategoryStatus.ACTIVE)));

    List<Tuple> tuples = queryFactory
        .select(f.uuid, f.name, f.monthlyBudget, f.createdAt, f.updatedAt,
            memberCountSubQ, expenseCountSubQ, categoryCountSubQ)
        .from(f)
        .join(fm).on(fm.familyUuid.eq(f.uuid)
                                  .and(fm.userUuid.eq(userUuid))
                                  .and(fm.status.eq(FamilyMemberStatus.ACTIVE)))
        .where(f.status.eq(FamilyStatus.ACTIVE))
        .fetch();

    return tuples.stream()
                 .map(t -> FamilyWithCountsProjection.builder()
                                                     .uuid(t.get(f.uuid))
                                                     .name(t.get(f.name))
                                                     .monthlyBudget(t.get(f.monthlyBudget))
                                                     .createdAt(t.get(f.createdAt))
                                                     .updatedAt(t.get(f.updatedAt))
                                                     .memberCount(nullToZero(t.get(memberCountSubQ)))
                                                     .expenseCount(nullToZero(t.get(expenseCountSubQ)))
                                                     .categoryCount(nullToZero(t.get(categoryCountSubQ)))
                                                     .build())
                 .toList();
  }

  private long nullToZero(Long value) {
    return value != null ? value : 0L;
  }
}

