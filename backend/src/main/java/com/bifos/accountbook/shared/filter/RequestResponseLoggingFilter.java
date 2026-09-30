package com.bifos.accountbook.shared.filter;

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
 * 개발 환경에서 API 요청/응답을 상세하게 로깅합니다.
 * RequestBody와 ResponseBody도 캡처하여 로깅합니다.
 */
@Slf4j
@Component
public class RequestResponseLoggingFilter extends OncePerRequestFilter {

  private static final int MAX_PAYLOAD_LENGTH = 1000; // 로그에 표시할 최대 길이
  private static final String API_TOKEN_ISSUE_PATH = "/api/v1/users/me/api-tokens";
  private static final String API_TOKEN_BEARER_PREFIX = "Bearer fab_";
  // "Bearer " 7자와 연동 토큰의 표시용 앞 12자
  private static final int API_TOKEN_VISIBLE_LENGTH = 19;

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
      logRequest(wrappedRequest);

      filterChain.doFilter(wrappedRequest, wrappedResponse);

      long duration = Duration.between(start, Instant.now()).toMillis();
      logResponse(wrappedRequest, wrappedResponse, duration);

    } finally {
      wrappedResponse.copyBodyToResponse();
    }
  }

  private void logRequest(ContentCachingRequestWrapper request) {
    String method = request.getMethod();
    String uri = request.getRequestURI();
    String queryString = request.getQueryString();
    String fullUrl = queryString != null ? uri + "?" + queryString : uri;

    StringBuilder sb = new StringBuilder();
    sb.append("[REQ] ").append(method).append(" ").append(fullUrl);

    String authHeader = request.getHeader("Authorization");
    if (authHeader != null) {
      sb.append(" | Auth: ").append(maskAuthorization(authHeader));
    }

    String sessionToken = extractSessionToken(request.getCookies());
    if (sessionToken != null) {
      sb.append(" | Session: ").append(maskToken(sessionToken));
    }

    byte[] content = request.getContentAsByteArray();
    if (content.length > 0) {
      String body = new String(content, StandardCharsets.UTF_8);
      sb.append(" | Body: ").append(truncate(body, MAX_PAYLOAD_LENGTH));
    }

    log.info("{}", sb);
  }

  private String extractSessionToken(Cookie[] cookies) {
    if (cookies == null) {
      return null;
    }
    for (Cookie cookie : cookies) {
      String name = cookie.getName();
      if (name.contains("session-token") || name.contains("authjs")) {
        return cookie.getValue();
      }
    }
    return null;
  }

  private void logResponse(ContentCachingRequestWrapper request,
                           ContentCachingResponseWrapper response,
                           long duration) {
    String method = request.getMethod();
    String uri = request.getRequestURI();
    int status = response.getStatus();

    StringBuilder sb = new StringBuilder();
    sb.append("[RES] ").append(method).append(" ").append(uri);
    sb.append(" → ").append(status).append(" (").append(duration).append("ms)");

    byte[] content = response.getContentAsByteArray();
    if (isApiTokenIssue(method, uri)) {
      sb.append(" | Body: (연동 토큰 원문이 담겨 생략)");
    } else if (content.length > 0) {
      String body = new String(content, StandardCharsets.UTF_8);
      sb.append(" | Body: ").append(truncate(body, MAX_PAYLOAD_LENGTH));
    }

    log.info("{}", sb);
  }

  private boolean isApiTokenIssue(String method, String uri) {
    return "POST".equals(method) && API_TOKEN_ISSUE_PATH.equals(uri);
  }

  /**
   * 연동 토큰은 끝부분만으로도 원문 추정 범위가 줄어드므로 표시용 앞부분만 남긴다.
   */
  private String maskAuthorization(String authHeader) {
    if (authHeader.startsWith(API_TOKEN_BEARER_PREFIX)) {
      return authHeader.substring(0, Math.min(API_TOKEN_VISIBLE_LENGTH, authHeader.length())) + "***";
    }
    return maskToken(authHeader);
  }

  private String maskToken(String token) {
    if (token == null || token.length() < 20) {
      return "***";
    }
    return token.substring(0, 10) + "***" + token.substring(token.length() - 10);
  }

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
