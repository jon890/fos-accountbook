package com.bifos.accountbook.config.security;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.Date;
import java.util.Objects;
import javax.crypto.SecretKey;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

/**
 * 소셜 로그인 요청이 프론트엔드 서버에서 왔는지 검증한다.
 *
 * <p>프론트엔드 서버는 OAuth 로그인을 마친 뒤 같은 AUTH_SECRET 으로 짧은 수명의 HS256 JWT 를 서명해
 * {@value #HEADER} 헤더에 싣는다. 서명이 없으면 누구든 providerId 만 알면 다른 사용자의 토큰을 받는다.</p>
 *
 * <p>access token(HS512, 64바이트로 채운 키)과 달리 AUTH_SECRET 원문 바이트를 키로 쓴다.
 * 프론트엔드가 채우기 규칙을 따라 할 필요가 없고, 키가 달라 두 토큰이 서로를 대신하지 못한다.</p>
 */
@Slf4j
@Component
public class SocialLoginAssertionVerifier {

  public static final String HEADER = "X-Social-Login-Assertion";
  public static final String AUDIENCE = "accountbook-social-login";
  static final Duration MAX_LIFETIME = Duration.ofMinutes(5);

  private final SecretKey key;

  public SocialLoginAssertionVerifier(JwtProperties jwtProperties) {
    this.key = Keys.hmacShaKeyFor(jwtProperties.getSecret().getBytes(StandardCharsets.UTF_8));
  }

  /**
   * 서명과 수신자, 만료를 검사하고 서명된 신원이 요청 본문과 같은지 확인한다.
   *
   * @return 모두 맞으면 true
   */
  public boolean verify(String assertion, String provider, String providerId, String email) {
    if (assertion == null || assertion.isBlank()) {
      return false;
    }

    Claims claims;
    try {
      claims = Jwts.parser()
                   .verifyWith(key)
                   .requireAudience(AUDIENCE)
                   .build()
                   .parseSignedClaims(assertion)
                   .getPayload();
    } catch (JwtException | IllegalArgumentException e) {
      log.debug("Invalid social login assertion: {}", e.getMessage());
      return false;
    }

    Date issuedAt = claims.getIssuedAt();
    Date expiration = claims.getExpiration();
    if (issuedAt == null || expiration == null
        || expiration.getTime() - issuedAt.getTime() > MAX_LIFETIME.toMillis()) {
      log.debug("Social login assertion lifetime is missing or too long");
      return false;
    }

    return Objects.equals(claims.getSubject(), provider + ":" + providerId)
        && Objects.equals(claims.get("email", String.class), email);
  }
}
