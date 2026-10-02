package com.bifos.accountbook.invitation.application.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import com.bifos.accountbook.family.domain.entity.Family;
import com.bifos.accountbook.invitation.application.dto.CreateInvitationRequest;
import com.bifos.accountbook.invitation.application.dto.InvitationResponse;
import com.bifos.accountbook.invitation.domain.entity.Invitation;
import com.bifos.accountbook.invitation.domain.repository.InvitationRepository;
import com.bifos.accountbook.shared.TestFixturesSupport;
import com.bifos.accountbook.shared.exception.BusinessException;
import com.bifos.accountbook.user.domain.entity.User;
import java.time.Clock;
import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.List;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Import;
import org.springframework.context.annotation.Primary;

/**
 * 초대의 업무 시각이 주입한 Clock 을 따르는지 실제 저장소와 쿼리로 확인한다.
 *
 * <p>만료 판정은 저장소 쿼리(`findValidByToken`, `findActiveByFamilyUuid`)의 `expiresAt > now` 가 한다. 저장소를 모킹하면
 * 그 판정을 검증할 수 없어 통합 테스트로 둔다.
 */
@Import(InvitationServiceTest.FixedClockConfig.class)
@DisplayName("InvitationService 시각 통합 테스트")
class InvitationServiceTest extends TestFixturesSupport {

  private static final ZoneId SEOUL = ZoneId.of("Asia/Seoul");
  private static final Instant FIXED_INSTANT = Instant.parse("2026-03-10T00:00:00Z");
  private static final LocalDateTime NOW = LocalDateTime.ofInstant(FIXED_INSTANT, SEOUL);

  @TestConfiguration
  static class FixedClockConfig {

    @Bean
    @Primary
    Clock fixedClock() {
      return Clock.fixed(FIXED_INSTANT, SEOUL);
    }
  }

  @Autowired private InvitationService invitationService;
  @Autowired private InvitationRepository invitationRepository;

  private User owner;
  private Family family;

  @BeforeEach
  void setUp() {
    owner = fixtures.getDefaultUser();
    family = fixtures.families.family().owner(owner).build();
  }

  private Invitation saveInvitation(String token, LocalDateTime expiresAt) {
    return invitationRepository.save(
        Invitation.builder()
            .familyUuid(family.getUuid())
            .inviterUserUuid(owner.getUuid())
            .token(token)
            .expiresAt(expiresAt)
            .build());
  }

  @Test
  @DisplayName("초대 생성은 Clock 의 현재 시각에 유효 시간을 더해 만료 시각을 정한다")
  void createInvitation_usesClockNow() {
    CreateInvitationRequest request = new CreateInvitationRequest(24);

    InvitationResponse response =
        invitationService.createInvitation(owner.getUuid(), family.getUuid(), request);

    assertThat(response.getExpiresAt()).isEqualTo(NOW.plusHours(24));
    assertThat(response.isExpired()).isFalse();
  }

  @Test
  @DisplayName("만료 1초 전 초대는 토큰으로 조회되고 만료가 아니다")
  void getInvitationByToken_justBeforeExpiry() {
    saveInvitation("TOKEN-BEFORE-EXPIRY-0000000000000000", NOW.plusSeconds(1));

    InvitationResponse response =
        invitationService.getInvitationByToken("TOKEN-BEFORE-EXPIRY-0000000000000000");

    assertThat(response.isExpired()).isFalse();
  }

  @Test
  @DisplayName("만료 1초 후 초대는 토큰으로 조회되지 않는다")
  void getInvitationByToken_justAfterExpiry() {
    saveInvitation("TOKEN-AFTER-EXPIRY-00000000000000000", NOW.minusSeconds(1));

    assertThatThrownBy(
            () -> invitationService.getInvitationByToken("TOKEN-AFTER-EXPIRY-00000000000000000"))
        .isInstanceOf(BusinessException.class);
  }

  @Test
  @DisplayName("가족 초대 목록은 Clock 의 현재 시각 기준으로 만료되지 않은 초대만 준다")
  void getFamilyInvitations_returnsOnlyActiveAtClockNow() {
    saveInvitation("TOKEN-ACTIVE-0000000000000000000000", NOW.plusHours(1));
    saveInvitation("TOKEN-EXPIRED-000000000000000000000", NOW.minusHours(1));

    List<InvitationResponse> invitations =
        invitationService.getFamilyInvitations(owner.getUuid(), family.getUuid());

    assertThat(invitations)
        .extracting(InvitationResponse::getToken)
        .containsExactly("TOKEN-ACTIVE-0000000000000000000000");
  }
}
