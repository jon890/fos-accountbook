package com.bifos.accountbook.domain.repository;

import com.bifos.accountbook.domain.entity.User;
import com.bifos.accountbook.domain.value.CustomUuid;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {

    Optional<User> findByEmail(String email);

    Optional<User> findByUuid(CustomUuid uuid);

    Optional<User> findByProviderAndProviderId(String provider, String providerId);

    boolean existsByProviderAndProviderId(String provider, String providerId);
}
