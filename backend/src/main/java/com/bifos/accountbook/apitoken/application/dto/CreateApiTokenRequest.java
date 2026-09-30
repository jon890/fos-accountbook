package com.bifos.accountbook.apitoken.application.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
@AllArgsConstructor
public class CreateApiTokenRequest {

  @NotBlank(message = "토큰 이름은 필수입니다")
  @Size(max = 50, message = "토큰 이름은 최대 50자까지 가능합니다")
  private String name;
}
