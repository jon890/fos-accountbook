package com.bifos.accountbook.domain.repository;

import com.bifos.accountbook.domain.entity.Expense;
import com.bifos.accountbook.domain.value.CustomUuid;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface ExpenseRepository extends JpaRepository<Expense, Long> {

        Optional<Expense> findByUuid(CustomUuid uuid);

        @Query("SELECT e FROM Expense e WHERE e.uuid = :uuid AND e.deletedAt IS NULL")
        Optional<Expense> findActiveByUuid(@Param("uuid") CustomUuid uuid);

        @Query("SELECT e FROM Expense e WHERE e.familyUuid = :familyUuid AND e.deletedAt IS NULL ORDER BY e.date DESC")
        Page<Expense> findAllByFamilyUuid(@Param("familyUuid") CustomUuid familyUuid, Pageable pageable);

        @Query("SELECT e FROM Expense e WHERE e.familyUuid = :familyUuid AND e.date BETWEEN :startDate AND :endDate AND e.deletedAt IS NULL ORDER BY e.date DESC")
        List<Expense> findByFamilyUuidAndDateBetween(
                        @Param("familyUuid") CustomUuid familyUuid,
                        @Param("startDate") LocalDateTime startDate,
                        @Param("endDate") LocalDateTime endDate);

        @Query("SELECT e FROM Expense e WHERE e.familyUuid = :familyUuid AND e.categoryUuid = :categoryUuid AND e.deletedAt IS NULL ORDER BY e.date DESC")
        List<Expense> findByFamilyUuidAndCategoryUuid(
                        @Param("familyUuid") CustomUuid familyUuid,
                        @Param("categoryUuid") CustomUuid categoryUuid);
}
