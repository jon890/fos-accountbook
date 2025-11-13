package com.bifos.accountbook.application.dto.invitation;

import jakarta.validation.constraints.Min;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
@AllArgsConstructor
public class CreateInvitationRequest {

  @Min(value = 1, message = "유효 기간은 최소 1시간 이상이어야 합니다")
  private Integer expirationHours; // 만료 시간 (시간 단위), 기본값 72시간 (3일)
}

