package com.bifos.accountbook.config.security;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import java.nio.charset.StandardCharsets;
import java.security.GeneralSecurityException;
import java.time.Duration;
import java.util.Date;
import java.util.Objects;
import javax.crypto.Mac;
import javax.crypto.SecretKey;
import javax.crypto.spec.SecretKeySpec;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

/**
 * 소셜 로그인 요청이 프론트엔드 서버에서 왔는지 검증한다.
 *
 * <p>프론트엔드 서버는 OAuth 로그인을 마친 뒤 같은 AUTH_SECRET 으로 짧은 수명의 HS256 JWT 를 서명해 {@value #HEADER} 헤더에 싣는다.
 * 서명이 없으면 누구든 providerId 만 알면 다른 사용자의 토큰을 받는다.
 *
 * <p>키는 AUTH_SECRET 으로 {@value #AUDIENCE} 를 HMAC-SHA256 한 파생 키다. access token 키와 비밀값 길이에 상관없이 달라, 두
 * 토큰이 서로의 서명 검증을 통과하지 못한다. 수신자(aud)가 있는 토큰을 access token 으로 받지 않는 검사는 그 위에 한 겹 더 둔 방어다.
 */
@Slf4j
@Component
public class SocialLoginAssertionVerifier {

  public static final String HEADER = "X-Social-Login-Assertion";
  public static final String AUDIENCE = "accountbook-social-login";
  static final Duration MAX_LIFETIME = Duration.ofMinutes(5);

  private final SecretKey key;

  public SocialLoginAssertionVerifier(JwtProperties jwtProperties) {
    this.key = deriveKey(jwtProperties.getSecret());
  }

  /** 프론트엔드 signSocialLoginAssertion 과 같은 방식으로 서명 키를 만든다. */
  public static SecretKey deriveKey(String secret) {
    try {
      Mac mac = Mac.getInstance("HmacSHA256");
      mac.init(new SecretKeySpec(secret.getBytes(StandardCharsets.UTF_8), "HmacSHA256"));
      return Keys.hmacShaKeyFor(mac.doFinal(AUDIENCE.getBytes(StandardCharsets.UTF_8)));
    } catch (GeneralSecurityException e) {
      throw new IllegalStateException("소셜 로그인 서명 키를 만들지 못했습니다", e);
    }
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
      claims =
          Jwts.parser()
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
    if (issuedAt == null
        || expiration == null
        || expiration.getTime() - issuedAt.getTime() > MAX_LIFETIME.toMillis()) {
      log.debug("Social login assertion lifetime is missing or too long");
      return false;
    }

    return Objects.equals(claims.getSubject(), provider + ":" + providerId)
        && Objects.equals(claims.get("email", String.class), email);
  }
}
