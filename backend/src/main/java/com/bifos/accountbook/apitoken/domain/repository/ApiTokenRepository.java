package com.bifos.accountbook.apitoken.domain.repository;

import com.bifos.accountbook.apitoken.domain.entity.ApiToken;
import com.bifos.accountbook.shared.value.CustomUuid;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface ApiTokenRepository {

  ApiToken save(ApiToken apiToken);

  Optional<ApiToken> findActiveByTokenHash(String tokenHash);

  Optional<ApiToken> findActiveByUuidAndUserUuid(CustomUuid uuid, CustomUuid userUuid);

  /** 최근 발급 순으로 돌려준다. */
  List<ApiToken> findAllActiveByUserUuid(CustomUuid userUuid);

  long countActiveByUserUuid(CustomUuid userUuid);

  /** ACTIVE 인 토큰만 사용 시각을 갱신한다. 갱신한 행 수를 돌려준다. */
  int updateLastUsedAt(Long id, LocalDateTime now);
}
