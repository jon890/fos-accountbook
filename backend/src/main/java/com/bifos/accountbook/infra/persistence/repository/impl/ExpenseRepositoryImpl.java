package com.bifos.accountbook.infra.persistence.repository.impl;

import com.bifos.accountbook.domain.entity.Expense;
import com.bifos.accountbook.domain.repository.ExpenseRepository;
import com.bifos.accountbook.domain.value.CustomUuid;
import com.bifos.accountbook.infra.persistence.repository.jpa.ExpenseJpaRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

/**
 * ExpenseRepository 구현체
.* - JpaRepository를 사용한 기본 CRUD 작업 전담
 * - 통계 쿼리는 DashboardRepository로 분리됨
 */
@Repository
@RequiredArgsConstructor
public class ExpenseRepositoryImpl implements ExpenseRepository {

    private final ExpenseJpaRepository jpaRepository;

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
    public List<Expense> findByFamilyUuidAndDateBetween(
            CustomUuid familyUuid,
            LocalDateTime startDate,
            LocalDateTime endDate) {
        return jpaRepository.findByFamilyUuidAndDateBetween(familyUuid, startDate, endDate);
    }

    @Override
    public List<Expense> findByFamilyUuidAndCategoryUuid(
            CustomUuid familyUuid,
            CustomUuid categoryUuid) {
        return jpaRepository.findByFamilyUuidAndCategoryUuid(familyUuid, categoryUuid);
    }

    @Override
    public Page<Expense> findByFamilyUuidWithFilters(
            CustomUuid familyUuid,
            CustomUuid categoryUuid,
            LocalDateTime startDate,
            LocalDateTime endDate,
            Pageable pageable) {
        return jpaRepository.findByFamilyUuidWithFilters(familyUuid, categoryUuid, startDate, endDate, pageable);
    }

    @Override
    public int countByFamilyUuid(CustomUuid familyUuid) {
        return jpaRepository.countByFamilyUuid(familyUuid);
    }
}
