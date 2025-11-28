package com.bifos.accountbook.infra.persistence.repository.jpa;

import com.bifos.accountbook.domain.entity.User;
import com.bifos.accountbook.domain.value.CustomUuid;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

/**
 * User JPA Repository
 * Spring Data JPA 인터페이스 (Infrastructure Layer)
 */
public interface UserJpaRepository extends JpaRepository<User, Long> {

  Optional<User> findByEmail(String email);

  Optional<User> findByUuid(CustomUuid uuid);

  Optional<User> findByProviderAndProviderId(String provider, String providerId);

  boolean existsByProviderAndProviderId(String provider, String providerId);
}

