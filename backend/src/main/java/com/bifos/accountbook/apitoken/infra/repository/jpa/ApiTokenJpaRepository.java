package com.bifos.accountbook.apitoken.infra.repository.jpa;

import com.bifos.accountbook.apitoken.domain.entity.ApiToken;
import com.bifos.accountbook.shared.value.CustomUuid;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface ApiTokenJpaRepository extends JpaRepository<ApiToken, Long> {

  @Query("""
      SELECT t
      FROM ApiToken t
      WHERE t.tokenHash = :tokenHash
      AND t.status = com.bifos.accountbook.apitoken.domain.value.ApiTokenStatus.ACTIVE
      AND EXISTS (
        SELECT 1
        FROM User u
        WHERE u.uuid = t.userUuid
        AND u.status = com.bifos.accountbook.user.domain.value.UserStatus.ACTIVE
      )
      """)
  Optional<ApiToken> findActiveByTokenHash(@Param("tokenHash") String tokenHash);

  @Query("""
      SELECT t
      FROM ApiToken t
      WHERE t.uuid = :uuid
      AND t.userUuid = :userUuid
      AND t.status = com.bifos.accountbook.apitoken.domain.value.ApiTokenStatus.ACTIVE
      """)
  Optional<ApiToken> findActiveByUuidAndUserUuid(@Param("uuid") CustomUuid uuid,
                                                 @Param("userUuid") CustomUuid userUuid);

  @Query("""
      SELECT t
      FROM ApiToken t
      WHERE t.userUuid = :userUuid
      AND t.status = com.bifos.accountbook.apitoken.domain.value.ApiTokenStatus.ACTIVE
      ORDER BY t.createdAt DESC, t.id DESC
      """)
  List<ApiToken> findAllActiveByUserUuid(@Param("userUuid") CustomUuid userUuid);

  @Query("""
      SELECT COUNT(t)
      FROM ApiToken t
      WHERE t.userUuid = :userUuid
      AND t.status = com.bifos.accountbook.apitoken.domain.value.ApiTokenStatus.ACTIVE
      """)
  long countActiveByUserUuid(@Param("userUuid") CustomUuid userUuid);

  // 조회한 엔티티를 save 하면 merge 로 모든 칸을 덮어써 그 사이 폐기된 상태를 되돌릴 수 있어, 조건부 UPDATE 로만 갱신한다
  @Modifying
  @Query("""
      UPDATE ApiToken t
      SET t.lastUsedAt = :now
      WHERE t.id = :id
      AND t.status = com.bifos.accountbook.apitoken.domain.value.ApiTokenStatus.ACTIVE
      """)
  int updateLastUsedAt(@Param("id") Long id, @Param("now") LocalDateTime now);
}
