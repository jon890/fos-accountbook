package com.bifos.accountbook.domain.repository;

import com.bifos.accountbook.domain.entity.Category;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface CategoryRepository extends JpaRepository<Category, Long> {
    
    Optional<Category> findByUuid(UUID uuid);
    
    @Query("SELECT c FROM Category c WHERE c.uuid = :uuid AND c.deletedAt IS NULL")
    Optional<Category> findActiveByUuid(@Param("uuid") UUID uuid);
    
    @Query("SELECT c FROM Category c WHERE c.familyUuid = :familyUuid AND c.deletedAt IS NULL")
    List<Category> findAllByFamilyUuid(@Param("familyUuid") UUID familyUuid);
    
    @Query("SELECT c FROM Category c WHERE c.familyUuid = :familyUuid AND c.name = :name AND c.deletedAt IS NULL")
    Optional<Category> findByFamilyUuidAndName(
            @Param("familyUuid") UUID familyUuid,
            @Param("name") String name
    );
}

