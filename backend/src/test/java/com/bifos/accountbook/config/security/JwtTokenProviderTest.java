package com.bifos.accountbook.config.security;

import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assertions.assertEquals;

import com.bifos.accountbook.shared.utils.TimeUtils;
import com.bifos.accountbook.shared.value.CustomUuid;
import com.bifos.accountbook.user.domain.entity.User;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jws;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;
import java.util.Date;
import lombok.extern.slf4j.Slf4j;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

@Slf4j
class JwtTokenProviderTest {

  JwtTokenProvider sut;

  @BeforeEach
  void setUp() {
    JwtProperties jwtProperties =
        new JwtProperties("test-secret", 24 * 60 * 60 * 1000L, 24 * 60 * 60 * 1000L);
    sut = new JwtTokenProvider(jwtProperties);
  }

  @Test
  @DisplayName("생성된 토큰 정보의 발급일자와 응답의 발급일자 속성값이 일치해야한다")
  void test() {
    // given
    User user = User.builder().uuid(CustomUuid.generate()).build();
    // when
    AccessToken accessToken = sut.generateToken(user);

    Jws<Claims> claimsJws = sut.getJwtParser().parseSignedClaims(accessToken.getToken());

    Date issuedAtDate = claimsJws.getPayload().getIssuedAt();
    LocalDateTime issuedAtLocalDateTime =
        accessToken
            .getIssuedAt()
            // jwt에 저장된 시간은 nano 초 까지 정밀도가 저장되지 않음므로 제거 후 비교
            .withNano(0);

    log.debug("issuedAt from token : {}", issuedAtDate);
    log.debug("issuedAt from return : {}", issuedAtLocalDateTime);

    assertEquals(issuedAtLocalDateTime, TimeUtils.toLocalDateTime(issuedAtDate));
  }

  @Test
  @DisplayName("발급한 access token은 access 검증만 통과한다")
  void validateAccessToken_ReturnsTrue_OnlyForAccessToken() {
    User user = User.builder().uuid(CustomUuid.generate()).build();

    AccessToken accessToken = sut.generateToken(user);

    assertThat(sut.validateAccessToken(accessToken.getToken())).isTrue();
    assertThat(sut.validateRefreshToken(accessToken.getToken())).isFalse();
  }

  @Test
  @DisplayName("발급한 refresh token은 refresh 검증만 통과한다")
  void validateRefreshToken_ReturnsTrue_OnlyForRefreshToken() {
    User user = User.builder().uuid(CustomUuid.generate()).build();

    String refreshToken = sut.generateRefreshToken(user);

    assertThat(sut.validateAccessToken(refreshToken)).isFalse();
    assertThat(sut.validateRefreshToken(refreshToken)).isTrue();
  }

  @Test
  @DisplayName("다른 키로 서명한 토큰은 두 종류 검증 모두 통과하지 않는다")
  void validateToken_ReturnsFalse_WhenSignedWithOtherKey() {
    String token =
        Jwts.builder()
            .subject("someone")
            .claim(
                AbstractJwtTokenProvider.TOKEN_TYPE_CLAIM,
                AbstractJwtTokenProvider.ACCESS_TOKEN_TYPE)
            .expiration(new Date(System.currentTimeMillis() + 60_000))
            .signWith(
                Keys.hmacShaKeyFor(
                    "other-secret-key-that-is-long-enough-for-hs512-signing-0123456789"
                        .getBytes(StandardCharsets.UTF_8)))
            .compact();

    assertThat(sut.validateAccessToken(token)).isFalse();
    assertThat(sut.validateRefreshToken(token)).isFalse();
  }

  @Test
  @DisplayName("수신자가 지정된 토큰은 두 종류 검증 모두 통과하지 않는다")
  void validateToken_ReturnsFalse_WhenAudiencePresent() {
    String token =
        Jwts.builder()
            .subject("google:123")
            .audience()
            .add(SocialLoginAssertionVerifier.AUDIENCE)
            .and()
            .claim(
                AbstractJwtTokenProvider.TOKEN_TYPE_CLAIM,
                AbstractJwtTokenProvider.ACCESS_TOKEN_TYPE)
            .expiration(new Date(System.currentTimeMillis() + 60_000))
            .signWith(sut.getSigningKey(), sut.getAlgorithm())
            .compact();

    assertThat(sut.validateAccessToken(token)).isFalse();
    assertThat(sut.validateRefreshToken(token)).isFalse();
  }

  @Test
  @DisplayName("typ 클레임이 없는 옛 토큰은 두 종류 검증 모두 통과하지 않는다")
  void validateToken_ReturnsFalse_WhenTokenTypeIsMissing() {
    String token =
        Jwts.builder()
            .subject("someone")
            .expiration(new Date(System.currentTimeMillis() + 60_000))
            .signWith(sut.getSigningKey(), sut.getAlgorithm())
            .compact();

    assertThat(sut.validateAccessToken(token)).isFalse();
    assertThat(sut.validateRefreshToken(token)).isFalse();
  }

  @Test
  @DisplayName("문자열이 아닌 typ 클레임 토큰은 두 종류 검증 모두 통과하지 않는다")
  void validateToken_ReturnsFalse_WhenTokenTypeIsNotString() {
    String token =
        Jwts.builder()
            .subject("someone")
            .claim(AbstractJwtTokenProvider.TOKEN_TYPE_CLAIM, 1)
            .expiration(new Date(System.currentTimeMillis() + 60_000))
            .signWith(sut.getSigningKey(), sut.getAlgorithm())
            .compact();

    assertThat(sut.validateAccessToken(token)).isFalse();
    assertThat(sut.validateRefreshToken(token)).isFalse();
  }
}
