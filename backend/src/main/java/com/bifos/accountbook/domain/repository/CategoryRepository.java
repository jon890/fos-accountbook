package com.bifos.accountbook.domain.repository;

import com.bifos.accountbook.domain.entity.Category;
import com.bifos.accountbook.domain.value.CustomUuid;

import java.util.List;
import java.util.Optional;

/**
 * 카테고리 Repository 인터페이스
 * JPA에 의존하지 않는 순수 도메인 레이어 인터페이스
 */
public interface CategoryRepository {

    /**
     * 카테고리 저장
     */
    Category save(Category category);

    /**
     * UUID로 카테고리 조회
     */
    Optional<Category> findByUuid(CustomUuid uuid);

    /**
     * UUID로 활성화된 카테고리 조회 (삭제되지 않은)
     */
    Optional<Category> findActiveByUuid(CustomUuid uuid);

    /**
     * 가족 UUID로 모든 활성 카테고리 조회
     */
    List<Category> findAllByFamilyUuid(CustomUuid familyUuid);

    /**
     * 가족 UUID와 이름으로 카테고리 조회
     */
    Optional<Category> findByFamilyUuidAndName(CustomUuid familyUuid, String name);

    /**
     * 가족 UUID로 카테고리 개수 조회 (삭제되지 않은)
     */
    int countByFamilyUuid(CustomUuid familyUuid);
}
