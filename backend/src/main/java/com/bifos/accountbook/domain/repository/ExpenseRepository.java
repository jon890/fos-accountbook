package com.bifos.accountbook.domain.repository;

import com.bifos.accountbook.domain.entity.Expense;
import com.bifos.accountbook.domain.value.CustomUuid;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

/**
 * 지출 Repository 인터페이스
 * JPA에 의존하지 않는 순수 도메인 레이어 인터페이스
 */
public interface ExpenseRepository {

    /**
     * 지출 저장
     */
    Expense save(Expense expense);

    /**
     * UUID로 지출 조회
     */
    Optional<Expense> findByUuid(CustomUuid uuid);

    /**
     * UUID로 활성화된 지출 조회 (삭제되지 않은)
     */
    Optional<Expense> findActiveByUuid(CustomUuid uuid);

    /**
     * 가족 UUID로 모든 활성 지출 조회 (페이징)
     */
    Page<Expense> findAllByFamilyUuid(CustomUuid familyUuid, Pageable pageable);

    /**
     * 가족 UUID와 날짜 범위로 지출 조회
     */
    List<Expense> findByFamilyUuidAndDateBetween(
            CustomUuid familyUuid,
            LocalDateTime startDate,
            LocalDateTime endDate);

    /**
     * 가족 UUID와 카테고리 UUID로 지출 조회
     */
    List<Expense> findByFamilyUuidAndCategoryUuid(
            CustomUuid familyUuid,
            CustomUuid categoryUuid);
}
