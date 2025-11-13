package com.bifos.accountbook.infra.persistence.repository.jpa;

import com.bifos.accountbook.domain.entity.User;
import com.bifos.accountbook.domain.value.CustomUuid;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

/**
 * User JPA Repository
 * Spring Data JPA 인터페이스 (Infrastructure Layer)
 */
public interface UserJpaRepository extends JpaRepository<User, Long> {

  Optional<User> findByEmail(String email);

  Optional<User> findByUuid(CustomUuid uuid);

  Optional<User> findByProviderAndProviderId(String provider, String providerId);

  boolean existsByProviderAndProviderId(String provider, String providerId);

  /**
   * 활성 상태의 사용자만 조회 (status = ACTIVE)
   */
  @Query("SELECT u FROM User u WHERE u.uuid = :uuid AND u.status = 'ACTIVE'")
  Optional<User> findActiveByUuid(@Param("uuid") CustomUuid uuid);

  /**
   * 활성 상태의 사용자만 이메일로 조회
   */
  @Query("SELECT u FROM User u WHERE u.email = :email AND u.status = 'ACTIVE'")
  Optional<User> findActiveByEmail(@Param("email") String email);
}

