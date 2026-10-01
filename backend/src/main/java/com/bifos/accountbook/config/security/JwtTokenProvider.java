package com.bifos.accountbook.config.security;

import com.bifos.accountbook.shared.utils.TimeUtils;
import com.bifos.accountbook.user.domain.entity.User;
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
                             .claim(TOKEN_TYPE_CLAIM, ACCESS_TOKEN_TYPE)
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
               .claim(TOKEN_TYPE_CLAIM, REFRESH_TOKEN_TYPE)
               .issuedAt(now)
               .expiration(expiryDate)
               .signWith(getSigningKey(), getAlgorithm())
               .compact();
  }

  public boolean validateAccessToken(String token) {
    return validateToken(token, ACCESS_TOKEN_TYPE);
  }

  public boolean validateRefreshToken(String token) {
    return validateToken(token, REFRESH_TOKEN_TYPE);
  }

  /**
   * Authentication 객체 생성
   */
  public Authentication createAuthentication(String token) {
    String userId = getUserIdFromToken(token);
    return new UsernamePasswordAuthenticationToken(userId, null, List.of());
  }
}
