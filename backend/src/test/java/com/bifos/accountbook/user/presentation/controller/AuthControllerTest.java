package com.bifos.accountbook.user.presentation.controller;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.bifos.accountbook.config.security.JwtProperties;
import com.bifos.accountbook.config.security.SocialLoginAssertionVerifier;
import com.bifos.accountbook.shared.AbstractControllerTest;
import com.bifos.accountbook.user.presentation.dto.SocialLoginRequest;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import java.nio.charset.StandardCharsets;
import java.util.Date;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;

@DisplayName("인증 컨트롤러 통합 테스트")
class AuthControllerTest extends AbstractControllerTest {

  private static final String SOCIAL_LOGIN_URL = "/api/v1/auth/social-login";

  @Autowired
  private JwtProperties jwtProperties;

  private final SocialLoginRequest request =
      new SocialLoginRequest("google", "google-123", "user@example.com", "사용자", null);

  private String assertionFor(String subject, String email) {
    long now = System.currentTimeMillis();
    return Jwts.builder()
               .audience().add(SocialLoginAssertionVerifier.AUDIENCE).and()
               .subject(subject)
               .claim("email", email)
               .issuedAt(new Date(now))
               .expiration(new Date(now + 60_000))
               .signWith(Keys.hmacShaKeyFor(jwtProperties.getSecret().getBytes(StandardCharsets.UTF_8)),
                         Jwts.SIG.HS256)
               .compact();
  }

  @Test
  @DisplayName("소셜 로그인 - 서명이 맞으면 토큰을 발급한다")
  void socialLogin_Success_WithValidAssertion() throws Exception {
    mockMvc.perform(post(SOCIAL_LOGIN_URL)
                        .contentType(MediaType.APPLICATION_JSON)
                        .header(SocialLoginAssertionVerifier.HEADER, assertionFor("google:google-123", "user@example.com"))
                        .content(objectMapper.writeValueAsString(request)))
           .andExpect(status().isOk())
           .andExpect(jsonPath("$.data.accessToken").isNotEmpty());
  }

  @Test
  @DisplayName("소셜 로그인 - 서명이 없으면 401")
  void socialLogin_Unauthorized_WithoutAssertion() throws Exception {
    mockMvc.perform(post(SOCIAL_LOGIN_URL)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
           .andExpect(status().isUnauthorized());
  }

  @Test
  @DisplayName("소셜 로그인 - 다른 사용자의 서명을 재사용하면 401")
  void socialLogin_Unauthorized_WithAssertionForOtherUser() throws Exception {
    mockMvc.perform(post(SOCIAL_LOGIN_URL)
                        .contentType(MediaType.APPLICATION_JSON)
                        .header(SocialLoginAssertionVerifier.HEADER, assertionFor("google:someone-else", "user@example.com"))
                        .content(objectMapper.writeValueAsString(request)))
           .andExpect(status().isUnauthorized());
  }

  @Test
  @DisplayName("로그인 서명을 access token 으로 쓰면 인증되지 않는다")
  void assertion_IsNotAcceptedAsAccessToken() throws Exception {
    mockMvc.perform(org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get("/api/v1/families")
                        .header("Authorization", "Bearer " + assertionFor("google:google-123", "user@example.com")))
           .andExpect(status().is4xxClientError());
  }
}
