package com.bifos.accountbook.apitoken.presentation.controller;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.bifos.accountbook.apitoken.application.dto.CreateApiTokenRequest;
import com.bifos.accountbook.apitoken.application.service.ApiTokenService;
import com.bifos.accountbook.apitoken.domain.entity.ApiToken;
import com.bifos.accountbook.apitoken.domain.value.ApiTokenStatus;
import com.bifos.accountbook.apitoken.infra.repository.jpa.ApiTokenJpaRepository;
import com.bifos.accountbook.shared.AbstractControllerTest;
import com.bifos.accountbook.user.domain.entity.User;
import com.fasterxml.jackson.databind.JsonNode;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.system.CapturedOutput;
import org.springframework.boot.test.system.OutputCaptureExtension;
import org.springframework.http.MediaType;

@DisplayName("연동 토큰 API 통합 테스트")
class ApiTokenControllerTest extends AbstractControllerTest {

  private static final String BASE_URL = "/api/v1/users/me/api-tokens";

  @Autowired private ApiTokenService apiTokenService;

  @Autowired private ApiTokenJpaRepository apiTokenJpaRepository;

  private User testUser;

  @BeforeEach
  void setUp() {
    testUser = fixtures.users.getDefaultUser();
  }

  private JsonNode issueToken(String name) throws Exception {
    String body =
        mockMvc
            .perform(
                post(BASE_URL)
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(new CreateApiTokenRequest(name))))
            .andExpect(status().isCreated())
            .andReturn()
            .getResponse()
            .getContentAsString();
    return objectMapper.readTree(body).get("data");
  }

  private ApiToken findStoredToken(String uuid) {
    return apiTokenJpaRepository.findAll().stream()
        .filter(token -> token.getUuid().getValue().equals(uuid))
        .findFirst()
        .orElseThrow(() -> new AssertionError("저장된 토큰이 없다: " + uuid));
  }

  @Test
  @DisplayName("연동 토큰을 발급하면 원문을 한 번 돌려주고 DB 에는 해시만 저장한다")
  void issue_ReturnsRawTokenAndStoresHash() throws Exception {
    mockMvc
        .perform(
            post(BASE_URL)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(new CreateApiTokenRequest("가계부 봇"))))
        .andExpect(status().isCreated())
        .andExpect(jsonPath("$.success").value(true))
        .andExpect(jsonPath("$.message").value("연동 토큰을 발급했습니다"))
        .andExpect(jsonPath("$.data.name").value("가계부 봇"));

    JsonNode data = issueToken("두 번째");
    String token = data.get("token").asText();

    assertThat(token).startsWith("fab_").hasSize(47);
    assertThat(data.get("tokenPrefix").asText()).isEqualTo(token.substring(0, 12));

    ApiToken stored = findStoredToken(data.get("uuid").asText());
    assertThat(stored.getTokenHash()).isEqualTo(ApiTokenService.hash(token));
    assertThat(stored.getTokenHash()).isNotEqualTo(token);
    assertThat(stored.getUserUuid()).isEqualTo(testUser.getUuid());
    assertThat(stored.getStatus()).isEqualTo(ApiTokenStatus.ACTIVE);
  }

  @Test
  @DisplayName("목록은 발급한 토큰을 돌려주고 원문은 담지 않는다")
  void list_ReturnsTokensWithoutRawToken() throws Exception {
    issueToken("첫 번째");
    issueToken("두 번째");

    mockMvc
        .perform(get(BASE_URL))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.message").value("연동 토큰 목록을 조회했습니다"))
        .andExpect(jsonPath("$.data.length()").value(2))
        .andExpect(jsonPath("$.data[0].tokenPrefix").exists())
        .andExpect(jsonPath("$.data[0].token").doesNotExist())
        .andExpect(jsonPath("$.data[1].token").doesNotExist());
  }

  @Test
  @DisplayName("폐기한 토큰은 목록에서 빠지고 DB 에 REVOKED 와 폐기 시각이 남는다")
  void revoke_RemovesFromListAndMarksRevoked() throws Exception {
    String uuid = issueToken("폐기할 토큰").get("uuid").asText();

    mockMvc
        .perform(delete(BASE_URL + "/{tokenUuid}", uuid))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.message").value("연동 토큰을 폐기했습니다"));

    mockMvc
        .perform(get(BASE_URL))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.data.length()").value(0));

    ApiToken stored = findStoredToken(uuid);
    assertThat(stored.getStatus()).isEqualTo(ApiTokenStatus.REVOKED);
    assertThat(stored.getRevokedAt()).isNotNull();
  }

  @Test
  @DisplayName("남의 토큰을 폐기하려 하면 없는 토큰과 같은 404 로 답하고 토큰은 그대로 남는다")
  void revoke_OtherUsersToken_ReturnsNotFound() throws Exception {
    User otherUser = fixtures.users.getOtherUser();
    String otherUuid =
        apiTokenService.issue(otherUser.getUuid(), new CreateApiTokenRequest("남의 토큰")).getUuid();

    mockMvc
        .perform(delete(BASE_URL + "/{tokenUuid}", otherUuid))
        .andExpect(status().isNotFound())
        .andExpect(jsonPath("$.code").value("AT001"));

    assertThat(findStoredToken(otherUuid).getStatus()).isEqualTo(ApiTokenStatus.ACTIVE);
  }

  @Test
  @DisplayName("사용 중인 토큰이 5개면 6번째 발급은 400 이다")
  void issue_OverLimit_ReturnsBadRequest() throws Exception {
    for (int i = 1; i <= 5; i++) {
      issueToken("토큰 " + i);
    }

    mockMvc
        .perform(
            post(BASE_URL)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(new CreateApiTokenRequest("토큰 6"))))
        .andExpect(status().isBadRequest())
        .andExpect(jsonPath("$.code").value("AT002"));
  }

  @Test
  @DisplayName("이름이 비었거나 50자를 넘으면 400 이다")
  void issue_InvalidName_ReturnsBadRequest() throws Exception {
    mockMvc
        .perform(
            post(BASE_URL)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(new CreateApiTokenRequest(""))))
        .andExpect(status().isBadRequest());

    mockMvc
        .perform(
            post(BASE_URL)
                .contentType(MediaType.APPLICATION_JSON)
                .content(
                    objectMapper.writeValueAsString(new CreateApiTokenRequest("가".repeat(51)))))
        .andExpect(status().isBadRequest());

    issueToken("가".repeat(50));
  }

  @Test
  @ExtendWith(OutputCaptureExtension.class)
  @DisplayName("요청과 응답 로그에 연동 토큰 원문이 남지 않는다")
  void logging_DoesNotExposeRawToken(CapturedOutput output) throws Exception {
    String token = issueToken("로그 확인").get("token").asText();

    assertThat(output.getOut()).contains("[RES] POST " + BASE_URL);
    assertThat(output.getOut()).doesNotContain(token);

    mockMvc.perform(get(BASE_URL).header("Authorization", "Bearer " + token));

    assertThat(output.getOut()).contains("Auth: Bearer " + token.substring(0, 12) + "***");
    assertThat(output.getOut()).doesNotContain(token.substring(token.length() - 10));

    // 스킴이 소문자이거나 공백이 두 번이어도 fab_ 뒤 원문 끝부분이 남으면 안 된다
    mockMvc.perform(get(BASE_URL).header("Authorization", "bearer " + token));
    mockMvc.perform(get(BASE_URL).header("Authorization", "Bearer  " + token));

    assertThat(output.getOut()).contains("Auth: bearer " + token.substring(0, 12) + "***");
    assertThat(output.getOut()).contains("Auth: Bearer  " + token.substring(0, 12) + "***");
    assertThat(output.getOut()).doesNotContain(token.substring(token.length() - 10));
  }
}
