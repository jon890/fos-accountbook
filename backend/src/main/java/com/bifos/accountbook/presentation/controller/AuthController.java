package com.bifos.accountbook.presentation.controller;

import com.bifos.accountbook.presentation.dto.auth.AuthResponse;
import com.bifos.accountbook.presentation.dto.auth.RefreshTokenRequest;
import com.bifos.accountbook.application.service.AuthService;
import com.bifos.accountbook.presentation.dto.ApiSuccessResponse;
import com.bifos.accountbook.presentation.dto.auth.SocialLoginRequest;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@Tag(name = "인증 (Authentication)", description = "회원가입, 로그인, 토큰 관리 API")
@Slf4j
@RestController
@RequestMapping("/api/v1/auth")
@RequiredArgsConstructor
public class AuthController {

  private final AuthService authService;

  @Operation(summary = "소셜 로그인", description = "소셜 로그인 유저를 인증합니다.")
  @ApiResponse(responseCode = "200", description = "로그인 성공")
  @ApiResponse(responseCode = "401", description = "인증 실패")
  @PostMapping("/social-login")
  public ResponseEntity<ApiSuccessResponse<AuthResponse>> socialLogin(@Valid @RequestBody SocialLoginRequest request) {
    AuthResponse response = authService.socialLogin(request);

    return ResponseEntity.ok(ApiSuccessResponse.of("로그인 성공", response));
  }

  @Operation(summary = "토큰 갱신", description = "Refresh Token을 사용하여 새로운 Access Token과 Refresh Token을 발급합니다.")
  @ApiResponse(responseCode = "200", description = "토큰 갱신 성공")
  @ApiResponse(responseCode = "401", description = "유효하지 않은 Refresh Token")
  @PostMapping("/refresh")
  public ResponseEntity<ApiSuccessResponse<AuthResponse>> refreshToken(@Valid @RequestBody RefreshTokenRequest request) {
    AuthResponse response = authService.refreshToken(request.getRefreshToken());

    return ResponseEntity.ok(ApiSuccessResponse.of("토큰이 갱신되었습니다", response));
  }
}
