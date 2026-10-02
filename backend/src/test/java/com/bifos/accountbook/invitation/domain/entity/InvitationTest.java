package com.bifos.accountbook.invitation.domain.entity;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.time.LocalDateTime;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

@DisplayName("Invitation 만료와 수락")
class InvitationTest {

  private static final LocalDateTime NOW = LocalDateTime.of(2026, 3, 10, 9, 0);

  private Invitation invitationExpiringAt(LocalDateTime expiresAt) {
    return Invitation.builder().token("TOKEN").expiresAt(expiresAt).build();
  }

  @Test
  @DisplayName("만료 1초 전에는 수락된다")
  void accept_justBeforeExpiry() {
    Invitation invitation = invitationExpiringAt(NOW.plusSeconds(1));

    invitation.accept(NOW);

    assertThat(invitation.canAccept(NOW)).isFalse();
    assertThat(invitation.isExpired(NOW)).isFalse();
  }

  @Test
  @DisplayName("만료 1초 후에는 수락할 수 없다")
  void accept_justAfterExpiry() {
    Invitation invitation = invitationExpiringAt(NOW.minusSeconds(1));

    assertThat(invitation.isExpired(NOW)).isTrue();
    assertThat(invitation.canAccept(NOW)).isFalse();
    assertThatThrownBy(() -> invitation.accept(NOW))
        .isInstanceOf(IllegalStateException.class)
        .hasMessage("만료된 초대입니다");
  }

  @Test
  @DisplayName("이미 수락한 초대는 다시 수락할 수 없다")
  void accept_twice() {
    Invitation invitation = invitationExpiringAt(NOW.plusDays(1));
    invitation.accept(NOW);

    assertThatThrownBy(() -> invitation.accept(NOW))
        .isInstanceOf(IllegalStateException.class)
        .hasMessage("수락할 수 없는 초대 상태입니다");
  }
}
