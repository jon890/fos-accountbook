package com.bifos.accountbook.config.security;

import com.bifos.accountbook.domain.entity.User;
import com.bifos.accountbook.domain.value.CustomUuid;
import com.bifos.accountbook.utils.TimeUtils;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jws;
import java.time.LocalDateTime;
import java.util.Date;
import lombok.extern.slf4j.Slf4j;
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
}
