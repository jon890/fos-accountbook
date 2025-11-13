package com.bifos.accountbook.infra.security;

import lombok.Getter;
import org.springframework.boot.context.properties.ConfigurationProperties;

/**
 * JWT 설정을 application.yml에서 관리하기 위한 Properties 클래스
 * Immutable하게 관리되며, 애플리케이션 시작 시 한 번만 바인딩됩니다.
 */
@Getter
@ConfigurationProperties(prefix = "jwt")
public class JwtProperties {

  private final String secret;
  private final Long expiration;
  private final Long refreshExpiration;

  /**
   * Constructor Binding을 통한 Immutable 객체 생성
   * Spring Boot 3.x에서는 생성자가 하나만 있으면 자동으로 Constructor Binding이 적용됩니다.
   */
  public JwtProperties(String secret, Long expiration, Long refreshExpiration) {
    this.secret = secret;
    this.expiration = expiration;
    this.refreshExpiration = refreshExpiration;
  }
}
