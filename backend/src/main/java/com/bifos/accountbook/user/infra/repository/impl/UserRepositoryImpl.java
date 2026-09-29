package com.bifos.accountbook.user.infra.repository.impl;

import com.bifos.accountbook.user.domain.entity.User;
import com.bifos.accountbook.user.domain.repository.UserRepository;
import com.bifos.accountbook.shared.value.CustomUuid;
import com.bifos.accountbook.user.infra.repository.jpa.UserJpaRepository;
import java.util.Optional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Repository;

/**
 * UserRepository 구현체
 * JpaRepository를 내부적으로 사용하여 도메인 인터페이스 구현
 */
@Repository
@RequiredArgsConstructor
public class UserRepositoryImpl implements UserRepository {

  private final UserJpaRepository jpaRepository;

  @Override
  public User save(User user) {
    return jpaRepository.save(user);
  }

  @Override
  public Optional<User> findByEmail(String email) {
    return jpaRepository.findByEmail(email);
  }

  @Override
  public Optional<User> findByUuid(CustomUuid uuid) {
    return jpaRepository.findByUuid(uuid);
  }

  @Override
  public Optional<User> findByProviderAndProviderId(String provider, String providerId) {
    return jpaRepository.findByProviderAndProviderId(provider, providerId);
  }

  @Override
  public boolean existsByProviderAndProviderId(String provider, String providerId) {
    return jpaRepository.existsByProviderAndProviderId(provider, providerId);
  }
}

