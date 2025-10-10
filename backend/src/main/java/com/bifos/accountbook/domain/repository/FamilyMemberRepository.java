package com.bifos.accountbook.domain.repository;

import com.bifos.accountbook.domain.entity.FamilyMember;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface FamilyMemberRepository extends JpaRepository<FamilyMember, Long> {
    
    Optional<FamilyMember> findByUuid(UUID uuid);
    
    @Query("SELECT fm FROM FamilyMember fm WHERE fm.familyUuid = :familyUuid AND fm.userUuid = :userUuid AND fm.deletedAt IS NULL")
    Optional<FamilyMember> findByFamilyUuidAndUserUuid(
            @Param("familyUuid") UUID familyUuid,
            @Param("userUuid") UUID userUuid
    );
    
    @Query("SELECT fm FROM FamilyMember fm WHERE fm.familyUuid = :familyUuid AND fm.deletedAt IS NULL")
    List<FamilyMember> findAllByFamilyUuid(@Param("familyUuid") UUID familyUuid);
    
    @Query("SELECT fm FROM FamilyMember fm WHERE fm.userUuid = :userUuid AND fm.deletedAt IS NULL")
    List<FamilyMember> findAllByUserUuid(@Param("userUuid") UUID userUuid);
    
    boolean existsByFamilyUuidAndUserUuidAndDeletedAtIsNull(UUID familyUuid, UUID userUuid);
}

