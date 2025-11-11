package com.bifos.accountbook.infra.persistence.repository.jpa;

import com.bifos.accountbook.domain.entity.Family;
import com.bifos.accountbook.domain.value.CustomUuid;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

/**
 * Family JPA Repository
 * Spring Data JPA 인터페이스 (Infrastructure Layer)
 */
public interface FamilyJpaRepository extends JpaRepository<Family, Long> {

    Optional<Family> findByUuid(CustomUuid uuid);

    @Query("SELECT f FROM Family f WHERE f.uuid = :uuid AND f.status = com.bifos.accountbook.domain.value.FamilyStatus.ACTIVE")
    Optional<Family> findActiveByUuid(@Param("uuid") CustomUuid uuid);

    @Query("SELECT f FROM Family f WHERE f.status = com.bifos.accountbook.domain.value.FamilyStatus.ACTIVE")
    List<Family> findAllActive();
}

