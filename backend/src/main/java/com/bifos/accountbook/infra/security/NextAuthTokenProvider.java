package com.bifos.accountbook.infra.security;

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
 * NextAuth JWT 구조:
 * {
 *   "name": "사용자 이름",
 *   "email": "user@example.com",
 *   "picture": "프로필 이미지 URL",
 *   "sub": "사용자 ID",
 *   "iat": 발급 시간,
 *   "exp": 만료 시간,
 *   "jti": JWT ID
 * }
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
}

