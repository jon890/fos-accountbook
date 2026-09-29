package com.bifos.accountbook.invitation.presentation.controller;

import com.bifos.accountbook.shared.AbstractControllerTest;
import com.bifos.accountbook.family.domain.entity.Family;
import com.bifos.accountbook.invitation.domain.entity.Invitation;
import com.bifos.accountbook.invitation.domain.repository.InvitationRepository;
import com.bifos.accountbook.user.domain.entity.User;
import java.time.LocalDateTime;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@DisplayName("초대장 컨트롤러 통합 테스트")
class InvitationControllerTest extends AbstractControllerTest {

  @Autowired
  private InvitationRepository invitationRepository;

  private User testUser;
  private Family testFamily;
  private Invitation testInvitation;

  @BeforeEach
  void setUp() {
    doTransactionWithoutResult(() -> {
      testUser = fixtures.getDefaultUser();
      testFamily = fixtures.families.family()
                                    .owner(testUser)
                                    .build();
      testInvitation = invitationRepository.save(
          Invitation.builder()
                    .familyUuid(testFamily.getUuid())
                    .inviterUserUuid(testUser.getUuid())
                    .token("TEST-TOKEN-12345678901234567890123")
                    .expiresAt(LocalDateTime.now().plusDays(3))
                    .build()
      );
    });
  }

  @Test
  @DisplayName("유효한 토큰으로 초대장 조회 시 inviter와 memberCount가 포함된다")
  void getInvitationByToken_ReturnsInviterAndMemberCount() throws Exception {
    mockMvc.perform(get("/api/v1/invitations/token/{token}", testInvitation.getToken())
                        .contentType(MediaType.APPLICATION_JSON))
           .andExpect(status().isOk())
           .andExpect(jsonPath("$.success").value(true))
           .andExpect(jsonPath("$.data.familyName").value(testFamily.getName()))
           .andExpect(jsonPath("$.data.inviter").exists())
           .andExpect(jsonPath("$.data.inviter.name").value(testUser.getName()))
           .andExpect(jsonPath("$.data.memberCount").isNumber());
  }

  @Test
  @DisplayName("초대장 응답에 이메일 등 민감 정보가 포함되지 않는다")
  void getInvitationByToken_DoesNotExposePrivateInfo() throws Exception {
    mockMvc.perform(get("/api/v1/invitations/token/{token}", testInvitation.getToken())
                        .contentType(MediaType.APPLICATION_JSON))
           .andExpect(status().isOk())
           .andExpect(jsonPath("$.data.inviter.email").doesNotExist())
           .andExpect(jsonPath("$.data.inviter.phone").doesNotExist())
           .andExpect(jsonPath("$.data.inviter.uuid").doesNotExist());
  }

  @Test
  @DisplayName("만료된 토큰으로 조회하면 400 에러가 발생한다")
  void getInvitationByToken_ExpiredToken_Returns400() throws Exception {
    Invitation expiredInvitation = doTransaction(() ->
        invitationRepository.save(
            Invitation.builder()
                      .familyUuid(testFamily.getUuid())
                      .inviterUserUuid(testUser.getUuid())
                      .token("EXPIRED-TOKEN-12345678901234567")
                      .expiresAt(LocalDateTime.now().minusDays(1))
                      .build()
        )
    );

    mockMvc.perform(get("/api/v1/invitations/token/{token}", expiredInvitation.getToken())
                        .contentType(MediaType.APPLICATION_JSON))
           .andExpect(status().isBadRequest());
  }

  @Test
  @DisplayName("존재하지 않는 토큰으로 조회하면 400 에러가 발생한다")
  void getInvitationByToken_InvalidToken_Returns400() throws Exception {
    mockMvc.perform(get("/api/v1/invitations/token/{token}", "NONEXISTENT-TOKEN-123456789012")
                        .contentType(MediaType.APPLICATION_JSON))
           .andExpect(status().isBadRequest());
  }
}
