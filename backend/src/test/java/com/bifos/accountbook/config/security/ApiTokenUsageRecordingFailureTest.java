package com.bifos.accountbook.config.security;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.BDDMockito.willThrow;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.bifos.accountbook.apitoken.application.dto.CreateApiTokenRequest;
import com.bifos.accountbook.apitoken.application.dto.CreatedApiTokenResponse;
import com.bifos.accountbook.apitoken.application.service.ApiTokenService;
import com.bifos.accountbook.apitoken.domain.entity.ApiToken;
import com.bifos.accountbook.family.domain.entity.Family;
import com.bifos.accountbook.shared.AbstractControllerTest;
import com.bifos.accountbook.user.domain.entity.User;
import java.time.LocalDateTime;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.dao.DataAccessResourceFailureException;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.test.context.bean.override.mockito.MockitoSpyBean;

/**
 * 사용 시각 기록 실패만 흉내 내려고 실제 ApiTokenService 를 spy 로 감싼다.
 * spy 는 다른 테스트와 다른 컨텍스트를 만들므로 필터 통합 테스트와 클래스를 나눈다.
 */
@DisplayName("연동 토큰 사용 시각 기록 실패 통합 테스트")
class ApiTokenUsageRecordingFailureTest extends AbstractControllerTest {

  @MockitoSpyBean
  private ApiTokenService apiTokenService;

  @Test
  @DisplayName("사용 시각 기록이 실패해도 허용 경로 요청은 토큰 주인으로 처리된다")
  void recordUsageFailureDoesNotBlockRequest() throws Exception {
    User owner = fixtures.users.user().email("usage-failure@test.com").build();
    Family family = fixtures.families.family().owner(owner).build();
    CreatedApiTokenResponse token = apiTokenService.issue(owner.getUuid(), new CreateApiTokenRequest("가계부 봇"));
    willThrow(new DataAccessResourceFailureException("db down"))
        .given(apiTokenService).recordUsage(any(ApiToken.class), any(LocalDateTime.class));

    SecurityContextHolder.clearContext();
    mockMvc.perform(get("/api/v1/families").header("Authorization", "Bearer " + token.getToken()))
           .andExpect(status().isOk())
           .andExpect(jsonPath("$.data[0].uuid").value(family.getUuid().getValue()));
  }
}
