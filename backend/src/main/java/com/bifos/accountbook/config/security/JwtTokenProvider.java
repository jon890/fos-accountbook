package com.bifos.accountbook.config.security;

import com.bifos.accountbook.domain.entity.User;
import com.bifos.accountbook.utils.TimeUtils;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.SecureDigestAlgorithm;
import java.util.Date;
import java.util.List;
import java.util.function.Function;
import javax.crypto.SecretKey;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Component;

@Slf4j
@Component
@RequiredArgsConstructor
public class JwtTokenProvider extends AbstractJwtTokenProvider {

  private final JwtProperties jwtProperties;

  @Override
  protected SecretKey getSigningKey() {
    return createSigningKey(jwtProperties.getSecret());
  }

  @Override
  protected SecureDigestAlgorithm<SecretKey, SecretKey> getAlgorithm() {
    return Jwts.SIG.HS512;
  }

  @Override
  protected Function<User, String> toSubjectConverter() {
    return user -> user.getUuid().getValue();
  }

  public AccessToken generateToken(User user) {
    Date now = new Date();
    Date expiryDate = new Date(now.getTime() + jwtProperties.getExpiration());

    final String token = Jwts.builder()
                             .subject(toSubjectConverter().apply(user))
                             .issuedAt(now)
                             .expiration(expiryDate)
                             .signWith(getSigningKey(), getAlgorithm())
                             .compact();

    return AccessToken.builder()
                      .token(token)
                      .issuedAt(TimeUtils.toLocalDateTime(now))
                      .expiresAt(TimeUtils.toLocalDateTime(expiryDate))
                      .build();
  }

  /**
   * Refresh 토큰 생성
   */
  public String generateRefreshToken(User user) {
    Date now = new Date();
    Date expiryDate = new Date(now.getTime() + jwtProperties.getRefreshExpiration());

    return Jwts.builder()
               .subject(toSubjectConverter().apply(user))
               .issuedAt(now)
               .expiration(expiryDate)
               .signWith(getSigningKey(), getAlgorithm())
               .compact();
  }

  /**
   * Authentication 객체 생성
   */
  public Authentication createAuthentication(String token) {
    String userId = getUserIdFromToken(token);
    return new UsernamePasswordAuthenticationToken(userId, null, List.of());
  }
}
