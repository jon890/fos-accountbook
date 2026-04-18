package com.bifos.accountbook.family.domain.repository;

import com.bifos.accountbook.family.domain.entity.Family;
import com.bifos.accountbook.family.domain.repository.projection.FamilyWithCountsProjection;
import com.bifos.accountbook.shared.value.CustomUuid;
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

  /**
   * 사용자가 속한 가족 목록을 멤버/지출/카테고리 카운트와 함께 단일 쿼리로 조회 (N+1 방지)
   */
  List<FamilyWithCountsProjection> findFamiliesWithCountsByUserUuid(CustomUuid userUuid);
}
