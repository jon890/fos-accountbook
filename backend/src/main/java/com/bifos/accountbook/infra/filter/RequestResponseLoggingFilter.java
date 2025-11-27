package com.bifos.accountbook.infra.filter;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.time.Instant;
import lombok.extern.slf4j.Slf4j;
import org.jspecify.annotations.NonNull;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;
import org.springframework.web.util.ContentCachingRequestWrapper;
import org.springframework.web.util.ContentCachingResponseWrapper;

/**
 * HTTP 요청/응답 로깅 필터
 * <p>
 * 개발 환경에서 API 요청/응답을 상세하게 로깅합니다.
 * RequestBody와 ResponseBody도 캡처하여 로깅합니다.
 */
@Slf4j
@Component
public class RequestResponseLoggingFilter extends OncePerRequestFilter {

  private static final int MAX_PAYLOAD_LENGTH = 1000; // 로그에 표시할 최대 길이

  @Override
  protected void doFilterInternal(@NonNull HttpServletRequest request,
                                  @NonNull HttpServletResponse response,
                                  @NonNull FilterChain filterChain) throws ServletException, IOException {

    // Swagger UI 및 정적 리소스는 로깅 제외
    if (isAsyncDispatch(request) || shouldNotFilter(request)) {
      filterChain.doFilter(request, response);
      return;
    }

    // Request/Response 래핑 (body를 여러 번 읽을 수 있도록)
    ContentCachingRequestWrapper wrappedRequest = new ContentCachingRequestWrapper(request, 1000);
    ContentCachingResponseWrapper wrappedResponse = new ContentCachingResponseWrapper(response);

    Instant start = Instant.now();

    try {
      // 요청 로깅
      logRequest(wrappedRequest);

      // 필터 체인 실행
      filterChain.doFilter(wrappedRequest, wrappedResponse);

      // 응답 로깅
      long duration = Duration.between(start, Instant.now()).toMillis();
      logResponse(wrappedRequest, wrappedResponse, duration);

    } finally {
      // ResponseBody를 실제 응답으로 복사 (매우 중요!)
      wrappedResponse.copyBodyToResponse();
    }
  }

  /**
   * 요청 로깅
   */
  private void logRequest(ContentCachingRequestWrapper request) {
    String method = request.getMethod();
    String uri = request.getRequestURI();
    String queryString = request.getQueryString();
    String fullUrl = queryString != null ? uri + "?" + queryString : uri;

    log.info("┌─────────────────────────────────────────────────────────────");
    log.info("│ 📨 HTTP Request: {} {}", method, fullUrl);
    log.info("├─────────────────────────────────────────────────────────────");

    // Authorization 헤더만 출력
    String authHeader = request.getHeader("Authorization");
    if (authHeader != null) {
      log.info("│ [Authorization]");
      log.info("│   {}", maskToken(authHeader));
    }

    // Session Token 쿠키만 출력
    Cookie[] cookies = request.getCookies();
    if (cookies != null && cookies.length > 0) {
      boolean hasSessionToken = false;
      for (Cookie cookie : cookies) {
        String name = cookie.getName();
        // NextAuth/Auth.js 세션 토큰만 로깅
        if (name.contains("session-token") || name.contains("authjs")) {
          if (!hasSessionToken) {
            log.info("│ [Session Cookie]");
            hasSessionToken = true;
          }
          log.info("│   {}: {}", name, maskToken(cookie.getValue()));
        }
      }

      // 세션 토큰이 없으면 경고
      if (!hasSessionToken) {
        log.warn("│ ⚠️  No session-token found in cookies");
      }
    } else {
      log.warn("│ ⚠️  No cookies in request");
    }

    // Request Body
    byte[] content = request.getContentAsByteArray();
    if (content.length > 0) {
      String body = new String(content, StandardCharsets.UTF_8);
      log.info("│ [Body]");
      log.info("│   {}", truncate(body, MAX_PAYLOAD_LENGTH));
    }

    log.info("└─────────────────────────────────────────────────────────────");
  }

  /**
   * 응답 로깅
   */
  private void logResponse(
      ContentCachingRequestWrapper request,
      ContentCachingResponseWrapper response,
      long duration) {
    String method = request.getMethod();
    String uri = request.getRequestURI();
    int status = response.getStatus();

    log.info("┌─────────────────────────────────────────────────────────────");
    log.info("│ 📤 HTTP Response: {} {} → {} ({}ms)", method, uri, status, duration);
    log.info("├─────────────────────────────────────────────────────────────");

    // Response Body
    byte[] content = response.getContentAsByteArray();
    if (content.length > 0) {
      String body = new String(content, StandardCharsets.UTF_8);
      log.info("│ [Body]");
      log.info("│   {}", truncate(body, MAX_PAYLOAD_LENGTH));
    }

    log.info("└─────────────────────────────────────────────────────────────");
  }

  /**
   * 토큰 마스킹 (앞 10자 + *** + 뒤 10자)
   */
  private String maskToken(String token) {
    if (token == null || token.length() < 20) {
      return "***";
    }
    return token.substring(0, 10) + "***" + token.substring(token.length() - 10);
  }

  /**
   * 문자열 잘라내기
   */
  private String truncate(String str, int maxLength) {
    if (str.length() <= maxLength) {
      return str;
    }
    return str.substring(0, maxLength) + "... (truncated)";
  }

  /**
   * 로깅 제외할 경로 필터링
   */
  @Override
  protected boolean shouldNotFilter(@NonNull HttpServletRequest request) {
    String path = request.getRequestURI();
    return path.startsWith("/swagger-ui") ||
        path.startsWith("/v3/api-docs") ||
        path.startsWith("/webjars") ||
        path.startsWith("/actuator") ||
        path.equals("/health") ||
        path.endsWith(".css") ||
        path.endsWith(".js") ||
        path.endsWith(".png") ||
        path.endsWith(".ico");
  }
}
