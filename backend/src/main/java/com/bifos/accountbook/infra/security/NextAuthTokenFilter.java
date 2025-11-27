package com.bifos.accountbook.infra.security;

import com.bifos.accountbook.domain.entity.User;
import com.bifos.accountbook.domain.repository.UserRepository;
import com.bifos.accountbook.domain.value.CustomUuid;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.util.Collections;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.jspecify.annotations.NonNull;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

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
  protected void doFilterInternal(@NonNull HttpServletRequest request,
                                  @NonNull HttpServletResponse response,
                                  @NonNull FilterChain filterChain) throws ServletException, IOException {
    try {
      // 1. Request에서 NextAuth 세션 토큰 추출
      String token = extractTokenFromRequest(request);
      if (token == null) {
        filterChain.doFilter(request, response);
        return;
      }

      // 2. 토큰 검증
      if (!nextAuthTokenProvider.validateToken(token)) {
        filterChain.doFilter(request, response);
        return;
      }

      // 3. 이미 인증된 경우 스킵
      if (SecurityContextHolder.getContext().getAuthentication() != null) {
        filterChain.doFilter(request, response);
        return;
      }

      // 4. 토큰에서 사용자 UUID 추출
      String userUuid = nextAuthTokenProvider.getUserUuidFromToken(token);
      if (userUuid == null) {
        log.warn("NextAuth 토큰에서 userUuid를 추출할 수 없습니다");
        filterChain.doFilter(request, response);
        return;
      }

      // 5. 사용자 UUID로 사용자 조회
      User user = userRepository.findByUuid(CustomUuid.from(userUuid))
                                .orElse(null);
      if (user == null) {
        log.warn("사용자를 찾을 수 없습니다: userUuid={}", userUuid);
        filterChain.doFilter(request, response);
        return;
      }

      // 6. Spring Security Authentication 설정
      UsernamePasswordAuthenticationToken authentication = new UsernamePasswordAuthenticationToken(
          user.getUuid().getValue(), // Principal: user UUID (내부 ID 노출 방지)
          null,
          Collections.emptyList());
      authentication.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
      SecurityContextHolder.getContext().setAuthentication(authentication);

      log.debug("NextAuth 세션 검증 성공: userUuid={}", userUuid);
    } catch (Exception e) {
      log.error("NextAuth 토큰 검증 중 오류 발생", e);
    }

    filterChain.doFilter(request, response);
  }

  /**
   * Request에서 NextAuth 세션 토큰 추출
   * <p>
   * 순서:
   * 1. Authorization 헤더에서 Bearer 토큰 확인
   * 2. 쿠키에서 authjs.session-token 확인 (Auth.js v5)
   * 3. 쿠키에서 __Secure-authjs.session-token 확인 (HTTPS)
   * 4. 하위 호환: next-auth.session-token (NextAuth v4)
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
        // Auth.js v5 (NextAuth v5)
        if ("authjs.session-token".equals(cookie.getName()) ||
            "__Secure-authjs.session-token".equals(cookie.getName())) {
          return cookie.getValue();
        }
      }
    }

    return null;
  }
}
