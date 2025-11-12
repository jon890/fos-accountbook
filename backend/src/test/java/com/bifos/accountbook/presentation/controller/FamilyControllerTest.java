package com.bifos.accountbook.presentation.controller;

import com.bifos.accountbook.application.dto.family.CreateFamilyRequest;
import com.bifos.accountbook.common.FosSpringBootTest;
import com.bifos.accountbook.domain.entity.User;
import com.bifos.accountbook.domain.entity.UserProfile;
import com.bifos.accountbook.domain.repository.UserProfileRepository;
import com.bifos.accountbook.domain.repository.UserRepository;
import com.bifos.accountbook.domain.value.CustomUuid;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.test.web.servlet.MockMvc;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultHandlers.print;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@FosSpringBootTest
@AutoConfigureMockMvc
@DisplayName("가족 컨트롤러 통합 테스트")
class FamilyControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private UserProfileRepository userProfileRepository;

    @Autowired
    private ObjectMapper objectMapper;

    private User testUser;
    private static final String API_BASE_URL = "/api/v1/families";

    @BeforeEach
    void setUp() {
        SecurityContextHolder.clearContext();

        // 테스트 사용자 생성
        testUser = User.builder()
                .uuid(CustomUuid.from("a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d"))
                .provider("google")
                .providerId("google-123")
                .name("Test User")
                .email("test@example.com")
                .build();
        userRepository.save(testUser);

        // 인증 설정
        UsernamePasswordAuthenticationToken authentication = new UsernamePasswordAuthenticationToken(
                testUser.getUuid().getValue(), null, null);
        SecurityContextHolder.getContext().setAuthentication(authentication);
    }

    @Test
    @DisplayName("가족 생성 - 성공 (첫 가족, 기본 가족으로 자동 설정)")
    void createFamily_success_firstFamily() throws Exception {
        // Given
        CreateFamilyRequest request = CreateFamilyRequest.builder()
                .name("우리 가족")
                .build();

        // When & Then
        mockMvc.perform(post(API_BASE_URL)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andDo(print())
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.name").value("우리 가족"))
                .andExpect(jsonPath("$.data.memberCount").value(1));

        // 기본 가족으로 설정되었는지 확인
        UserProfile profile = userProfileRepository.findByUserUuid(testUser.getUuid())
                .orElseThrow();
        
        assertThat(profile.getDefaultFamilyUuid()).isNotNull();
        assertThat(profile.getDefaultFamilyUuid().getValue()).isNotBlank();
    }

    @Test
    @DisplayName("가족 생성 - 성공 (두 번째 가족, 기본 가족으로 자동 설정 안됨)")
    void createFamily_success_secondFamily() throws Exception {
        // Given: 첫 번째 가족 생성
        CreateFamilyRequest firstRequest = CreateFamilyRequest.builder()
                .name("첫 번째 가족")
                .build();

        mockMvc.perform(post(API_BASE_URL)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(firstRequest)))
                .andExpect(status().isCreated());

        // 첫 번째 가족의 UUID 가져오기
        UserProfile profileAfterFirst = userProfileRepository.findByUserUuid(testUser.getUuid())
                .orElseThrow();
        String firstFamilyUuid = profileAfterFirst.getDefaultFamilyUuid().getValue();

        // Given: 두 번째 가족 생성
        CreateFamilyRequest secondRequest = CreateFamilyRequest.builder()
                .name("두 번째 가족")
                .build();

        // When & Then
        mockMvc.perform(post(API_BASE_URL)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(secondRequest)))
                .andDo(print())
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.name").value("두 번째 가족"));

        // 기본 가족이 변경되지 않았는지 확인 (여전히 첫 번째 가족)
        UserProfile profileAfterSecond = userProfileRepository.findByUserUuid(testUser.getUuid())
                .orElseThrow();
        
        assertThat(profileAfterSecond.getDefaultFamilyUuid()).isNotNull();
        assertThat(profileAfterSecond.getDefaultFamilyUuid().getValue()).isEqualTo(firstFamilyUuid);
    }

    @Test
    @DisplayName("가족 생성 - 실패 (이름 누락)")
    void createFamily_fail_missingName() throws Exception {
        // Given
        CreateFamilyRequest request = CreateFamilyRequest.builder()
                .build();

        // When & Then
        mockMvc.perform(post(API_BASE_URL)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andDo(print())
                .andExpect(status().isBadRequest());
    }
}

