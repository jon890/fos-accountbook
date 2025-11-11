package com.bifos.accountbook.infra.persistence.repository.jpa;

import com.bifos.accountbook.domain.entity.FamilyMember;
import com.bifos.accountbook.domain.value.CustomUuid;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

/**
 * FamilyMember JPA Repository
 * Spring Data JPA 인터페이스 (Infrastructure Layer)
 */
public interface FamilyMemberJpaRepository extends JpaRepository<FamilyMember, Long> {

    Optional<FamilyMember> findByUuid(CustomUuid uuid);

    @Query("SELECT fm FROM FamilyMember fm WHERE fm.familyUuid = :familyUuid AND fm.userUuid = :userUuid AND fm.deletedAt IS NULL")
    Optional<FamilyMember> findByFamilyUuidAndUserUuid(
            @Param("familyUuid") CustomUuid familyUuid,
            @Param("userUuid") CustomUuid userUuid);

    @Query("SELECT fm FROM FamilyMember fm WHERE fm.familyUuid = :familyUuid AND fm.deletedAt IS NULL")
    List<FamilyMember> findAllByFamilyUuid(@Param("familyUuid") CustomUuid familyUuid);

    @Query("SELECT fm FROM FamilyMember fm WHERE fm.userUuid = :userUuid AND fm.deletedAt IS NULL")
    List<FamilyMember> findAllByUserUuid(@Param("userUuid") CustomUuid userUuid);

    boolean existsByFamilyUuidAndUserUuidAndDeletedAtIsNull(CustomUuid familyUuid, CustomUuid userUuid);

    @Query("SELECT COUNT(fm) FROM FamilyMember fm WHERE fm.familyUuid = :familyUuid AND fm.deletedAt IS NULL")
    int countByFamilyUuid(@Param("familyUuid") CustomUuid familyUuid);

    @Query("SELECT COUNT(fm) FROM FamilyMember fm WHERE fm.userUuid = :userUuid AND fm.deletedAt IS NULL")
    int countByUserUuid(@Param("userUuid") CustomUuid userUuid);
}

