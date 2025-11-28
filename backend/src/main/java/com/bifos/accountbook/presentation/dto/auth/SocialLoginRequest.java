package com.bifos.accountbook.presentation.dto.auth;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
@AllArgsConstructor
public class SocialLoginRequest {

  @NotBlank(message = "OAuth provider는 필수입니다")
  @Size(max = 50, message = "Provider는 최대 50자까지 가능합니다")
  private String provider; // OAuth provider (google, kakao, etc.)

  @NotBlank(message = "Provider ID는 필수입니다")
  @Size(max = 255, message = "Provider ID는 최대 255자까지 가능합니다")
  private String providerId; // OAuth provider account ID

  @NotBlank(message = "이메일은 필수입니다")
  @Email(message = "올바른 이메일 형식이 아닙니다")
  private String email;

  @Size(max = 255, message = "이름은 최대 255자까지 가능합니다")
  private String name;

  @Size(max = 500, message = "이미지 URL은 최대 500자까지 가능합니다")
  private String image;
}

