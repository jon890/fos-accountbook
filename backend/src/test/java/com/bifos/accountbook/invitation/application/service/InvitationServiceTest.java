package com.bifos.accountbook.invitation.application.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.bifos.accountbook.family.domain.entity.Family;
import com.bifos.accountbook.family.domain.repository.FamilyMemberRepository;
import com.bifos.accountbook.family.domain.repository.FamilyRepository;
import com.bifos.accountbook.invitation.application.dto.InvitationResponse;
import com.bifos.accountbook.invitation.domain.entity.Invitation;
import com.bifos.accountbook.invitation.domain.repository.InvitationRepository;
import com.bifos.accountbook.shared.exception.BusinessException;
import com.bifos.accountbook.shared.value.CustomUuid;
import com.bifos.accountbook.user.application.service.UserService;
import com.bifos.accountbook.user.domain.repository.UserRepository;
import java.time.Clock;
import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.List;
import java.util.Optional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
@DisplayName("InvitationService 시각 단위 테스트")
class InvitationServiceTest {

  private static final Clock FIXED_CLOCK =
      Clock.fixed(Instant.parse("2026-03-10T00:00:00Z"), ZoneId.of("Asia/Seoul"));

  @Mock private InvitationRepository invitationRepository;
  @Mock private FamilyRepository familyRepository;
  @Mock private FamilyMemberRepository familyMemberRepository;
  @Mock private UserService userService;
  @Mock private UserRepository userRepository;

  private InvitationService invitationService;
  private LocalDateTime now;
  private CustomUuid familyUuid;

  @BeforeEach
  void setUp() {
    invitationService =
        new InvitationService(
            invitationRepository,
            familyRepository,
            familyMemberRepository,
            userService,
            userRepository,
            FIXED_CLOCK);
    now = LocalDateTime.now(FIXED_CLOCK);
    familyUuid = CustomUuid.generate();
  }

  private Invitation invitationExpiringAt(LocalDateTime expiresAt) {
    return Invitation.builder()
        .uuid(CustomUuid.generate())
        .familyUuid(familyUuid)
        .inviterUserUuid(CustomUuid.generate())
        .token("token")
        .expiresAt(expiresAt)
        .build();
  }

  private void stubTokenLookup(Invitation invitation) {
    when(invitationRepository.findValidByToken(eq("token"), any()))
        .thenReturn(Optional.of(invitation));
    when(familyRepository.findActiveByUuid(familyUuid))
        .thenReturn(Optional.of(Family.builder().name("우리집").build()));
    when(userRepository.findByUuid(any())).thenReturn(Optional.empty());
    when(familyMemberRepository.countByFamilyUuid(familyUuid)).thenReturn(2);
  }

  @Test
  @DisplayName("토큰 조회는 주입한 Clock 의 현재 시각으로 유효한 초대를 찾는다")
  void getInvitationByToken_usesClockNow() {
    stubTokenLookup(invitationExpiringAt(now.plusSeconds(1)));

    invitationService.getInvitationByToken("token");

    ArgumentCaptor<LocalDateTime> captor = ArgumentCaptor.forClass(LocalDateTime.class);
    verify(invitationRepository).findValidByToken(eq("token"), captor.capture());
    assertThat(captor.getValue()).isEqualTo(LocalDateTime.now(FIXED_CLOCK));
  }

  @Test
  @DisplayName("만료 1초 전 초대는 만료가 아니다")
  void getInvitationByToken_justBeforeExpiry() {
    stubTokenLookup(invitationExpiringAt(now.plusSeconds(1)));

    InvitationResponse response = invitationService.getInvitationByToken("token");

    assertThat(response.isExpired()).isFalse();
    assertThat(response.getMemberCount()).isEqualTo(2);
  }

  @Test
  @DisplayName("만료 1초 후 초대는 만료로 표시된다")
  void getInvitationByToken_justAfterExpiry() {
    stubTokenLookup(invitationExpiringAt(now.minusSeconds(1)));

    InvitationResponse response = invitationService.getInvitationByToken("token");

    assertThat(response.isExpired()).isTrue();
  }

  @Test
  @DisplayName("유효한 초대가 없으면 예외가 난다")
  void getInvitationByToken_notFound() {
    when(invitationRepository.findValidByToken(eq("missing"), any())).thenReturn(Optional.empty());

    assertThatThrownBy(() -> invitationService.getInvitationByToken("missing"))
        .isInstanceOf(BusinessException.class);
  }

  @Test
  @DisplayName("가족 초대 목록 조회는 Clock 의 현재 시각을 기준으로 찾는다")
  void getFamilyInvitations_usesClockNow() {
    when(familyRepository.findActiveByUuid(familyUuid))
        .thenReturn(Optional.of(Family.builder().name("우리집").build()));
    when(invitationRepository.findActiveByFamilyUuid(eq(familyUuid), any()))
        .thenReturn(List.of(invitationExpiringAt(now.minusSeconds(1))));

    List<InvitationResponse> responses =
        invitationService.getFamilyInvitations(CustomUuid.generate(), familyUuid);

    verify(invitationRepository).findActiveByFamilyUuid(familyUuid, now);
    assertThat(responses).hasSize(1);
    assertThat(responses.get(0).isExpired()).isTrue();
  }
}
