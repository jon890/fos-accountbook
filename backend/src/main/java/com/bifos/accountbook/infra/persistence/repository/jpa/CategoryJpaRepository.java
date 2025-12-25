package com.bifos.accountbook.infra.persistence.repository.jpa;

import com.bifos.accountbook.domain.entity.Category;
import com.bifos.accountbook.domain.value.CustomUuid;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

/**
 * Category JPA Repository
 * Spring Data JPA 인터페이스 (Infrastructure Layer)
 */
public interface CategoryJpaRepository extends JpaRepository<Category, Long> {

  Optional<Category> findByUuid(CustomUuid uuid);

  @Query("SELECT c FROM Category c WHERE c.uuid = :uuid AND c.status = com.bifos.accountbook.domain.value.CategoryStatus.ACTIVE")
  Optional<Category> findActiveByUuid(@Param("uuid") CustomUuid uuid);

  @Query("SELECT c FROM Category c WHERE c.familyUuid = :familyUuid AND c.status = com.bifos.accountbook.domain.value.CategoryStatus.ACTIVE")
  List<Category> findAllByFamilyUuid(@Param("familyUuid") CustomUuid familyUuid);

  @Query("SELECT c FROM Category c WHERE c.familyUuid = :familyUuid AND c.name = :name AND c.status = com.bifos.accountbook.domain.value.CategoryStatus.ACTIVE")
  Optional<Category> findByFamilyUuidAndName(
      @Param("familyUuid") CustomUuid familyUuid,
      @Param("name") String name);

  @Query("SELECT c FROM Category c WHERE c.familyUuid = :familyUuid AND c.isDefault = true AND c.status = com.bifos.accountbook.domain.value.CategoryStatus.ACTIVE")
  Optional<Category> findByFamilyUuidAndIsDefaultTrue(@Param("familyUuid") CustomUuid familyUuid);

  @Query("SELECT COUNT(c) FROM Category c WHERE c.familyUuid = :familyUuid AND c.status = com.bifos.accountbook.domain.value.CategoryStatus.ACTIVE")
  int countByFamilyUuid(@Param("familyUuid") CustomUuid familyUuid);
}

