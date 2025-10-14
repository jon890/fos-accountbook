package com.bifos.accountbook.domain.repository;

import com.bifos.accountbook.domain.entity.Category;
import com.bifos.accountbook.domain.value.CustomUuid;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface CategoryRepository extends JpaRepository<Category, Long> {

    Optional<Category> findByUuid(CustomUuid uuid);

    @Query("SELECT c FROM Category c WHERE c.uuid = :uuid AND c.deletedAt IS NULL")
    Optional<Category> findActiveByUuid(@Param("uuid") CustomUuid uuid);

    @Query("SELECT c FROM Category c WHERE c.familyUuid = :familyUuid AND c.deletedAt IS NULL")
    List<Category> findAllByFamilyUuid(@Param("familyUuid") CustomUuid familyUuid);

    @Query("SELECT c FROM Category c WHERE c.familyUuid = :familyUuid AND c.name = :name AND c.deletedAt IS NULL")
    Optional<Category> findByFamilyUuidAndName(
            @Param("familyUuid") CustomUuid familyUuid,
            @Param("name") String name);
}
