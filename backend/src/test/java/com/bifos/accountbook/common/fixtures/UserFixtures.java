package com.bifos.accountbook.common.fixtures;

import com.bifos.accountbook.domain.entity.User;
import com.bifos.accountbook.domain.repository.UserRepository;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;

/**
 * User 도메인 테스트 Fixture
 *
 * 사용자 생성 및 SecurityContext 설정을 담당
 */
public class UserFixtures {

  private final UserRepository userRepository;

  // 기본 user (lazy initialization)
  private User defaultUser;

  public UserFixtures(UserRepository userRepository) {
    this.userRepository = userRepository;
  }

  /**
   * 기본 유저 반환 (lazy initialization)
   * SecurityContext에 자동으로 설정됨
   */
  public User getDefaultUser() {
    if (defaultUser == null) {
      defaultUser = user().build();
    }
    return defaultUser;
  }

  /**
   * User Builder 시작점
   */
  public UserBuilder user() {
    return new UserBuilder(userRepository);
  }

  /**
   * 캐시 초기화
   */
  public void clear() {
    this.defaultUser = null;
  }

  /**
   * User Builder - 사용자 생성
   */
  public static class UserBuilder {
    private String email = "test@example.com";
    private String name = "Test User";
    private String provider = "google";
    private String providerId;

    private final UserRepository userRepository;

    UserBuilder(UserRepository userRepository) {
      this.userRepository = userRepository;
    }

    public UserBuilder email(String email) {
      this.email = email;
      return this;
    }

    public UserBuilder name(String name) {
      this.name = name;
      return this;
    }

    public UserBuilder provider(String provider) {
      this.provider = provider;
      return this;
    }

    public UserBuilder providerId(String providerId) {
      this.providerId = providerId;
      return this;
    }

    public User build() {
      // providerId가 설정되지 않았다면 build() 시점에 생성 (재사용 시 중복 방지)
      String finalProviderId = providerId != null
          ? providerId
          : "test-provider-" + System.currentTimeMillis() + "-" + System.nanoTime();

      User user = User.builder()
                      .email(email)
                      .name(name)
                      .provider(provider)
                      .providerId(finalProviderId)
                      .build();
      user = userRepository.save(user);

      // SecurityContext에 인증 정보 자동 설정
      UsernamePasswordAuthenticationToken authentication =
          new UsernamePasswordAuthenticationToken(user.getUuid().getValue(), null, null);
      SecurityContextHolder.getContext()
                           .setAuthentication(authentication);

      return user;
    }
  }
}

