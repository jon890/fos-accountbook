package com.bifos.accountbook.infra.persistence.repository.jpa;

import com.bifos.accountbook.domain.entity.Expense;
import com.bifos.accountbook.domain.value.CustomUuid;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

/**
 * Expense JPA Repository
 * Spring Data JPA 인터페이스 (Infrastructure Layer)
 */
public interface ExpenseJpaRepository extends JpaRepository<Expense, Long> {

  Optional<Expense> findByUuid(CustomUuid uuid);

  @Query("""
         SELECT e
         FROM Expense e
         WHERE e.uuid = :uuid
         AND e.status = com.bifos.accountbook.domain.value.ExpenseStatus.ACTIVE
      """)
  Optional<Expense> findActiveByUuid(@Param("uuid") CustomUuid uuid);

  @Query("""
      SELECT e
      FROM Expense e
      WHERE e.family.uuid = :familyUuid
      AND e.status = com.bifos.accountbook.domain.value.ExpenseStatus.ACTIVE
      ORDER BY e.date DESC
      """)
  Page<Expense> findAllByFamilyUuid(@Param("familyUuid") CustomUuid familyUuid, Pageable pageable);

  @Query("""
      SELECT e
      FROM Expense e
      WHERE e.family.uuid = :familyUuid
      AND e.date BETWEEN :startDate AND :endDate
      AND e.status = com.bifos.accountbook.domain.value.ExpenseStatus.ACTIVE
      ORDER BY e.date DESC
      """)
  List<Expense> findByFamilyUuidAndDateBetween(
      @Param("familyUuid") CustomUuid familyUuid,
      @Param("startDate") LocalDateTime startDate,
      @Param("endDate") LocalDateTime endDate);

  @Query("""
          SELECT COUNT(e)
          FROM Expense e
          WHERE e.family.uuid = :familyUuid
          AND e.status = com.bifos.accountbook.domain.value.ExpenseStatus.ACTIVE
          """)
  int countByFamilyUuid(@Param("familyUuid") CustomUuid familyUuid);

  /**
   * 가족 UUID와 날짜 범위로 지출 금액 합계 조회
   * 예산 알림 체크용
   * - 예산 제외 플래그가 true인 지출 제외
   * - 카테고리의 예산 제외 플래그가 true인 지출도 제외
   */
  @Query("SELECT COALESCE(SUM(e.amount), 0) " +
      "FROM Expense e " +
      "LEFT JOIN Category c ON e.categoryUuid = c.uuid AND c.status = com.bifos.accountbook.domain.value.CategoryStatus.ACTIVE " +
      "WHERE e.family.uuid = :familyUuid " +
      "AND e.status = com.bifos.accountbook.domain.value.ExpenseStatus.ACTIVE " +
      "AND e.date BETWEEN :startDate AND :endDate " +
      "AND e.excludeFromBudget = false " +
      "AND (c.excludeFromBudget IS NULL OR c.excludeFromBudget = false)")
  BigDecimal sumAmountByFamilyUuidAndDateBetween(
      @Param("familyUuid") CustomUuid familyUuid,
      @Param("startDate") LocalDateTime startDate,
      @Param("endDate") LocalDateTime endDate);
}
