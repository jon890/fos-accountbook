package com.bifos.accountbook.presentation.controller;

import com.bifos.accountbook.application.dto.profile.UpdateUserProfileRequest;
import com.bifos.accountbook.application.dto.profile.UserProfileResponse;
import com.bifos.accountbook.application.service.UserProfileService;
import com.bifos.accountbook.presentation.annotation.LoginUser;
import com.bifos.accountbook.presentation.dto.ApiSuccessResponse;
import com.bifos.accountbook.presentation.dto.LoginUserDto;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

/**
 * 사용자 프로필 컨트롤러
 */
@RestController
@RequestMapping("/api/v1/users/me/profile")
@RequiredArgsConstructor
public class UserProfileController {

    private final UserProfileService userProfileService;

    /**
     * 내 프로필 조회
     */
    @GetMapping
    public ResponseEntity<ApiSuccessResponse<UserProfileResponse>> getMyProfile(
            @LoginUser LoginUserDto user) {
        UserProfileResponse profile = userProfileService.getOrCreateProfile(user.getUserUuid());
        return ResponseEntity.ok(ApiSuccessResponse.of("프로필을 조회했습니다", profile));
    }

    /**
     * 내 프로필 수정
     */
    @PutMapping
    public ResponseEntity<ApiSuccessResponse<UserProfileResponse>> updateMyProfile(
            @LoginUser LoginUserDto user,
            @Valid @RequestBody UpdateUserProfileRequest request) {
        UserProfileResponse profile = userProfileService.updateProfile(user.getUserUuid(), request);
        return ResponseEntity.ok(ApiSuccessResponse.of("프로필이 수정되었습니다", profile));
    }
}

