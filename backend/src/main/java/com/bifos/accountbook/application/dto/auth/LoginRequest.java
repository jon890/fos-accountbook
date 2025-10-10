package com.bifos.accountbook.application.dto.auth;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
@AllArgsConstructor
public class LoginRequest {
    
    @NotBlank(message = "이메일은 필수입니다")
    @Email(message = "올바른 이메일 형식이 아닙니다")
    private String email;
    
    // NextAuth를 통한 OAuth 로그인이므로 비밀번호는 사용하지 않음
    // 프론트엔드에서 NextAuth로 인증 후 사용자 정보를 전달받음
}

