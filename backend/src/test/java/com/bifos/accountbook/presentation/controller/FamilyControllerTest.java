package com.bifos.accountbook.presentation.controller;

import com.bifos.accountbook.application.dto.family.CreateFamilyRequest;
import com.bifos.accountbook.common.AbstractControllerTest;
import com.bifos.accountbook.domain.entity.User;
import com.bifos.accountbook.domain.entity.UserProfile;
import com.bifos.accountbook.domain.repository.UserProfileRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultHandlers.print;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@DisplayName("가족 컨트롤러 통합 테스트")
class FamilyControllerTest extends AbstractControllerTest {

    @Autowired
    private UserProfileRepository userProfileRepository;

    private static final String API_BASE_URL = "/api/v1/families";

    @Test
    @DisplayName("가족 생성 - 성공 (첫 가족, 기본 가족으로 자동 설정)")
    void createFamily_success_firstFamily() throws Exception {
        // Given: TestFixtures로 유저 생성
        User testUser = fixtures.getDefaultUser();
        
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
        // Given: TestFixtures로 유저 생성
        User testUser = fixtures.getDefaultUser();
        
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
        // Given: TestFixtures로 유저 생성 (인증을 위해)
        fixtures.getDefaultUser();
        
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

