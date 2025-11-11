package com.bifos.accountbook.infra.persistence.repository.impl;

import com.bifos.accountbook.domain.entity.FamilyMember;
import com.bifos.accountbook.domain.repository.FamilyMemberRepository;
import com.bifos.accountbook.domain.value.CustomUuid;
import com.bifos.accountbook.infra.persistence.repository.jpa.FamilyMemberJpaRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * FamilyMemberRepository 구현체
 * JpaRepository를 내부적으로 사용하여 도메인 인터페이스 구현
 */
@Repository
@RequiredArgsConstructor
public class FamilyMemberRepositoryImpl implements FamilyMemberRepository {

    private final FamilyMemberJpaRepository jpaRepository;

    @Override
    public FamilyMember save(FamilyMember familyMember) {
        return jpaRepository.save(familyMember);
    }

    @Override
    public Optional<FamilyMember> findByUuid(CustomUuid uuid) {
        return jpaRepository.findByUuid(uuid);
    }

    @Override
    public Optional<FamilyMember> findByFamilyUuidAndUserUuid(CustomUuid familyUuid, CustomUuid userUuid) {
        return jpaRepository.findByFamilyUuidAndUserUuid(familyUuid, userUuid);
    }

    @Override
    public List<FamilyMember> findAllByFamilyUuid(CustomUuid familyUuid) {
        return jpaRepository.findAllByFamilyUuid(familyUuid);
    }

    @Override
    public List<FamilyMember> findAllByUserUuid(CustomUuid userUuid) {
        return jpaRepository.findAllByUserUuid(userUuid);
    }

    @Override
    public boolean existsByFamilyUuidAndUserUuidAndDeletedAtIsNull(CustomUuid familyUuid, CustomUuid userUuid) {
        return jpaRepository.existsByFamilyUuidAndUserUuidAndDeletedAtIsNull(familyUuid, userUuid);
    }

    @Override
    public int countByFamilyUuid(CustomUuid familyUuid) {
        return jpaRepository.countByFamilyUuid(familyUuid);
    }

    @Override
    public int countByUserUuid(CustomUuid userUuid) {
        return jpaRepository.countByUserUuid(userUuid);
    }
}

