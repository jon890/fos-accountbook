package com.bifos.accountbook.config.security;

import com.bifos.accountbook.apitoken.application.service.ApiTokenService;
import com.bifos.accountbook.apitoken.domain.entity.ApiToken;
import com.bifos.accountbook.shared.dto.ApiErrorResponse;
import com.bifos.accountbook.shared.exception.ErrorCode;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.time.Clock;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.jspecify.annotations.NonNull;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;
import tools.jackson.databind.json.JsonMapper;

/**
 * {@code Authorization: Bearer fab_...} 요청을 토큰 주인으로 인증한다 (ADR-B18).
 * 허용 목록 밖의 경로는 403 으로 끝내고, 가족 권한은 기존처럼 서비스가 검증한다.
 * JWT 필터보다 앞에 두며, JWT 필터는 fab_ 값을 검증하지 못해 여기서 설정한 인증을 바꾸지 않는다.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class ApiTokenAuthenticationFilter extends OncePerRequestFilter {

  private static final String TOKEN_HEADER_PREFIX = "Bearer fab_";
  private static final String BEARER_PREFIX = "Bearer ";
  private static final String AUTHORITY = "API_TOKEN";

  private final ApiTokenService apiTokenService;
  private final ApiTokenAccessPolicy apiTokenAccessPolicy;
  private final JsonMapper jsonMapper;
  private final Clock clock;

  @Override
  protected void doFilterInternal(@NonNull HttpServletRequest request,
                                  @NonNull HttpServletResponse response,
                                  @NonNull FilterChain filterChain) throws ServletException, IOException {
    String header = request.getHeader("Authorization");
    if (header == null || !header.startsWith(TOKEN_HEADER_PREFIX)) {
      filterChain.doFilter(request, response);
      return;
    }

    Optional<ApiToken> found = apiTokenService.findActive(header.substring(BEARER_PREFIX.length()));
    if (found.isEmpty()) {
      writeError(request, response, ErrorCode.INVALID_TOKEN);
      return;
    }

    ApiToken token = found.get();
    if (!apiTokenAccessPolicy.isAllowed(request.getMethod(), request.getRequestURI())) {
      log.debug("연동 토큰 허용 목록 밖 요청: {} {}", request.getMethod(), request.getRequestURI());
      writeError(request, response, ErrorCode.FORBIDDEN);
      return;
    }

    UsernamePasswordAuthenticationToken authentication = new UsernamePasswordAuthenticationToken(
        token.getUserUuid().getValue(), null, List.of(new SimpleGrantedAuthority(AUTHORITY)));
    SecurityContext context = SecurityContextHolder.createEmptyContext();
    context.setAuthentication(authentication);
    SecurityContextHolder.setContext(context);

    apiTokenService.recordUsage(token, LocalDateTime.now(clock));

    filterChain.doFilter(request, response);
  }

  private void writeError(HttpServletRequest request, HttpServletResponse response, ErrorCode errorCode)
      throws IOException {
    response.setStatus(errorCode.getStatusCode());
    response.setContentType("application/json;charset=UTF-8");
    response.getWriter().write(
        jsonMapper.writeValueAsString(ApiErrorResponse.of(errorCode, request.getRequestURI())));
  }
}
