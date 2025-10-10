package com.bifos.accountbook.domain.repository;

import com.bifos.accountbook.domain.entity.Family;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface FamilyRepository extends JpaRepository<Family, Long> {
    
    Optional<Family> findByUuid(UUID uuid);
    
    @Query("SELECT f FROM Family f WHERE f.uuid = :uuid AND f.deletedAt IS NULL")
    Optional<Family> findActiveByUuid(@Param("uuid") UUID uuid);
    
    @Query("SELECT f FROM Family f WHERE f.deletedAt IS NULL")
    List<Family> findAllActive();
}

