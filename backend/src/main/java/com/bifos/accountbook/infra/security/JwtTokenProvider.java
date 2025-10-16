package com.bifos.accountbook.infra.security;

import io.jsonwebtoken.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.util.Collection;
import java.util.Collections;
import java.util.Date;
import java.util.List;
import java.util.stream.Collectors;

/**
 * 백엔드 자체 JWT 토큰 생성 및 검증 프로바이더
 * 
 * AbstractJwtTokenProvider를 상속하여 공통 로직을 재사용하고,
 * 백엔드 전용 기능(토큰 생성, roles 추출)을 추가로 제공합니다.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class JwtTokenProvider extends AbstractJwtTokenProvider {

    private final JwtProperties jwtProperties;

    @Override
    protected SecretKey getSigningKey() {
        return createSigningKey(jwtProperties.getSecret());
    }

    /**
     * JWT 토큰 생성 (HS512 알고리즘 사용)
     */
    public String generateToken(String userId, String email, Collection<? extends GrantedAuthority> authorities) {
        Date now = new Date();
        Date expiryDate = new Date(now.getTime() + jwtProperties.getExpiration());

        List<String> roles = authorities.stream()
                .map(GrantedAuthority::getAuthority)
                .collect(Collectors.toList());

        return Jwts.builder()
                .subject(userId)
                .claim("email", email)
                .claim("roles", roles)
                .issuedAt(now)
                .expiration(expiryDate)
                .signWith(getSigningKey(), Jwts.SIG.HS512) // HS512 명시적 지정
                .compact();
    }

    /**
     * Refresh 토큰 생성 (HS512 알고리즘 사용)
     */
    public String generateRefreshToken(String userId) {
        Date now = new Date();
        Date expiryDate = new Date(now.getTime() + jwtProperties.getRefreshExpiration());

        return Jwts.builder()
                .subject(userId)
                .issuedAt(now)
                .expiration(expiryDate)
                .signWith(getSigningKey(), Jwts.SIG.HS512) // HS512 명시적 지정
                .compact();
    }

    /**
     * 토큰에서 권한 정보 추출 (백엔드 JWT 전용)
     * 
     * @param token JWT 토큰
     * @return 권한 목록
     */
    @SuppressWarnings("unchecked")
    public Collection<? extends GrantedAuthority> getAuthoritiesFromToken(String token) {
        Claims claims = getClaimsFromToken(token);
        if (claims == null) {
            return Collections.singletonList(new SimpleGrantedAuthority("ROLE_USER"));
        }

        List<String> roles = claims.get("roles", List.class);
        if (roles == null || roles.isEmpty()) {
            return Collections.singletonList(new SimpleGrantedAuthority("ROLE_USER"));
        }

        return roles.stream()
                .map(SimpleGrantedAuthority::new)
                .collect(Collectors.toList());
    }

    /**
     * Authentication 객체 생성
     */
    public Authentication getAuthentication(String token) {
        String userId = getUserIdFromToken(token);
        Collection<? extends GrantedAuthority> authorities = getAuthoritiesFromToken(token);

        return new UsernamePasswordAuthenticationToken(userId, null, authorities);
    }
}
