package com.bifos.accountbook.infra.persistence.repository.jpa;

import com.bifos.accountbook.domain.entity.Expense;
import com.bifos.accountbook.domain.value.CustomUuid;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

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

        @Query("SELECT e FROM Expense e WHERE e.familyUuid = :familyUuid AND e.status = com.bifos.accountbook.domain.value.ExpenseStatus.ACTIVE ORDER BY e.date DESC")
        Page<Expense> findAllByFamilyUuid(@Param("familyUuid") CustomUuid familyUuid, Pageable pageable);

        @Query("SELECT e FROM Expense e WHERE e.familyUuid = :familyUuid AND e.date BETWEEN :startDate AND :endDate AND e.status = com.bifos.accountbook.domain.value.ExpenseStatus.ACTIVE ORDER BY e.date DESC")
        List<Expense> findByFamilyUuidAndDateBetween(
                        @Param("familyUuid") CustomUuid familyUuid,
                        @Param("startDate") LocalDateTime startDate,
                        @Param("endDate") LocalDateTime endDate);

        @Query("SELECT e FROM Expense e WHERE e.familyUuid = :familyUuid AND e.categoryUuid = :categoryUuid AND e.status = com.bifos.accountbook.domain.value.ExpenseStatus.ACTIVE ORDER BY e.date DESC")
        List<Expense> findByFamilyUuidAndCategoryUuid(
                        @Param("familyUuid") CustomUuid familyUuid,
                        @Param("categoryUuid") CustomUuid categoryUuid);

        @Query("SELECT e FROM Expense e WHERE e.familyUuid = :familyUuid " +
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

        @Query("SELECT COUNT(e) FROM Expense e WHERE e.familyUuid = :familyUuid AND e.status = com.bifos.accountbook.domain.value.ExpenseStatus.ACTIVE")
        int countByFamilyUuid(@Param("familyUuid") CustomUuid familyUuid);
}
