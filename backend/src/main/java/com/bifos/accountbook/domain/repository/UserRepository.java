package com.bifos.accountbook.domain.repository;

import com.bifos.accountbook.domain.entity.User;
import com.bifos.accountbook.domain.value.CustomUuid;
import java.util.Optional;

/**
 * 사용자 Repository 인터페이스
 * JPA에 의존하지 않는 순수 도메인 레이어 인터페이스
 */
public interface UserRepository {

  /**
   * 사용자 저장
   */
  User save(User user);

  /**
   * 이메일로 사용자 조회
   */
  Optional<User> findByEmail(String email);

  /**
   * UUID로 사용자 조회
   */
  Optional<User> findByUuid(CustomUuid uuid);

  /**
   * Provider와 ProviderId로 사용자 조회
   */
  Optional<User> findByProviderAndProviderId(String provider, String providerId);

  /**
   * Provider와 ProviderId 존재 여부 확인
   */
  boolean existsByProviderAndProviderId(String provider, String providerId);
}
