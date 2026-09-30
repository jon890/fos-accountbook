package com.bifos.accountbook.config.security;

import com.bifos.accountbook.user.domain.entity.User;
import com.bifos.accountbook.shared.value.CustomUuid;
import com.bifos.accountbook.shared.utils.TimeUtils;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jws;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;
import java.util.Date;
import lombok.extern.slf4j.Slf4j;
import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assertions.assertEquals;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

@Slf4j
class JwtTokenProviderTest {

  JwtTokenProvider sut;

  @BeforeEach
  void setUp() {
    JwtProperties jwtProperties = new JwtProperties("test-secret",
                                                    24 * 60 * 60 * 1000L,
                                                    24 * 60 * 60 * 1000L);
    sut = new JwtTokenProvider(jwtProperties);
  }

  @Test
  @DisplayName("생성된 토큰 정보의 발급일자와 응답의 발급일자 속성값이 일치해야한다")
  void test() {
    // given
    User user = User.builder()
                    .uuid(CustomUuid.generate())
                    .build();
    // when
    AccessToken accessToken = sut.generateToken(user);

    Jws<Claims> claimsJws = sut.getJwtParser()
                               .parseSignedClaims(accessToken.getToken());

    Date issuedAtDate = claimsJws.getPayload().getIssuedAt();
    LocalDateTime issuedAtLocalDateTime = accessToken.getIssuedAt()
                                                     // jwt에 저장된 시간은 nano 초 까지 정밀도가 저장되지 않음므로 제거 후 비교
                                                     .withNano(0);

    log.debug("issuedAt from token : {}", issuedAtDate);
    log.debug("issuedAt from return : {}", issuedAtLocalDateTime);

    assertEquals(issuedAtLocalDateTime, TimeUtils.toLocalDateTime(issuedAtDate));
  }

  @Test
  @DisplayName("다른 키로 서명한 토큰은 예외 없이 false 를 돌려준다")
  void validateToken_ReturnsFalse_WhenSignedWithOtherKey() {
    String token = Jwts.builder()
                       .subject("someone")
                       .expiration(new Date(System.currentTimeMillis() + 60_000))
                       .signWith(Keys.hmacShaKeyFor("other-secret-key-that-is-long-enough-for-hs512-signing-0123456789".getBytes(StandardCharsets.UTF_8)))
                       .compact();

    assertThat(sut.validateToken(token)).isFalse();
  }
}
