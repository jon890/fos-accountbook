package com.bifos.accountbook.presentation.controller;

import com.bifos.accountbook.application.dto.UpdateUserProfileRequest;
import com.bifos.accountbook.application.dto.UserProfileResponse;
import com.bifos.accountbook.application.service.UserProfileService;
import com.bifos.accountbook.domain.value.CustomUuid;
import com.bifos.accountbook.infra.security.dto.LoginUserDto;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;

import java.time.LocalDateTime;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.BDDMockito.given;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultHandlers.print;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * UserProfileController 테스트
 */
@WebMvcTest(UserProfileController.class)
@DisplayName("사용자 프로필 컨트롤러 테스트")
class UserProfileControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private UserProfileService userProfileService;

    private static final String TEST_USER_UUID = "test-user-uuid-1234";
    private static final String API_BASE_URL = "/api/users/me/profile";

    @Test
    @DisplayName("내 프로필 조회 - 성공")
    @WithMockUser
    void getMyProfile_Success() throws Exception {
        // Given
        CustomUuid userUuid = CustomUuid.of(TEST_USER_UUID);
        LoginUserDto loginUser = createLoginUserDto(userUuid);

        UserProfileResponse profileResponse = UserProfileResponse.builder()
                .userUuid(TEST_USER_UUID)
                .timezone("Asia/Seoul")
                .language("ko")
                .currency("KRW")
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build();

        given(userProfileService.getOrCreateProfile(any(CustomUuid.class)))
                .willReturn(profileResponse);

        // When & Then
        mockMvc.perform(get(API_BASE_URL)
                        .with(user(loginUser))
                        .contentType(MediaType.APPLICATION_JSON))
                .andDo(print())
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.message").value("프로필을 조회했습니다"))
                .andExpect(jsonPath("$.data.userUuid").value(TEST_USER_UUID))
                .andExpect(jsonPath("$.data.timezone").value("Asia/Seoul"))
                .andExpect(jsonPath("$.data.language").value("ko"))
                .andExpect(jsonPath("$.data.currency").value("KRW"));
    }

    @Test
    @DisplayName("내 프로필 수정 - 성공 (모든 필드)")
    @WithMockUser
    void updateMyProfile_Success_AllFields() throws Exception {
        // Given
        CustomUuid userUuid = CustomUuid.of(TEST_USER_UUID);
        LoginUserDto loginUser = createLoginUserDto(userUuid);

        UpdateUserProfileRequest request = UpdateUserProfileRequest.builder()
                .timezone("America/New_York")
                .language("en")
                .currency("USD")
                .build();

        UserProfileResponse profileResponse = UserProfileResponse.builder()
                .userUuid(TEST_USER_UUID)
                .timezone("America/New_York")
                .language("en")
                .currency("USD")
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build();

        given(userProfileService.updateProfile(any(CustomUuid.class), any(UpdateUserProfileRequest.class)))
                .willReturn(profileResponse);

        // When & Then
        mockMvc.perform(put(API_BASE_URL)
                        .with(user(loginUser))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andDo(print())
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.message").value("프로필이 수정되었습니다"))
                .andExpect(jsonPath("$.data.timezone").value("America/New_York"))
                .andExpect(jsonPath("$.data.language").value("en"))
                .andExpect(jsonPath("$.data.currency").value("USD"));
    }

    @Test
    @DisplayName("내 프로필 수정 - 성공 (부분 업데이트)")
    @WithMockUser
    void updateMyProfile_Success_PartialUpdate() throws Exception {
        // Given
        CustomUuid userUuid = CustomUuid.of(TEST_USER_UUID);
        LoginUserDto loginUser = createLoginUserDto(userUuid);

        UpdateUserProfileRequest request = UpdateUserProfileRequest.builder()
                .timezone("UTC")
                .build();

        UserProfileResponse profileResponse = UserProfileResponse.builder()
                .userUuid(TEST_USER_UUID)
                .timezone("UTC")
                .language("ko")
                .currency("KRW")
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build();

        given(userProfileService.updateProfile(any(CustomUuid.class), any(UpdateUserProfileRequest.class)))
                .willReturn(profileResponse);

        // When & Then
        mockMvc.perform(put(API_BASE_URL)
                        .with(user(loginUser))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andDo(print())
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.timezone").value("UTC"))
                .andExpect(jsonPath("$.data.language").value("ko"))
                .andExpect(jsonPath("$.data.currency").value("KRW"));
    }

    @Test
    @DisplayName("내 프로필 수정 - 실패 (잘못된 시간대 형식)")
    @WithMockUser
    void updateMyProfile_Fail_InvalidTimezone() throws Exception {
        // Given
        CustomUuid userUuid = CustomUuid.of(TEST_USER_UUID);
        LoginUserDto loginUser = createLoginUserDto(userUuid);

        UpdateUserProfileRequest request = UpdateUserProfileRequest.builder()
                .timezone("Invalid@Timezone#123")
                .build();

        // When & Then
        mockMvc.perform(put(API_BASE_URL)
                        .with(user(loginUser))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andDo(print())
                .andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("내 프로필 수정 - 실패 (잘못된 언어 코드)")
    @WithMockUser
    void updateMyProfile_Fail_InvalidLanguage() throws Exception {
        // Given
        CustomUuid userUuid = CustomUuid.of(TEST_USER_UUID);
        LoginUserDto loginUser = createLoginUserDto(userUuid);

        UpdateUserProfileRequest request = UpdateUserProfileRequest.builder()
                .language("korean")
                .build();

        // When & Then
        mockMvc.perform(put(API_BASE_URL)
                        .with(user(loginUser))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andDo(print())
                .andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("내 프로필 수정 - 실패 (잘못된 통화 코드)")
    @WithMockUser
    void updateMyProfile_Fail_InvalidCurrency() throws Exception {
        // Given
        CustomUuid userUuid = CustomUuid.of(TEST_USER_UUID);
        LoginUserDto loginUser = createLoginUserDto(userUuid);

        UpdateUserProfileRequest request = UpdateUserProfileRequest.builder()
                .currency("won")
                .build();

        // When & Then
        mockMvc.perform(put(API_BASE_URL)
                        .with(user(loginUser))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andDo(print())
                .andExpect(status().isBadRequest());
    }

    /**
     * 테스트용 LoginUserDto 생성
     */
    private LoginUserDto createLoginUserDto(CustomUuid userUuid) {
        return LoginUserDto.builder()
                .userUuid(userUuid)
                .email("test@example.com")
                .name("테스트 사용자")
                .build();
    }
}

