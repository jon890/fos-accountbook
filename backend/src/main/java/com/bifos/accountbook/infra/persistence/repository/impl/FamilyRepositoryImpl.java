package com.bifos.accountbook.infra.persistence.repository.impl;

import com.bifos.accountbook.domain.entity.Family;
import com.bifos.accountbook.domain.repository.FamilyRepository;
import com.bifos.accountbook.domain.value.CustomUuid;
import com.bifos.accountbook.infra.persistence.repository.jpa.FamilyJpaRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * FamilyRepository 구현체
 * JpaRepository를 내부적으로 사용하여 도메인 인터페이스 구현
 */
@Repository
@RequiredArgsConstructor
public class FamilyRepositoryImpl implements FamilyRepository {

    private final FamilyJpaRepository jpaRepository;

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
}

