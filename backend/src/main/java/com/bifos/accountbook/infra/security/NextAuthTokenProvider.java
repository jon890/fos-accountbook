package com.bifos.accountbook.infra.security;

import io.jsonwebtoken.Claims;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;

/**
 * NextAuth (Auth.js) JWT 토큰 검증 프로바이더
 * 
 * AbstractJwtTokenProvider를 상속하여 NextAuth 세션 토큰 검증을 제공합니다.
 * NextAuth SECRET KEY만 주입받아 공통 로직을 재사용합니다.
 * 
 * NextAuth JWT 구조 (최소 정보만 포함):
 * {
 * "userUuid": "사용자 UUID (백엔드 DB의 사용자 ID)",
 * "accessTokenExpires": 백엔드 Access Token 만료 시간,
 * "iat": 발급 시간,
 * "exp": 만료 시간
 * }
 * 
 * ⚠️ accessToken과 refreshToken은 HTTP-only 쿠키로 별도 관리됨
 */
@Slf4j
@Component
public class NextAuthTokenProvider extends AbstractJwtTokenProvider {

    @Value("${nextauth.secret}")
    private String nextAuthSecret;

    @Override
    protected SecretKey getSigningKey() {
        return createSigningKey(nextAuthSecret);
    }

    /**
     * NextAuth JWT에서 사용자 UUID 추출
     * 
     * @param token NextAuth JWT 토큰
     * @return 사용자 UUID (백엔드 DB의 사용자 ID), 추출 실패 시 null
     */
    public String getUserUuidFromToken(String token) {
        Claims claims = getClaimsFromToken(token);
        if (claims == null) {
            return null;
        }

        // userUuid 클레임 추출
        String userUuid = claims.get("userUuid", String.class);
        if (userUuid != null) {
            return userUuid;
        }

        // 하위 호환: sub (subject)도 확인
        return claims.getSubject();
    }

}
