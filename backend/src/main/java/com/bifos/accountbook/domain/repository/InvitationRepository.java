package com.bifos.accountbook.domain.repository;

import com.bifos.accountbook.domain.entity.Invitation;
import com.bifos.accountbook.domain.value.CustomUuid;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface InvitationRepository extends JpaRepository<Invitation, Long> {

        Optional<Invitation> findByToken(String token);

        Optional<Invitation> findByUuid(CustomUuid uuid);

        @Query("SELECT i FROM Invitation i WHERE i.familyUuid = :familyUuid AND i.status = 'PENDING' AND i.expiresAt > :now AND i.deletedAt IS NULL")
        List<Invitation> findActiveByFamilyUuid(
                        @Param("familyUuid") CustomUuid familyUuid,
                        @Param("now") LocalDateTime now);

        @Query("SELECT i FROM Invitation i WHERE i.token = :token AND i.status = 'PENDING' AND i.expiresAt > :now AND i.deletedAt IS NULL")
        Optional<Invitation> findValidByToken(
                        @Param("token") String token,
                        @Param("now") LocalDateTime now);
}
