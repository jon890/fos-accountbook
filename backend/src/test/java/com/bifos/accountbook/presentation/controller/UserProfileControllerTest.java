package com.bifos.accountbook.presentation.controller;

import com.bifos.accountbook.application.dto.profile.UpdateUserProfileRequest;
import com.bifos.accountbook.common.DatabaseCleanupExtension;
import com.bifos.accountbook.domain.entity.User;
import com.bifos.accountbook.domain.entity.UserProfile;
import com.bifos.accountbook.domain.repository.UserProfileRepository;
import com.bifos.accountbook.domain.repository.UserRepository;
import com.bifos.accountbook.domain.value.CustomUuid;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.test.web.servlet.MockMvc;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultHandlers.print;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * UserProfileController 통합 테스트
 * @SpringBootTest + DatabaseCleanupExtension을 사용하여 실제 DB와 함께 테스트
 * 외부 API만 모킹하고, 내부 컴포넌트는 모두 실제로 동작
 * 각 테스트 메서드 실행 후 DatabaseCleanupExtension이 자동으로 데이터 정리
 */
@SpringBootTest
@AutoConfigureMockMvc
@ExtendWith(DatabaseCleanupExtension.class)
@DisplayName("사용자 프로필 컨트롤러 통합 테스트")
class UserProfileControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private UserProfileRepository userProfileRepository;

    private User testUser;
    private static final String API_BASE_URL = "/api/v1/users/me/profile";

    @BeforeEach
    void setUp() {
        SecurityContextHolder.clearContext();

        // 테스트 사용자 생성
        testUser = User.builder()
                .uuid(CustomUuid.generate())
                .provider("google")
                .providerId("test-provider-id-" + System.currentTimeMillis())
                .email("test@example.com")
                .name("테스트 사용자")
                .build();
        testUser = userRepository.save(testUser);
    }

    /**
     * 인증된 사용자 컨텍스트 설정
     */
    private void setAuthentication() {
        SecurityContextHolder.getContext().setAuthentication(
            new UsernamePasswordAuthenticationToken(testUser.getUuid().getValue(), null, null)
        );
    }

    @Test
    @DisplayName("내 프로필 조회 - 성공 (기존 프로필)")
    void getMyProfile_Success_ExistingProfile() throws Exception {
        // Given
        setAuthentication();

        // 프로필 미리 생성
        UserProfile profile = UserProfile.builder()
                .userUuid(testUser.getUuid())
                .timezone("Asia/Seoul")
                .language("ko")
                .currency("KRW")
                .build();
        userProfileRepository.save(profile);

        // When & Then
        mockMvc.perform(get(API_BASE_URL)
                        .contentType(MediaType.APPLICATION_JSON))
                .andDo(print())
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.message").value("프로필을 조회했습니다"))
                .andExpect(jsonPath("$.data.userUuid").value(testUser.getUuid().getValue()))
                .andExpect(jsonPath("$.data.timezone").value("Asia/Seoul"))
                .andExpect(jsonPath("$.data.language").value("ko"))
                .andExpect(jsonPath("$.data.currency").value("KRW"));

        // DB 확인
        UserProfile savedProfile = userProfileRepository.findByUserUuid(testUser.getUuid()).orElseThrow();
        assertThat(savedProfile.getTimezone()).isEqualTo("Asia/Seoul");
        assertThat(savedProfile.getLanguage()).isEqualTo("ko");
        assertThat(savedProfile.getCurrency()).isEqualTo("KRW");
    }

    @Test
    @DisplayName("내 프로필 조회 - 성공 (신규 프로필 자동 생성)")
    void getMyProfile_Success_CreateNewProfile() throws Exception {
        // Given
        setAuthentication();
        // 프로필이 없는 상태

        // When & Then
        mockMvc.perform(get(API_BASE_URL)
                        .contentType(MediaType.APPLICATION_JSON))
                .andDo(print())
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.message").value("프로필을 조회했습니다"))
                .andExpect(jsonPath("$.data.userUuid").value(testUser.getUuid().getValue()))
                .andExpect(jsonPath("$.data.timezone").value("Asia/Seoul"))
                .andExpect(jsonPath("$.data.language").value("ko"))
                .andExpect(jsonPath("$.data.currency").value("KRW"));

        // DB에 프로필이 생성되었는지 확인
        UserProfile createdProfile = userProfileRepository.findByUserUuid(testUser.getUuid()).orElseThrow();
        assertThat(createdProfile).isNotNull();
        assertThat(createdProfile.getTimezone()).isEqualTo("Asia/Seoul");
        assertThat(createdProfile.getLanguage()).isEqualTo("ko");
        assertThat(createdProfile.getCurrency()).isEqualTo("KRW");
    }

    @Test
    @DisplayName("내 프로필 수정 - 성공 (모든 필드)")
    void updateMyProfile_Success_AllFields() throws Exception {
        // Given
        setAuthentication();

        // 프로필 미리 생성
        UserProfile profile = UserProfile.builder()
                .userUuid(testUser.getUuid())
                .timezone("Asia/Seoul")
                .language("ko")
                .currency("KRW")
                .build();
        userProfileRepository.save(profile);

        UpdateUserProfileRequest request = UpdateUserProfileRequest.builder()
                .timezone("America/New_York")
                .language("en")
                .currency("USD")
                .build();

        // When & Then
        mockMvc.perform(put(API_BASE_URL)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andDo(print())
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.message").value("프로필이 수정되었습니다"))
                .andExpect(jsonPath("$.data.timezone").value("America/New_York"))
                .andExpect(jsonPath("$.data.language").value("en"))
                .andExpect(jsonPath("$.data.currency").value("USD"));

        // DB에 실제로 저장되었는지 확인
        UserProfile updatedProfile = userProfileRepository.findByUserUuid(testUser.getUuid()).orElseThrow();
        assertThat(updatedProfile.getTimezone()).isEqualTo("America/New_York");
        assertThat(updatedProfile.getLanguage()).isEqualTo("en");
        assertThat(updatedProfile.getCurrency()).isEqualTo("USD");
    }

    @Test
    @DisplayName("내 프로필 수정 - 성공 (부분 업데이트)")
    void updateMyProfile_Success_PartialUpdate() throws Exception {
        // Given
        setAuthentication();

        // 프로필 미리 생성
        UserProfile profile = UserProfile.builder()
                .userUuid(testUser.getUuid())
                .timezone("Asia/Seoul")
                .language("ko")
                .currency("KRW")
                .build();
        userProfileRepository.save(profile);

        UpdateUserProfileRequest request = UpdateUserProfileRequest.builder()
                .timezone("UTC")
                .build();

        // When & Then
        mockMvc.perform(put(API_BASE_URL)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andDo(print())
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.timezone").value("UTC"))
                .andExpect(jsonPath("$.data.language").value("ko"))
                .andExpect(jsonPath("$.data.currency").value("KRW"));

        // DB 확인 - timezone만 변경되고 나머지는 유지
        UserProfile updatedProfile = userProfileRepository.findByUserUuid(testUser.getUuid()).orElseThrow();
        assertThat(updatedProfile.getTimezone()).isEqualTo("UTC");
        assertThat(updatedProfile.getLanguage()).isEqualTo("ko");
        assertThat(updatedProfile.getCurrency()).isEqualTo("KRW");
    }

    @Test
    @DisplayName("내 프로필 수정 - 실패 (잘못된 시간대 형식)")
    void updateMyProfile_Fail_InvalidTimezone() throws Exception {
        // Given
        setAuthentication();

        UpdateUserProfileRequest request = UpdateUserProfileRequest.builder()
                .timezone("Invalid@Timezone#123")
                .build();

        // When & Then
        mockMvc.perform(put(API_BASE_URL)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andDo(print())
                .andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("내 프로필 수정 - 실패 (잘못된 언어 코드)")
    void updateMyProfile_Fail_InvalidLanguage() throws Exception {
        // Given
        setAuthentication();

        UpdateUserProfileRequest request = UpdateUserProfileRequest.builder()
                .language("korean")
                .build();

        // When & Then
        mockMvc.perform(put(API_BASE_URL)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andDo(print())
                .andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("내 프로필 수정 - 실패 (잘못된 통화 코드)")
    void updateMyProfile_Fail_InvalidCurrency() throws Exception {
        // Given
        setAuthentication();

        UpdateUserProfileRequest request = UpdateUserProfileRequest.builder()
                .currency("won")
                .build();

        // When & Then
        mockMvc.perform(put(API_BASE_URL)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andDo(print())
                .andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("내 프로필 수정 - 실패 (프로필이 없는 경우)")
    void updateMyProfile_Fail_ProfileNotFound() throws Exception {
        // Given
        setAuthentication();
        // 프로필을 생성하지 않음

        UpdateUserProfileRequest request = UpdateUserProfileRequest.builder()
                .timezone("UTC")
                .build();

        // When & Then
        // IllegalArgumentException을 던지므로 4xx 또는 5xx 에러 예상
        mockMvc.perform(put(API_BASE_URL)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andDo(print())
                .andExpect(status().is4xxClientError());
    }
}
