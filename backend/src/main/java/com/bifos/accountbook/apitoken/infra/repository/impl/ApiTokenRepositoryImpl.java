package com.bifos.accountbook.apitoken.infra.repository.impl;

import com.bifos.accountbook.apitoken.domain.entity.ApiToken;
import com.bifos.accountbook.apitoken.domain.repository.ApiTokenRepository;
import com.bifos.accountbook.apitoken.infra.repository.jpa.ApiTokenJpaRepository;
import com.bifos.accountbook.shared.value.CustomUuid;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Repository;

@Repository
@RequiredArgsConstructor
public class ApiTokenRepositoryImpl implements ApiTokenRepository {

  private final ApiTokenJpaRepository jpaRepository;

  @Override
  public ApiToken save(ApiToken apiToken) {
    return jpaRepository.save(apiToken);
  }

  @Override
  public Optional<ApiToken> findActiveByTokenHash(String tokenHash) {
    return jpaRepository.findActiveByTokenHash(tokenHash);
  }

  @Override
  public Optional<ApiToken> findActiveByUuidAndUserUuid(CustomUuid uuid, CustomUuid userUuid) {
    return jpaRepository.findActiveByUuidAndUserUuid(uuid, userUuid);
  }

  @Override
  public List<ApiToken> findAllActiveByUserUuid(CustomUuid userUuid) {
    return jpaRepository.findAllActiveByUserUuid(userUuid);
  }

  @Override
  public long countActiveByUserUuid(CustomUuid userUuid) {
    return jpaRepository.countActiveByUserUuid(userUuid);
  }

  @Override
  public int updateLastUsedAt(Long id, LocalDateTime now) {
    return jpaRepository.updateLastUsedAt(id, now);
  }
}
