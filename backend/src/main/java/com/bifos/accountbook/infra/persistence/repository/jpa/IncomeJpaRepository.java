package com.bifos.accountbook.infra.persistence.repository.jpa;

import com.bifos.accountbook.domain.entity.Income;
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
 * Income JPA Repository
 * Spring Data JPA 인터페이스 (Infrastructure Layer)
 */
public interface IncomeJpaRepository extends JpaRepository<Income, Long> {

    Optional<Income> findByUuid(CustomUuid uuid);

    @Query("SELECT i FROM Income i WHERE i.uuid = :uuid AND i.status = com.bifos.accountbook.domain.value.IncomeStatus.ACTIVE")
    Optional<Income> findActiveByUuid(@Param("uuid") CustomUuid uuid);

    @Query("SELECT i FROM Income i WHERE i.familyUuid = :familyUuid AND i.status = com.bifos.accountbook.domain.value.IncomeStatus.ACTIVE ORDER BY i.date DESC")
    Page<Income> findAllByFamilyUuid(@Param("familyUuid") CustomUuid familyUuid, Pageable pageable);

    @Query("SELECT i FROM Income i WHERE i.familyUuid = :familyUuid AND i.date BETWEEN :startDate AND :endDate AND i.status = com.bifos.accountbook.domain.value.IncomeStatus.ACTIVE ORDER BY i.date DESC")
    List<Income> findByFamilyUuidAndDateBetween(
            @Param("familyUuid") CustomUuid familyUuid,
            @Param("startDate") LocalDateTime startDate,
            @Param("endDate") LocalDateTime endDate);

    @Query("SELECT i FROM Income i WHERE i.familyUuid = :familyUuid AND i.categoryUuid = :categoryUuid AND i.status = com.bifos.accountbook.domain.value.IncomeStatus.ACTIVE ORDER BY i.date DESC")
    List<Income> findByFamilyUuidAndCategoryUuid(
            @Param("familyUuid") CustomUuid familyUuid,
            @Param("categoryUuid") CustomUuid categoryUuid);

    @Query("SELECT i FROM Income i WHERE i.familyUuid = :familyUuid " +
            "AND (:categoryUuid IS NULL OR i.categoryUuid = :categoryUuid) " +
            "AND (:startDate IS NULL OR i.date >= :startDate) " +
            "AND (:endDate IS NULL OR i.date <= :endDate) " +
            "AND i.status = com.bifos.accountbook.domain.value.IncomeStatus.ACTIVE " +
            "ORDER BY i.date DESC")
    Page<Income> findByFamilyUuidWithFilters(
            @Param("familyUuid") CustomUuid familyUuid,
            @Param("categoryUuid") CustomUuid categoryUuid,
            @Param("startDate") LocalDateTime startDate,
            @Param("endDate") LocalDateTime endDate,
            Pageable pageable);
}

