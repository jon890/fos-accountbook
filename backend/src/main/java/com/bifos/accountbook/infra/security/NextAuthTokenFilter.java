package com.bifos.accountbook.infra.security;

import com.bifos.accountbook.domain.entity.User;
import com.bifos.accountbook.domain.repository.UserRepository;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.Collections;

/**
 * NextAuth (Auth.js) 세션 토큰 검증 필터
 * <p>
 * NextAuth v5가 생성한 JWT 세션 토큰을 검증하고
 * Spring Security Authentication을 설정합니다.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class NextAuthTokenFilter extends OncePerRequestFilter {

    private final UserRepository userRepository;
    private final NextAuthTokenProvider nextAuthTokenProvider;

    @Override
    protected void doFilterInternal(
            HttpServletRequest request,
            HttpServletResponse response,
            FilterChain filterChain
    ) throws ServletException, IOException {

        try {
            // 1. NextAuth 세션 토큰 추출
            String token = extractTokenFromRequest(request);

            if (token != null && nextAuthTokenProvider.validateToken(token)) {
                // 2. 토큰에서 사용자 이메일 추출
                String userEmail = nextAuthTokenProvider.getEmailFromToken(token);

                if (userEmail != null && SecurityContextHolder.getContext().getAuthentication() == null) {
                    // 3. 사용자 조회
                    User user = userRepository.findByEmail(userEmail)
                            .orElse(null);

                    if (user != null) {
                        // 4. Spring Security Authentication 설정
                        UsernamePasswordAuthenticationToken authentication =
                                new UsernamePasswordAuthenticationToken(
                                        user.getId(), // Principal: user ID
                                        null,
                                        Collections.emptyList()
                                );
                        authentication.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
                        SecurityContextHolder.getContext().setAuthentication(authentication);

                        log.debug("NextAuth 세션 검증 성공: user={}", userEmail);
                    }
                }
            }
        } catch (Exception e) {
            log.debug("NextAuth 토큰 검증 실패: {}", e.getMessage());
        }

        filterChain.doFilter(request, response);
    }

    /**
     * Request에서 NextAuth 세션 토큰 추출
     * <p>
     * 순서:
     * 1. Authorization 헤더에서 Bearer 토큰 확인
     * 2. 쿠키에서 next-auth.session-token 확인 (프로덕션)
     * 3. 쿠키에서 __Secure-next-auth.session-token 확인 (HTTPS)
     */
    private String extractTokenFromRequest(HttpServletRequest request) {
        // 1. Authorization 헤더 확인
        String authHeader = request.getHeader("Authorization");
        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            return authHeader.substring(7);
        }

        // 2. 쿠키 확인
        Cookie[] cookies = request.getCookies();
        if (cookies != null) {
            for (Cookie cookie : cookies) {
                // 로컬: next-auth.session-token
                // 프로덕션 (HTTPS): __Secure-next-auth.session-token
                if ("next-auth.session-token".equals(cookie.getName()) ||
                        "__Secure-next-auth.session-token".equals(cookie.getName())) {
                    return cookie.getValue();
                }
            }
        }

        return null;
    }
}

