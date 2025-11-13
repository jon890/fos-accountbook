package com.bifos.accountbook.application.dto.auth;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AuthResponse {

  private String accessToken;
  private String refreshToken;
  private String tokenType;
  private Long expiresIn; // 초 단위
  private UserInfo user;

  @Getter
  @Builder
  @NoArgsConstructor
  @AllArgsConstructor
  public static class UserInfo {
    private String id;
    private String uuid; // VARCHAR(36) 문자열 형식
    private String email;
    private String name;
    private String image;
  }
}

