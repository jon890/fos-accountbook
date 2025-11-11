package com.bifos.accountbook.domain.repository;

import com.bifos.accountbook.domain.entity.FamilyMember;
import com.bifos.accountbook.domain.value.CustomUuid;

import java.util.List;
import java.util.Optional;

/**
 * 가족 구성원 Repository 인터페이스
 * JPA에 의존하지 않는 순수 도메인 레이어 인터페이스
 */
public interface FamilyMemberRepository {

    /**
     * 가족 구성원 저장
     */
    FamilyMember save(FamilyMember familyMember);

    /**
     * UUID로 가족 구성원 조회
     */
    Optional<FamilyMember> findByUuid(CustomUuid uuid);

    /**
     * 가족 UUID와 사용자 UUID로 구성원 조회
     */
    Optional<FamilyMember> findByFamilyUuidAndUserUuid(CustomUuid familyUuid, CustomUuid userUuid);

    /**
     * 가족 UUID로 모든 구성원 조회
     */
    List<FamilyMember> findAllByFamilyUuid(CustomUuid familyUuid);

    /**
     * 사용자 UUID로 모든 구성원 조회
     */
    List<FamilyMember> findAllByUserUuid(CustomUuid userUuid);

    /**
     * 가족 UUID와 사용자 UUID로 구성원 존재 여부 확인 (삭제되지 않은)
     */
    boolean existsByFamilyUuidAndUserUuidAndDeletedAtIsNull(CustomUuid familyUuid, CustomUuid userUuid);

    /**
     * 가족 UUID로 구성원 수 조회
     */
    int countByFamilyUuid(CustomUuid familyUuid);

    /**
     * 사용자 UUID로 가족 수 조회 (해당 사용자가 속한 가족 수)
     */
    int countByUserUuid(CustomUuid userUuid);
}
