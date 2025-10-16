package com.bifos.accountbook.infra.security;

import io.jsonwebtoken.*;
import io.jsonwebtoken.security.Keys;
import lombok.extern.slf4j.Slf4j;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;

/**
 * JWT 토큰 검증/추출을 위한 추상 클래스
 * 
 * JwtTokenProvider와 NextAuthTokenProvider의 공통 로직을 제공합니다.
 * 하위 클래스는 getSecretKey()를 구현하여 각자의 비밀키를 제공합니다.
 */
@Slf4j
public abstract class AbstractJwtTokenProvider {

    /**
     * JWT 서명에 사용할 비밀키를 반환합니다.
     * 
     * @return SecretKey
     */
    protected abstract SecretKey getSigningKey();

    /**
     * 문자열 비밀키를 SecretKey 객체로 변환합니다.
     * 
     * @param secret 비밀키 문자열
     * @return SecretKey
     */
    protected SecretKey createSigningKey(String secret) {
        byte[] keyBytes = secret.getBytes(StandardCharsets.UTF_8);
        return Keys.hmacShaKeyFor(keyBytes);
    }

    /**
     * 토큰 검증
     * 
     * @param token JWT 토큰
     * @return 토큰이 유효하면 true, 그렇지 않으면 false
     */
    public boolean validateToken(String token) {
        try {
            Jwts.parser()
                    .verifyWith(getSigningKey())
                    .build()
                    .parseSignedClaims(token);
            return true;
        } catch (SecurityException e) {
            log.debug("Invalid JWT signature: {}", e.getMessage());
        } catch (MalformedJwtException e) {
            log.debug("Invalid JWT token: {}", e.getMessage());
        } catch (ExpiredJwtException e) {
            log.debug("Expired JWT token: {}", e.getMessage());
        } catch (UnsupportedJwtException e) {
            log.debug("Unsupported JWT token: {}", e.getMessage());
        } catch (IllegalArgumentException e) {
            log.debug("JWT claims string is empty: {}", e.getMessage());
        }
        return false;
    }

    /**
     * 토큰에서 Claims 추출
     * 
     * @param token JWT 토큰
     * @return Claims 객체, 추출 실패 시 null
     */
    protected Claims getClaimsFromToken(String token) {
        try {
            return Jwts.parser()
                    .verifyWith(getSigningKey())
                    .build()
                    .parseSignedClaims(token)
                    .getPayload();
        } catch (Exception e) {
            log.debug("Failed to extract claims from token: {}", e.getMessage());
            return null;
        }
    }

    /**
     * 토큰에서 사용자 ID (subject) 추출
     * 
     * @param token JWT 토큰
     * @return 사용자 ID, 추출 실패 시 null
     */
    public String getUserIdFromToken(String token) {
        Claims claims = getClaimsFromToken(token);
        return claims != null ? claims.getSubject() : null;
    }

    /**
     * 토큰에서 이메일 추출
     * 
     * @param token JWT 토큰
     * @return 이메일 주소, 추출 실패 시 null
     */
    public String getEmailFromToken(String token) {
        Claims claims = getClaimsFromToken(token);
        return claims != null ? claims.get("email", String.class) : null;
    }

    /**
     * 토큰에서 사용자 이름 추출
     * 
     * @param token JWT 토큰
     * @return 사용자 이름, 추출 실패 시 null
     */
    public String getNameFromToken(String token) {
        Claims claims = getClaimsFromToken(token);
        return claims != null ? claims.get("name", String.class) : null;
    }


}

