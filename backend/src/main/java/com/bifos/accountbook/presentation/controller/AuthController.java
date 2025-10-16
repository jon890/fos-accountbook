package com.bifos.accountbook.presentation.controller;

import com.bifos.accountbook.application.dto.ApiSuccessResponse;
import com.bifos.accountbook.application.dto.auth.AuthResponse;
import com.bifos.accountbook.application.dto.auth.LoginRequest;
import com.bifos.accountbook.application.dto.auth.RefreshTokenRequest;
import com.bifos.accountbook.application.dto.auth.RegisterRequest;
import com.bifos.accountbook.application.service.AuthService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@Tag(name = "인증 (Authentication)", description = "회원가입, 로그인, 토큰 관리 API")
@Slf4j
@RestController
@RequestMapping("/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    @Operation(summary = "회원가입", description = "새로운 사용자를 등록하고 JWT 토큰을 발급합니다. (NextAuth OAuth 연동용)")
    @ApiResponse(responseCode = "200", description = "회원가입 성공")
    @ApiResponse(responseCode = "400", description = "잘못된 요청")
    @PostMapping("/register")
    public ResponseEntity<ApiSuccessResponse<AuthResponse>> register(
            @Valid @RequestBody RegisterRequest request) {
        AuthResponse response = authService.register(request);

        return ResponseEntity
                .status(HttpStatus.OK)
                .body(ApiSuccessResponse.of("인증되었습니다", response));
    }

    @Operation(summary = "로그인", description = "이메일로 사용자를 조회하고 JWT 토큰을 발급합니다.", security = {} // 이 엔드포인트는 인증 불필요
    )
    @ApiResponse(responseCode = "200", description = "로그인 성공")
    @ApiResponse(responseCode = "401", description = "인증 실패")
    @PostMapping("/login")
    public ResponseEntity<ApiSuccessResponse<AuthResponse>> login(
            @Valid @RequestBody LoginRequest request) {
        log.info("User login request: {}", request.getEmail());

        AuthResponse response = authService.login(request);

        return ResponseEntity.ok(ApiSuccessResponse.of("로그인 성공", response));
    }

    @Operation(summary = "토큰 갱신", description = "Refresh Token을 사용하여 새로운 Access Token과 Refresh Token을 발급합니다.", security = {} // 이
            // 엔드포인트는
            // 인증
            // 불필요
    )
    @ApiResponse(responseCode = "200", description = "토큰 갱신 성공")
    @ApiResponse(responseCode = "401", description = "유효하지 않은 Refresh Token")
    @PostMapping("/refresh")
    public ResponseEntity<ApiSuccessResponse<AuthResponse>> refreshToken(
            @Valid @RequestBody RefreshTokenRequest request) {
        log.info("Token refresh request");

        AuthResponse response = authService.refreshToken(request.getRefreshToken());

        return ResponseEntity.ok(ApiSuccessResponse.of("토큰이 갱신되었습니다", response));
    }

    @Operation(summary = "현재 사용자 정보 조회", description = "JWT 토큰을 통해 현재 로그인한 사용자의 정보를 조회합니다.", security = @SecurityRequirement(name = "bearerAuth"))
    @ApiResponse(responseCode = "200", description = "사용자 정보 조회 성공")
    @ApiResponse(responseCode = "401", description = "인증 실패")
    @GetMapping("/me")
    public ResponseEntity<ApiSuccessResponse<AuthResponse.UserInfo>> getCurrentUser(
            Authentication authentication) {
        String userId = authentication.getName();
        log.info("Fetching current user info: {}", userId);

        AuthResponse.UserInfo userInfo = authService.getCurrentUser(userId);

        return ResponseEntity.ok(ApiSuccessResponse.of(userInfo));
    }

    @Operation(summary = "로그아웃", description = "로그아웃 처리. JWT는 stateless이므로 클라이언트에서 토큰을 삭제하면 됩니다.", security = @SecurityRequirement(name = "bearerAuth"))
    @ApiResponse(responseCode = "200", description = "로그아웃 성공")
    @PostMapping("/logout")
    public ResponseEntity<ApiSuccessResponse<Void>> logout() {
        log.info("User logout request");

        // JWT는 stateless이므로 서버에서 별도 처리 없음
        // 클라이언트에서 토큰을 삭제하면 됨

        return ResponseEntity.ok(ApiSuccessResponse.of("로그아웃되었습니다", null));
    }
}
