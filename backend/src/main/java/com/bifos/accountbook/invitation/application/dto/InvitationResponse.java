package com.bifos.accountbook.invitation.application.dto;

import com.bifos.accountbook.invitation.domain.entity.Invitation;
import com.bifos.accountbook.invitation.domain.value.InvitationStatus;
import com.bifos.accountbook.user.domain.entity.User;
import java.time.LocalDateTime;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class InvitationResponse {

  private String uuid;
  private String familyUuid;
  private String familyName;
  private String token;
  private InvitationStatus status;
  private LocalDateTime expiresAt;
  private LocalDateTime createdAt;
  private boolean isExpired;
  private boolean isUsed;
  private InviterInfo inviter;
  private Integer memberCount;

  @Getter
  @Builder
  @NoArgsConstructor
  @AllArgsConstructor
  public static class InviterInfo {
    private String name;
    private String avatarUrl;

    public static InviterInfo from(User user) {
      return InviterInfo.builder()
                        .name(user.getName())
                        .avatarUrl(user.getImage())
                        .build();
    }
  }

  public static InvitationResponse from(Invitation invitation) {
    boolean isExpired = invitation.getExpiresAt().isBefore(LocalDateTime.now());
    boolean isUsed = InvitationStatus.ACCEPTED == invitation.getStatus();

    return InvitationResponse.builder()
                             .uuid(invitation.getUuid().getValue())
                             .familyUuid(invitation.getFamilyUuid().getValue())
                             .token(invitation.getToken())
                             .status(invitation.getStatus())
                             .expiresAt(invitation.getExpiresAt())
                             .createdAt(invitation.getCreatedAt())
                             .isExpired(isExpired)
                             .isUsed(isUsed)
                             .build();
  }

  public static InvitationResponse fromWithFamilyName(Invitation invitation, String familyName) {
    InvitationResponse response = from(invitation);
    return InvitationResponse.builder()
                             .uuid(response.getUuid())
                             .familyUuid(response.getFamilyUuid())
                             .familyName(familyName)
                             .token(response.getToken())
                             .status(response.getStatus())
                             .expiresAt(response.getExpiresAt())
                             .createdAt(response.getCreatedAt())
                             .isExpired(response.isExpired())
                             .isUsed(response.isUsed())
                             .build();
  }

  public static InvitationResponse fromWithDetails(Invitation invitation, String familyName,
      User inviterUser, int memberCount) {
    InvitationResponse response = from(invitation);
    return InvitationResponse.builder()
                             .uuid(response.getUuid())
                             .familyUuid(response.getFamilyUuid())
                             .familyName(familyName)
                             .token(response.getToken())
                             .status(response.getStatus())
                             .expiresAt(response.getExpiresAt())
                             .createdAt(response.getCreatedAt())
                             .isExpired(response.isExpired())
                             .isUsed(response.isUsed())
                             .inviter(InviterInfo.from(inviterUser))
                             .memberCount(memberCount)
                             .build();
  }
}
