package com.bifos.accountbook.apitoken.application.dto;

import com.bifos.accountbook.apitoken.domain.entity.ApiToken;
import java.time.LocalDateTime;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ApiTokenResponse {

  private String uuid;
  private String name;
  private String tokenPrefix;
  private LocalDateTime lastUsedAt;
  private LocalDateTime createdAt;

  public static ApiTokenResponse from(ApiToken apiToken) {
    return ApiTokenResponse.builder()
        .uuid(apiToken.getUuid().getValue())
        .name(apiToken.getName())
        .tokenPrefix(apiToken.getTokenPrefix())
        .lastUsedAt(apiToken.getLastUsedAt())
        .createdAt(apiToken.getCreatedAt())
        .build();
  }
}
