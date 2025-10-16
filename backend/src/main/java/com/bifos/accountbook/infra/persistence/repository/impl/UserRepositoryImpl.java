package com.bifos.accountbook.infra.persistence.repository.impl;

import com.bifos.accountbook.domain.entity.User;
import com.bifos.accountbook.domain.repository.UserRepository;
import com.bifos.accountbook.domain.value.CustomUuid;
import com.bifos.accountbook.infra.persistence.repository.jpa.UserJpaRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Repository;

import java.util.Optional;

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
    public Optional<User> findById(Long id) {
        return jpaRepository.findById(id);
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

