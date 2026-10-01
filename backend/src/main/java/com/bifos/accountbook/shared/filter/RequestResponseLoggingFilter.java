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
  private static final String AUTH_PATH_PREFIX = "/api/v1/auth/";
  private static final String INVITATION_TOKEN_PATH_PREFIX = "/api/v1/invitations/token/";
  private static final String API_TOKEN_PREFIX = "fab_";
  // 연동 토큰의 표시용 앞 12자
  private static final int API_TOKEN_VISIBLE_LENGTH = 12;

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
      filterChain.doFilter(wrappedRequest, wrappedResponse);

      long duration = Duration.between(start, Instant.now()).toMillis();
      logRequest(wrappedRequest);
      logResponse(wrappedRequest, wrappedResponse, duration);

    } finally {
      wrappedResponse.copyBodyToResponse();
    }
  }

  private void logRequest(ContentCachingRequestWrapper request) {
    String method = request.getMethod();
    String fullUrl = maskRequestTarget(request);

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

    log.info("{}", sb);
    logDebugBody("[REQ]", request.getRequestURI(), request.getContentAsByteArray());
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
    int status = response.getStatus();

    StringBuilder sb = new StringBuilder();
    sb.append("[RES] ").append(method).append(" ").append(maskRequestTarget(request));
    sb.append(" → ").append(status).append(" (").append(duration).append("ms)");

    log.info("{}", sb);
    logDebugBody("[RES]", request.getRequestURI(), response.getContentAsByteArray());
  }

  private void logDebugBody(String logType, String requestUri, byte[] content) {
    if (!log.isDebugEnabled()) {
      return;
    }

    if (isBodyExcludedPath(requestUri)) {
      log.debug("{} Body: (인증 경로라 생략)", logType);
      return;
    }

    if (content.length > 0) {
      String body = new String(content, StandardCharsets.UTF_8);
      log.debug("{} Body: {}", logType, truncate(body, MAX_PAYLOAD_LENGTH));
    }
  }

  private boolean isBodyExcludedPath(String requestUri) {
    return requestUri.startsWith(AUTH_PATH_PREFIX) || API_TOKEN_ISSUE_PATH.equals(requestUri);
  }

  private String maskRequestTarget(HttpServletRequest request) {
    String path = maskInvitationToken(request.getRequestURI());
    String query = maskQuery(request.getQueryString());
    return query == null ? path : path + "?" + query;
  }

  private String maskInvitationToken(String path) {
    if (!path.startsWith(INVITATION_TOKEN_PATH_PREFIX)) {
      return path;
    }
    return INVITATION_TOKEN_PATH_PREFIX + "***";
  }

  private String maskQuery(String query) {
    if (query == null) {
      return null;
    }

    String[] parameters = query.split("&", -1);
    StringBuilder maskedQuery = new StringBuilder();
    for (int index = 0; index < parameters.length; index++) {
      if (index > 0) {
        maskedQuery.append('&');
      }

      String parameter = parameters[index];
      int equalsIndex = parameter.indexOf('=');
      String key = equalsIndex >= 0 ? parameter.substring(0, equalsIndex) : parameter;
      maskedQuery.append(key).append("=***");
    }
    return maskedQuery.toString();
  }

  /**
   * 연동 토큰은 끝부분만으로도 원문 추정 범위가 줄어드므로 표시용 앞부분만 남긴다.
   * 스킴의 대소문자나 공백 수가 달라도 fab_ 가 보이면 같은 규칙으로 가린다.
   */
  private String maskAuthorization(String authHeader) {
    int tokenStart = indexOfApiTokenPrefix(authHeader);
    if (tokenStart >= 0) {
      int visibleEnd = Math.min(tokenStart + API_TOKEN_VISIBLE_LENGTH, authHeader.length());
      return authHeader.substring(0, visibleEnd) + "***";
    }
    return maskToken(authHeader);
  }

  // toLowerCase 는 일부 문자에서 길이가 바뀌어 원문 위치와 어긋나므로 원문 위에서 대소문자를 무시해 찾는다.
  private int indexOfApiTokenPrefix(String value) {
    for (int i = 0; i <= value.length() - API_TOKEN_PREFIX.length(); i++) {
      if (value.regionMatches(true, i, API_TOKEN_PREFIX, 0, API_TOKEN_PREFIX.length())) {
        return i;
      }
    }
    return -1;
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
