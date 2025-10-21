package com.bifos.accountbook.infra.persistence.repository.impl;

import com.bifos.accountbook.domain.entity.Income;
import com.bifos.accountbook.domain.repository.IncomeRepository;
import com.bifos.accountbook.domain.value.CustomUuid;
import com.bifos.accountbook.infra.persistence.repository.jpa.IncomeJpaRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

/**
 * IncomeRepository 구현체
 * JpaRepository를 내부적으로 사용하여 도메인 인터페이스 구현
 */
@Repository
@RequiredArgsConstructor
public class IncomeRepositoryImpl implements IncomeRepository {

    private final IncomeJpaRepository jpaRepository;

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
    public List<Income> findByFamilyUuidAndDateBetween(
            CustomUuid familyUuid,
            LocalDateTime startDate,
            LocalDateTime endDate) {
        return jpaRepository.findByFamilyUuidAndDateBetween(familyUuid, startDate, endDate);
    }

    @Override
    public List<Income> findByFamilyUuidAndCategoryUuid(
            CustomUuid familyUuid,
            CustomUuid categoryUuid) {
        return jpaRepository.findByFamilyUuidAndCategoryUuid(familyUuid, categoryUuid);
    }

    @Override
    public Page<Income> findByFamilyUuidWithFilters(
            CustomUuid familyUuid,
            CustomUuid categoryUuid,
            LocalDateTime startDate,
            LocalDateTime endDate,
            Pageable pageable) {
        return jpaRepository.findByFamilyUuidWithFilters(familyUuid, categoryUuid, startDate, endDate, pageable);
    }
}

