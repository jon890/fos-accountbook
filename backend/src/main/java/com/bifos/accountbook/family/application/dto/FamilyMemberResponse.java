package com.bifos.accountbook.family.application.dto;

import com.bifos.accountbook.family.domain.entity.FamilyMember;
import com.bifos.accountbook.family.domain.value.FamilyMemberRole;
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
public class FamilyMemberResponse {

  private String userUuid;
  private String name;
  private String email;
  private String image;
  private FamilyMemberRole role;
  private LocalDateTime joinedAt;

  public static FamilyMemberResponse from(FamilyMember member) {
    User user = member.getUser();
    return FamilyMemberResponse.builder()
        .userUuid(member.getUserUuid().getValue())
        .name(user.getName())
        .email(user.getEmail())
        .image(user.getImage())
        .role(member.getRole())
        .joinedAt(member.getJoinedAt())
        .build();
  }
}
