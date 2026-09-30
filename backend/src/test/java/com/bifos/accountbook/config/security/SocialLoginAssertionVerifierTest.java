package com.bifos.accountbook.config.security;

import static org.assertj.core.api.Assertions.assertThat;

import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import java.nio.charset.StandardCharsets;
import java.util.Date;
import javax.crypto.SecretKey;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

@DisplayName("소셜 로그인 서명 검증")
class SocialLoginAssertionVerifierTest {

  private static final String SECRET = "shared-auth-secret-between-frontend-and-backend";

  private final SecretKey key = Keys.hmacShaKeyFor(SECRET.getBytes(StandardCharsets.UTF_8));
  private SocialLoginAssertionVerifier sut;

  @BeforeEach
  void setUp() {
    sut = new SocialLoginAssertionVerifier(new JwtProperties(SECRET, 60_000L, 60_000L));
  }

  private String sign(SecretKey signingKey, String audience, String subject, String email, long lifetimeMillis) {
    long now = System.currentTimeMillis();
    return Jwts.builder()
               .audience().add(audience).and()
               .subject(subject)
               .claim("email", email)
               .issuedAt(new Date(now))
               .expiration(new Date(now + lifetimeMillis))
               .signWith(signingKey, Jwts.SIG.HS256)
               .compact();
  }

  @Test
  @DisplayName("같은 키로 서명하고 신원이 본문과 같으면 통과한다")
  void verify_Succeeds() {
    String assertion = sign(key, SocialLoginAssertionVerifier.AUDIENCE, "google:123", "a@b.com", 60_000);

    assertThat(sut.verify(assertion, "google", "123", "a@b.com")).isTrue();
  }

  @Test
  @DisplayName("서명이 없으면 거절한다")
  void verify_Fails_WhenMissing() {
    assertThat(sut.verify(null, "google", "123", "a@b.com")).isFalse();
    assertThat(sut.verify(" ", "google", "123", "a@b.com")).isFalse();
  }

  @Test
  @DisplayName("다른 키로 서명하면 거절한다")
  void verify_Fails_WhenSignedWithOtherKey() {
    SecretKey other = Keys.hmacShaKeyFor("another-secret-that-is-at-least-32-bytes!!".getBytes(StandardCharsets.UTF_8));
    String assertion = sign(other, SocialLoginAssertionVerifier.AUDIENCE, "google:123", "a@b.com", 60_000);

    assertThat(sut.verify(assertion, "google", "123", "a@b.com")).isFalse();
  }

  @Test
  @DisplayName("수신자가 다르면 거절한다")
  void verify_Fails_WhenAudienceDiffers() {
    String assertion = sign(key, "something-else", "google:123", "a@b.com", 60_000);

    assertThat(sut.verify(assertion, "google", "123", "a@b.com")).isFalse();
  }

  @Test
  @DisplayName("서명된 provider 와 providerId 가 본문과 다르면 거절한다")
  void verify_Fails_WhenSubjectDiffers() {
    String assertion = sign(key, SocialLoginAssertionVerifier.AUDIENCE, "google:123", "a@b.com", 60_000);

    assertThat(sut.verify(assertion, "google", "999", "a@b.com")).isFalse();
    assertThat(sut.verify(assertion, "naver", "123", "a@b.com")).isFalse();
  }

  @Test
  @DisplayName("서명된 이메일이 본문과 다르면 거절한다")
  void verify_Fails_WhenEmailDiffers() {
    String assertion = sign(key, SocialLoginAssertionVerifier.AUDIENCE, "google:123", "a@b.com", 60_000);

    assertThat(sut.verify(assertion, "google", "123", "other@b.com")).isFalse();
  }

  @Test
  @DisplayName("만료됐거나 수명이 5분을 넘으면 거절한다")
  void verify_Fails_WhenExpiredOrTooLong() {
    String expired = sign(key, SocialLoginAssertionVerifier.AUDIENCE, "google:123", "a@b.com", -1_000);
    String tooLong = sign(key, SocialLoginAssertionVerifier.AUDIENCE, "google:123", "a@b.com", 10 * 60_000);

    assertThat(sut.verify(expired, "google", "123", "a@b.com")).isFalse();
    assertThat(sut.verify(tooLong, "google", "123", "a@b.com")).isFalse();
  }
}
