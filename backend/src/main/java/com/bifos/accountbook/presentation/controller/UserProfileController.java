package com.bifos.accountbook.presentation.controller;

import com.bifos.accountbook.application.dto.profile.UpdateUserProfileRequest;
import com.bifos.accountbook.application.dto.profile.UserProfileResponse;
import com.bifos.accountbook.application.service.UserProfileService;
import com.bifos.accountbook.presentation.annotation.LoginUser;
import com.bifos.accountbook.presentation.dto.ApiSuccessResponse;
import com.bifos.accountbook.presentation.dto.LoginUserDto;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@Tag(name = "사용자 프로필 (UserProfile)", description = "사용자 프로필 관리 API")
@RestController
@RequestMapping("/api/v1/users/me/profile")
@RequiredArgsConstructor
@SecurityRequirement(name = "bearerAuth")
public class UserProfileController {

  private final UserProfileService userProfileService;

  @Operation(summary = "내 프로필 조회", description = "로그인한 사용자의 프로필을 조회합니다.")
  @ApiResponse(responseCode = "200", description = "조회 성공")
  @GetMapping
  public ResponseEntity<ApiSuccessResponse<UserProfileResponse>> getMyProfile(@LoginUser LoginUserDto user) {
    UserProfileResponse profile = userProfileService.getOrCreateProfile(user.userUuid());
    return ResponseEntity.ok(ApiSuccessResponse.of("프로필을 조회했습니다", profile));
  }

  @Operation(summary = "내 프로필 수정", description = "로그인한 사용자의 프로필을 수정합니다.")
  @ApiResponse(responseCode = "200", description = "수정 성공")
  @PutMapping
  public ResponseEntity<ApiSuccessResponse<UserProfileResponse>> updateMyProfile(@LoginUser LoginUserDto user,
                                                                                 @Valid @RequestBody UpdateUserProfileRequest request) {
    UserProfileResponse profile = userProfileService.updateProfile(user.userUuid(), request);
    return ResponseEntity.ok(ApiSuccessResponse.of("프로필이 수정되었습니다", profile));
  }
}

