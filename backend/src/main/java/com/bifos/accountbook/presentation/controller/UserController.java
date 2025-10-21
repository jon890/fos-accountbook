package com.bifos.accountbook.presentation.controller;

import com.bifos.accountbook.application.service.UserService;
import com.bifos.accountbook.presentation.annotation.LoginUser;
import com.bifos.accountbook.presentation.dto.ApiSuccessResponse;
import com.bifos.accountbook.presentation.dto.LoginUserDto;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@Slf4j
@RestController
@RequestMapping("/users")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;

    /**
     * 사용자의 기본 가족 설정
     */
    @PutMapping("/me/default-family")
    public ResponseEntity<ApiSuccessResponse<Void>> setDefaultFamily(
            @LoginUser LoginUserDto loginUser,
            @RequestBody Map<String, String> request) {
        
        String familyUuid = request.get("familyUuid");
        if (familyUuid == null || familyUuid.isBlank()) {
            throw new IllegalArgumentException("familyUuid is required");
        }

        userService.setDefaultFamily(loginUser.getUserUuid(), familyUuid);

        return ResponseEntity.ok(ApiSuccessResponse.of("기본 가족이 설정되었습니다", null));
    }

    /**
     * 사용자의 기본 가족 조회
     */
    @GetMapping("/me/default-family")
    public ResponseEntity<ApiSuccessResponse<Map<String, String>>> getDefaultFamily(
            @LoginUser LoginUserDto loginUser) {
        
        String defaultFamilyUuid = userService.getDefaultFamily(loginUser.getUserUuid());
        
        Map<String, String> response = Map.of(
                "defaultFamilyUuid", defaultFamilyUuid != null ? defaultFamilyUuid : ""
        );

        return ResponseEntity.ok(ApiSuccessResponse.of(response));
    }
}

