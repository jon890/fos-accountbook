package com.bifos.accountbook.apitoken.presentation.controller;

import com.bifos.accountbook.apitoken.application.dto.ApiTokenResponse;
import com.bifos.accountbook.apitoken.application.dto.CreateApiTokenRequest;
import com.bifos.accountbook.apitoken.application.dto.CreatedApiTokenResponse;
import com.bifos.accountbook.apitoken.application.service.ApiTokenService;
import com.bifos.accountbook.shared.auth.LoginUser;
import com.bifos.accountbook.shared.auth.LoginUserDto;
import com.bifos.accountbook.shared.dto.ApiSuccessResponse;
import com.bifos.accountbook.shared.value.CustomUuid;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@Tag(name = "연동 토큰 (ApiToken)", description = "외부 도구가 쓰는 연동 토큰 발급, 조회, 폐기 API")
@RestController
@RequestMapping("/api/v1/users/me/api-tokens")
@RequiredArgsConstructor
@SecurityRequirement(name = "bearerAuth")
public class ApiTokenController {

  private final ApiTokenService apiTokenService;

  @Operation(summary = "연동 토큰 발급", description = "연동 토큰을 발급합니다. 원문은 이 응답에서만 볼 수 있습니다.")
  @ApiResponse(responseCode = "201", description = "발급 성공")
  @ApiResponse(responseCode = "400", description = "이름이 올바르지 않거나 발급 한도를 넘음")
  @PostMapping
  public ResponseEntity<ApiSuccessResponse<CreatedApiTokenResponse>> issue(
      @LoginUser LoginUserDto user, @Valid @RequestBody CreateApiTokenRequest request) {
    CreatedApiTokenResponse response = apiTokenService.issue(user.userUuid(), request);
    return ResponseEntity.status(HttpStatus.CREATED)
        .body(ApiSuccessResponse.of("연동 토큰을 발급했습니다", response));
  }

  @Operation(summary = "연동 토큰 목록 조회", description = "사용 중인 연동 토큰을 최근 발급 순으로 조회합니다.")
  @ApiResponse(responseCode = "200", description = "조회 성공")
  @GetMapping
  public ResponseEntity<ApiSuccessResponse<List<ApiTokenResponse>>> list(
      @LoginUser LoginUserDto user) {
    List<ApiTokenResponse> response = apiTokenService.list(user.userUuid());
    return ResponseEntity.ok(ApiSuccessResponse.of("연동 토큰 목록을 조회했습니다", response));
  }

  @Operation(summary = "연동 토큰 폐기", description = "연동 토큰을 폐기합니다.")
  @ApiResponse(responseCode = "200", description = "폐기 성공")
  @ApiResponse(responseCode = "404", description = "연동 토큰을 찾을 수 없음")
  @DeleteMapping("/{tokenUuid}")
  public ResponseEntity<ApiSuccessResponse<Void>> revoke(
      @LoginUser LoginUserDto user,
      @Parameter(description = "연동 토큰 UUID") @PathVariable CustomUuid tokenUuid) {
    apiTokenService.revoke(user.userUuid(), tokenUuid);
    return ResponseEntity.ok(ApiSuccessResponse.of("연동 토큰을 폐기했습니다"));
  }
}
