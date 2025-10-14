package com.bifos.accountbook.application.dto.invitation;

import com.bifos.accountbook.domain.entity.Invitation;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class InvitationResponse {

    private String uuid;
    private String familyUuid;
    private String familyName;
    private String token;
    private String status;
    private LocalDateTime expiresAt;
    private LocalDateTime createdAt;
    private boolean isExpired;
    private boolean isUsed;

    public static InvitationResponse from(Invitation invitation) {
        boolean isExpired = invitation.getExpiresAt().isBefore(LocalDateTime.now());
        boolean isUsed = "ACCEPTED".equals(invitation.getStatus());

        return InvitationResponse.builder()
                .uuid(invitation.getUuid().toString())
                .familyUuid(invitation.getFamilyUuid().toString())
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
}
