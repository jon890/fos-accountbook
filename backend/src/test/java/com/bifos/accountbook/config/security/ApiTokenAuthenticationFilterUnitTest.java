package com.bifos.accountbook.config.security;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.BDDMockito.given;
import static org.mockito.BDDMockito.willThrow;
import static org.mockito.Mockito.mock;

import com.bifos.accountbook.apitoken.application.service.ApiTokenService;
import com.bifos.accountbook.apitoken.domain.entity.ApiToken;
import com.bifos.accountbook.shared.value.CustomUuid;
import java.time.Clock;
import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.util.Optional;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.dao.DataAccessResourceFailureException;
import org.springframework.mock.web.MockFilterChain;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import tools.jackson.databind.json.JsonMapper;

@DisplayName("연동 토큰 인증 필터 단위 테스트")
class ApiTokenAuthenticationFilterUnitTest {

  private static final String RAW_TOKEN = "fab_unit-test-token";
  private static final String OWNER_UUID = "33333333-3333-3333-3333-333333333333";

  private final ApiTokenService apiTokenService = mock(ApiTokenService.class);
  private final Clock clock = Clock.fixed(Instant.parse("2026-09-30T00:00:00Z"), ZoneOffset.UTC);
  private final ApiTokenAuthenticationFilter filter = new ApiTokenAuthenticationFilter(
      apiTokenService, new ApiTokenAccessPolicy(), JsonMapper.builder().build(), clock);

  @AfterEach
  void clearContext() {
    SecurityContextHolder.clearContext();
  }

  @Test
  @DisplayName("사용 시각 기록이 실패해도 허용 경로 요청은 토큰 주인으로 인증되어 다음 필터로 넘어간다")
  void recordUsageFailureDoesNotBlockRequest() throws Exception {
    ApiToken token = ApiToken.builder().userUuid(CustomUuid.from(OWNER_UUID)).build();
    given(apiTokenService.findActive(RAW_TOKEN)).willReturn(Optional.of(token));
    willThrow(new DataAccessResourceFailureException("db down"))
        .given(apiTokenService).recordUsage(eq(token), any(LocalDateTime.class));

    MockHttpServletRequest request = new MockHttpServletRequest("GET", "/api/v1/families");
    request.addHeader("Authorization", "Bearer " + RAW_TOKEN);
    MockHttpServletResponse response = new MockHttpServletResponse();
    MockFilterChain chain = new MockFilterChain();

    filter.doFilter(request, response, chain);

    assertThat(chain.getRequest()).as("기록 실패와 무관하게 다음 필터가 호출되어야 한다").isSameAs(request);
    assertThat(response.getStatus()).as("필터가 오류 응답을 쓰면 안 된다").isEqualTo(200);
    Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
    assertThat(authentication).as("인증이 설정되어야 한다").isNotNull();
    assertThat(authentication.getPrincipal()).as("인증 주체는 토큰 주인이어야 한다").isEqualTo(OWNER_UUID);
  }
}
