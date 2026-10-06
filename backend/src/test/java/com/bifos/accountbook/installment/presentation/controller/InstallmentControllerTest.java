package com.bifos.accountbook.installment.presentation.controller;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.bifos.accountbook.family.domain.entity.Family;
import com.bifos.accountbook.installment.application.dto.InstallmentRequest;
import com.bifos.accountbook.installment.application.service.InstallmentService;
import com.bifos.accountbook.shared.AbstractControllerTest;
import com.bifos.accountbook.user.domain.entity.User;
import java.math.BigDecimal;
import java.time.Clock;
import java.time.Instant;
import java.time.ZoneId;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Import;
import org.springframework.context.annotation.Primary;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.ResultActions;

@Import(InstallmentControllerTest.FixedClockConfig.class)
@DisplayName("InstallmentController 통합 테스트")
class InstallmentControllerTest extends AbstractControllerTest {

  /** 업무 날짜 기준 이번 달은 2026-10 이다. */
  @TestConfiguration
  static class FixedClockConfig {

    @Bean
    @Primary
    Clock fixedClock() {
      return Clock.fixed(Instant.parse("2026-10-15T00:00:00Z"), ZoneId.of("Asia/Seoul"));
    }
  }

  @Autowired private InstallmentService installmentService;

  private User user;
  private Family family;

  @BeforeEach
  void setUp() {
    user = fixtures.getDefaultUser();
    family = fixtures.getDefaultFamily();
  }

  private String basePath() {
    return "/api/v1/families/" + family.getUuid().getValue() + "/installments";
  }

  private InstallmentRequest request(
      String name, long total, int months, String startMonth, String memo) {
    return new InstallmentRequest(name, BigDecimal.valueOf(total), months, startMonth, memo);
  }

  private ResultActions create(InstallmentRequest request) throws Exception {
    return mockMvc.perform(
        post(basePath())
            .contentType(MediaType.APPLICATION_JSON)
            .content(objectMapper.writeValueAsString(request)));
  }

  private String createdUuid(InstallmentRequest request) throws Exception {
    String body =
        create(request)
            .andExpect(status().isCreated())
            .andReturn()
            .getResponse()
            .getContentAsString();
    return objectMapper.readTree(body).path("data").path("uuid").asText();
  }

  @Test
  @DisplayName("등록하면 201 과 이번 달 기준 계산 필드를 돌려주고 빈 메모는 null 이다")
  void create_success() throws Exception {
    create(request("노트북", 1_000_000, 12, "2026-09", "  "))
        .andExpect(status().isCreated())
        .andExpect(jsonPath("$.data.name").value("노트북"))
        .andExpect(jsonPath("$.data.userUuid").value(user.getUuid().getValue()))
        .andExpect(jsonPath("$.data.totalAmount").value(1000000))
        .andExpect(jsonPath("$.data.startMonth").value("2026-09"))
        .andExpect(jsonPath("$.data.endMonth").value("2027-08"))
        .andExpect(jsonPath("$.data.monthlyAmount").value(83333))
        .andExpect(jsonPath("$.data.firstMonthAmount").value(83337))
        .andExpect(jsonPath("$.data.currentRound").value(2))
        .andExpect(jsonPath("$.data.thisMonthAmount").value(83333))
        .andExpect(jsonPath("$.data.remainingAmount").value(833330))
        .andExpect(jsonPath("$.data.progress").value("IN_PROGRESS"))
        .andExpect(jsonPath("$.data.memo").doesNotExist());
  }

  @Test
  @DisplayName("개월 수, 첫 결제 월, 총액, 이름이 잘못되면 400 이다")
  void create_fails_whenInvalid() throws Exception {
    create(request("할부", 1_000_000, 1, "2026-09", null)).andExpect(status().isBadRequest());
    create(request("할부", 1_000_000, 61, "2026-09", null)).andExpect(status().isBadRequest());
    create(request("할부", 1_000_000, 12, "2026-13", null)).andExpect(status().isBadRequest());
    create(request("할부", 5, 12, "2026-09", null))
        .andExpect(status().isBadRequest())
        .andExpect(jsonPath("$.code").value("C001"));
    create(request("   ", 1_000_000, 12, "2026-09", null)).andExpect(status().isBadRequest());
  }

  @Test
  @DisplayName("목록은 첫 결제 월 오름차순이고 지운 할부와 다른 가족의 할부는 빠진다")
  void list_orderedAndFiltered() throws Exception {
    createdUuid(request("나중", 120_000, 12, "2026-11", null));
    createdUuid(request("먼저", 120_000, 12, "2026-01", null));
    String deleted = createdUuid(request("지운 것", 120_000, 12, "2026-05", null));
    mockMvc.perform(delete(basePath() + "/" + deleted)).andExpect(status().isOk());

    User otherUser = fixtures.users.getOtherUser();
    Family otherFamily = fixtures.families.family().owner(otherUser).build();
    installmentService.createInstallment(
        otherUser.getUuid(), otherFamily.getUuid(), request("타가족", 120_000, 12, "2026-02", null));

    mockMvc
        .perform(get(basePath()))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.data.length()").value(2))
        .andExpect(jsonPath("$.data[0].name").value("먼저"))
        .andExpect(jsonPath("$.data[1].name").value("나중"));
  }

  @Test
  @DisplayName("할부가 없으면 빈 배열이다")
  void list_empty() throws Exception {
    mockMvc
        .perform(get(basePath()))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.data.length()").value(0));
  }

  @Test
  @DisplayName("수정하면 200 과 갱신된 계산 필드를 돌려준다")
  void update_success() throws Exception {
    String uuid = createdUuid(request("노트북", 1_000_000, 12, "2026-09", null));

    mockMvc
        .perform(
            put(basePath() + "/" + uuid)
                .contentType(MediaType.APPLICATION_JSON)
                .content(
                    objectMapper.writeValueAsString(request("새 노트북", 300_000, 3, "2026-10", "메모"))))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.data.name").value("새 노트북"))
        .andExpect(jsonPath("$.data.endMonth").value("2026-12"))
        .andExpect(jsonPath("$.data.monthlyAmount").value(100000))
        .andExpect(jsonPath("$.data.currentRound").value(1))
        .andExpect(jsonPath("$.data.remainingAmount").value(200000))
        .andExpect(jsonPath("$.data.memo").value("메모"));
  }

  @Test
  @DisplayName("다른 가족의 할부는 수정과 삭제에서 IS001 을 돌려준다")
  void updateAndDelete_fail_whenOtherFamilyItem() throws Exception {
    User otherUser = fixtures.users.getOtherUser();
    Family otherFamily = fixtures.families.family().owner(otherUser).build();
    String otherUuid =
        installmentService
            .createInstallment(
                otherUser.getUuid(),
                otherFamily.getUuid(),
                request("타가족", 120_000, 12, "2026-02", null))
            .getUuid();

    mockMvc
        .perform(
            put(basePath() + "/" + otherUuid)
                .contentType(MediaType.APPLICATION_JSON)
                .content(
                    objectMapper.writeValueAsString(request("수정", 120_000, 12, "2026-02", null))))
        .andExpect(status().isNotFound())
        .andExpect(jsonPath("$.code").value("IS001"));
    mockMvc
        .perform(delete(basePath() + "/" + otherUuid))
        .andExpect(status().isNotFound())
        .andExpect(jsonPath("$.code").value("IS001"));
  }

  @Test
  @DisplayName("삭제하면 목록에서 빠지고 다시 삭제하면 IS001 이다")
  void delete_thenGone() throws Exception {
    String uuid = createdUuid(request("노트북", 1_000_000, 12, "2026-09", null));

    mockMvc.perform(delete(basePath() + "/" + uuid)).andExpect(status().isOk());

    mockMvc.perform(get(basePath())).andExpect(jsonPath("$.data.length()").value(0));
    mockMvc
        .perform(delete(basePath() + "/" + uuid))
        .andExpect(status().isNotFound())
        .andExpect(jsonPath("$.code").value("IS001"));
  }

  @Test
  @DisplayName("가족 구성원이 아니면 403 이다")
  void list_forbidden_whenNotMember() throws Exception {
    User outsider = fixtures.users.user().email("outsider@example.com").build();
    fixtures.users.setSecurityContext(outsider);

    mockMvc.perform(get(basePath())).andExpect(status().isForbidden());
  }
}
