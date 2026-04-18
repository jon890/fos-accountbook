package com.bifos.accountbook.shared.fixtures;

import com.bifos.accountbook.user.domain.entity.User;
import com.bifos.accountbook.user.domain.repository.UserRepository;
import java.util.ArrayList;
import java.util.List;
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

  // 다른 유저들 (테스트에서 여러 유저가 필요한 경우)
  private final List<User> otherUsers = new ArrayList<>();

  public UserFixtures(UserRepository userRepository) {
    this.userRepository = userRepository;
  }

  /**
   * 기본 유저 반환 (lazy initialization)
   * SecurityContext에 자동으로 설정됨
   */
  public User getDefaultUser() {
    if (defaultUser == null) {
      defaultUser = user().buildAndSetSecurityContext();
    }
    return defaultUser;
  }

  /**
   * 다른 유저 생성 및 반환
   * 여러 유저가 필요한 테스트에서 사용
   * 매번 고유한 이메일로 유저를 생성합니다.
   * SecurityContext에는 설정하지 않습니다.
   *
   * @return 생성된 다른 유저
   */
  public User getOtherUser() {
    String uniqueEmail = "other-" + System.currentTimeMillis() + "-" + System.nanoTime() + "@test.com";
    User otherUser = user()
        .email(uniqueEmail)
        .name("다른 사용자")
        .build();
    otherUsers.add(otherUser);
    return otherUser;
  }

  /**
   * SecurityContext에 유저 인증 정보 설정
   *
   * @param user SecurityContext에 설정할 유저
   */
  public void setSecurityContext(User user) {
    UsernamePasswordAuthenticationToken authentication =
        new UsernamePasswordAuthenticationToken(user.getUuid().getValue(), null, null);
    SecurityContextHolder.getContext()
                         .setAuthentication(authentication);
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
    this.otherUsers.clear();
  }

  /**
   * User Builder - 사용자 생성
   */
  public static class UserBuilder {
    private final UserRepository userRepository;
    private String email = "test@example.com";
    private String name = "Test User";
    private String provider = "google";
    private String providerId;

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

    /**
     * 유저 생성 (SecurityContext 설정 없음)
     *
     * @return 생성된 유저
     */
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
      return userRepository.save(user);
    }

    /**
     * 유저 생성 및 SecurityContext에 인증 정보 설정
     *
     * @return 생성된 유저
     */
    public User buildAndSetSecurityContext() {
      User user = build();
      UsernamePasswordAuthenticationToken authentication =
          new UsernamePasswordAuthenticationToken(user.getUuid().getValue(), null, null);
      SecurityContextHolder.getContext()
                           .setAuthentication(authentication);
      return user;
    }
  }
}

