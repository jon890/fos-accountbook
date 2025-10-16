package com.bifos.accountbook.domain.repository;

import com.bifos.accountbook.domain.entity.Family;
import com.bifos.accountbook.domain.value.CustomUuid;

import java.util.List;
import java.util.Optional;

/**
 * 가족 Repository 인터페이스
 * JPA에 의존하지 않는 순수 도메인 레이어 인터페이스
 */
public interface FamilyRepository {

    /**
     * 가족 저장
     */
    Family save(Family family);

    /**
     * UUID로 가족 조회
     */
    Optional<Family> findByUuid(CustomUuid uuid);

    /**
     * UUID로 활성화된 가족 조회 (삭제되지 않은)
     */
    Optional<Family> findActiveByUuid(CustomUuid uuid);

    /**
     * 모든 활성 가족 조회
     */
    List<Family> findAllActive();
}
