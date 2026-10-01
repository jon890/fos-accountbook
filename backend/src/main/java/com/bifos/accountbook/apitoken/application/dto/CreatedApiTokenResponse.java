package com.bifos.accountbook.apitoken.application.dto;

import com.bifos.accountbook.apitoken.domain.entity.ApiToken;
import java.time.LocalDateTime;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

/** 발급 직후 한 번만 돌려주는 응답. 원문 {@code token} 은 다시 조회할 수 없다. */
@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreatedApiTokenResponse {

  private String uuid;
  private String name;
  private String tokenPrefix;
  private LocalDateTime lastUsedAt;
  private LocalDateTime createdAt;
  private String token;

  public static CreatedApiTokenResponse of(ApiToken apiToken, String rawToken) {
    return CreatedApiTokenResponse.builder()
        .uuid(apiToken.getUuid().getValue())
        .name(apiToken.getName())
        .tokenPrefix(apiToken.getTokenPrefix())
        .lastUsedAt(apiToken.getLastUsedAt())
        .createdAt(apiToken.getCreatedAt())
        .token(rawToken)
        .build();
  }
}
