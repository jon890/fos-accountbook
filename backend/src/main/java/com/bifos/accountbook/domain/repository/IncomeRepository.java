package com.bifos.accountbook.domain.repository;

import com.bifos.accountbook.domain.entity.Income;
import com.bifos.accountbook.domain.value.CustomUuid;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

/**
 * 수입 Repository 인터페이스
 * JPA에 의존하지 않는 순수 도메인 레이어 인터페이스
 */
public interface IncomeRepository {

  /**
   * 수입 저장
   */
  Income save(Income income);

  /**
   * UUID로 수입 조회
   */
  Optional<Income> findByUuid(CustomUuid uuid);

  /**
   * UUID로 활성화된 수입 조회 (삭제되지 않은)
   */
  Optional<Income> findActiveByUuid(CustomUuid uuid);

  /**
   * 가족 UUID로 모든 활성 수입 조회 (페이징)
   */
  Page<Income> findAllByFamilyUuid(CustomUuid familyUuid, Pageable pageable);

  /**
   * 가족 UUID와 날짜 범위로 수입 조회
   */
  List<Income> findByFamilyUuidAndDateBetween(
      CustomUuid familyUuid,
      LocalDateTime startDate,
      LocalDateTime endDate);

  /**
   * 가족 UUID와 카테고리 UUID로 수입 조회
   */
  List<Income> findByFamilyUuidAndCategoryUuid(
      CustomUuid familyUuid,
      CustomUuid categoryUuid);

  /**
   * 가족 UUID와 필터링 조건으로 수입 조회 (페이징)
   */
  Page<Income> findByFamilyUuidWithFilters(
      CustomUuid familyUuid,
      CustomUuid categoryUuid,
      LocalDateTime startDate,
      LocalDateTime endDate,
      Pageable pageable);
}

