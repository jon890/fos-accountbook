package com.bifos.accountbook.infra.persistence.repository.jpa;

import com.bifos.accountbook.domain.entity.Expense;
import com.bifos.accountbook.domain.value.CustomUuid;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

/**
 * Expense JPA Repository
 * Spring Data JPA 인터페이스 (Infrastructure Layer)
 */
public interface ExpenseJpaRepository extends JpaRepository<Expense, Long> {

        Optional<Expense> findByUuid(CustomUuid uuid);

        @Query("SELECT e FROM Expense e WHERE e.uuid = :uuid AND e.status = com.bifos.accountbook.domain.value.ExpenseStatus.ACTIVE")
        Optional<Expense> findActiveByUuid(@Param("uuid") CustomUuid uuid);

        @Query("SELECT e FROM Expense e WHERE e.family.uuid = :familyUuid AND e.status = com.bifos.accountbook.domain.value.ExpenseStatus.ACTIVE ORDER BY e.date DESC")
        Page<Expense> findAllByFamilyUuid(@Param("familyUuid") CustomUuid familyUuid, Pageable pageable);

        @Query("SELECT e FROM Expense e WHERE e.family.uuid = :familyUuid AND e.date BETWEEN :startDate AND :endDate AND e.status = com.bifos.accountbook.domain.value.ExpenseStatus.ACTIVE ORDER BY e.date DESC")
        List<Expense> findByFamilyUuidAndDateBetween(
                        @Param("familyUuid") CustomUuid familyUuid,
                        @Param("startDate") LocalDateTime startDate,
                        @Param("endDate") LocalDateTime endDate);

        @Query("SELECT e FROM Expense e WHERE e.family.uuid = :familyUuid AND e.categoryUuid = :categoryUuid AND e.status = com.bifos.accountbook.domain.value.ExpenseStatus.ACTIVE ORDER BY e.date DESC")
        List<Expense> findByFamilyUuidAndCategoryUuid(
                        @Param("familyUuid") CustomUuid familyUuid,
                        @Param("categoryUuid") CustomUuid categoryUuid);

        @Query("SELECT e FROM Expense e WHERE e.family.uuid = :familyUuid " +
                        "AND (:categoryUuid IS NULL OR e.categoryUuid = :categoryUuid) " +
                        "AND (:startDate IS NULL OR e.date >= :startDate) " +
                        "AND (:endDate IS NULL OR e.date <= :endDate) " +
                        "AND e.status = com.bifos.accountbook.domain.value.ExpenseStatus.ACTIVE")
        Page<Expense> findByFamilyUuidWithFilters(
                        @Param("familyUuid") CustomUuid familyUuid,
                        @Param("categoryUuid") CustomUuid categoryUuid,
                        @Param("startDate") LocalDateTime startDate,
                        @Param("endDate") LocalDateTime endDate,
                        Pageable pageable);

        @Query("SELECT COUNT(e) FROM Expense e WHERE e.family.uuid = :familyUuid AND e.status = com.bifos.accountbook.domain.value.ExpenseStatus.ACTIVE")
        int countByFamilyUuid(@Param("familyUuid") CustomUuid familyUuid);

        /**
         * 카테고리별 지출 통계 집계 쿼리
         */
        @Query("SELECT " +
                       "COALESCE(CAST(e.categoryUuid AS string), 'UNKNOWN') as categoryUuid, " +
                       "COALESCE(c.name, '미분류') as categoryName, " +
                       "COALESCE(c.icon, '❓') as categoryIcon, " +
                       "COALESCE(c.color, '#999999') as categoryColor, " +
                       "SUM(e.amount) as totalAmount, " +
                       "COUNT(e.id) as count " +
                       "FROM Expense e " +
                       "LEFT JOIN Category c ON e.categoryUuid = c.uuid AND c.status = com.bifos.accountbook.domain.value.CategoryStatus.ACTIVE " +
                       "WHERE e.family.uuid = :familyUuid " +
                       "AND e.status = com.bifos.accountbook.domain.value.ExpenseStatus.ACTIVE " +
                       "AND (:categoryUuid IS NULL OR e.categoryUuid = :categoryUuid) " +
                       "AND (:startDate IS NULL OR e.date >= :startDate) " +
                       "AND (:endDate IS NULL OR e.date <= :endDate) " +
                       "GROUP BY e.categoryUuid, c.name, c.icon, c.color " +
                       "ORDER BY SUM(e.amount) DESC")
        List<com.bifos.accountbook.domain.repository.projection.CategoryExpenseProjection> findCategoryExpenseStats(
                        @Param("familyUuid") CustomUuid familyUuid,
                        @Param("categoryUuid") CustomUuid categoryUuid,
                        @Param("startDate") LocalDateTime startDate,
                        @Param("endDate") LocalDateTime endDate);

        /**
         * 전체 지출 합계 조회
         */
        @Query("SELECT COALESCE(SUM(e.amount), 0) " +
                       "FROM Expense e " +
                       "WHERE e.family.uuid = :familyUuid " +
                       "AND e.status = com.bifos.accountbook.domain.value.ExpenseStatus.ACTIVE " +
                       "AND (:categoryUuid IS NULL OR e.categoryUuid = :categoryUuid) " +
                       "AND (:startDate IS NULL OR e.date >= :startDate) " +
                       "AND (:endDate IS NULL OR e.date <= :endDate)")
        BigDecimal getTotalExpenseAmount(
                        @Param("familyUuid") CustomUuid familyUuid,
                        @Param("categoryUuid") CustomUuid categoryUuid,
                        @Param("startDate") LocalDateTime startDate,
                        @Param("endDate") LocalDateTime endDate);

        /**
         * 가족 UUID와 날짜 범위로 지출 금액 합계 조회
         * 예산 알림 체크용
         */
        @Query("SELECT COALESCE(SUM(e.amount), 0) " +
                       "FROM Expense e " +
                       "WHERE e.family.uuid = :familyUuid " +
                       "AND e.status = com.bifos.accountbook.domain.value.ExpenseStatus.ACTIVE " +
                       "AND e.date BETWEEN :startDate AND :endDate")
        BigDecimal sumAmountByFamilyUuidAndDateBetween(
                        @Param("familyUuid") CustomUuid familyUuid,
                        @Param("startDate") LocalDateTime startDate,
                        @Param("endDate") LocalDateTime endDate);
}
