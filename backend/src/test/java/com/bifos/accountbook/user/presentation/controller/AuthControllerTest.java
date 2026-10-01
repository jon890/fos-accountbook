package com.bifos.accountbook.user.presentation.controller;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;
import com.bifos.accountbook.config.security.JwtProperties;
import com.bifos.accountbook.config.security.JwtTokenProvider;
import com.bifos.accountbook.config.security.SocialLoginAssertionVerifier;
import com.bifos.accountbook.shared.AbstractControllerTest;
import com.bifos.accountbook.user.domain.entity.User;
import com.bifos.accountbook.user.presentation.dto.SocialLoginRequest;
import io.jsonwebtoken.Jwts;
import java.nio.charset.StandardCharsets;
import java.util.Date;
import java.util.Map;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;
import org.springframework.security.authentication.InsufficientAuthenticationException;
import org.springframework.security.web.AuthenticationEntryPoint;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.access.ExceptionTranslationFilter;

@DisplayName("인증 컨트롤러 통합 테스트")
class AuthControllerTest extends AbstractControllerTest {

  private static final String SOCIAL_LOGIN_URL = "/api/v1/auth/social-login";

  @Autowired
  private JwtProperties jwtProperties;

  @Autowired
  private JwtTokenProvider jwtTokenProvider;

  @Autowired
  private SecurityFilterChain securityFilterChain;

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
               .signWith(SocialLoginAssertionVerifier.deriveKey(jwtProperties.getSecret()), Jwts.SIG.HS256)
               .compact();
  }

  private String refreshRequest(String refreshToken) throws Exception {
    return objectMapper.writeValueAsString(Map.of("refreshToken", refreshToken));
  }

  private AuthenticationEntryPoint authenticationEntryPoint() {
    return securityFilterChain.getFilters()
                              .stream()
                              .filter(ExceptionTranslationFilter.class::isInstance)
                              .map(ExceptionTranslationFilter.class::cast)
                              .findFirst()
                              .orElseThrow(() -> new AssertionError("ExceptionTranslationFilter가 없다"))
                              .getAuthenticationEntryPoint();
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
    mockMvc.perform(get("/api/v1/families")
                        .header("Authorization", "Bearer " + assertionFor("google:google-123", "user@example.com")))
           .andExpect(status().isUnauthorized())
           .andExpect(jsonPath("$.code").value("A002"));
  }

  @Test
  @DisplayName("refresh token으로 토큰을 갱신하면 새 토큰을 발급한다")
  void refreshToken_Success_WithRefreshToken() throws Exception {
    User user = fixtures.users.user().build();
    String refreshToken = jwtTokenProvider.generateRefreshToken(user);

    mockMvc.perform(post("/api/v1/auth/refresh")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(refreshRequest(refreshToken)))
           .andExpect(status().isOk())
           .andExpect(jsonPath("$.data.accessToken").isNotEmpty())
           .andExpect(jsonPath("$.data.refreshToken").isNotEmpty());
  }

  @Test
  @DisplayName("access token으로 토큰을 갱신하면 401 A002를 반환한다")
  void refreshToken_Unauthorized_WithAccessToken() throws Exception {
    User user = fixtures.users.user().build();
    String accessToken = jwtTokenProvider.generateToken(user).getToken();

    mockMvc.perform(post("/api/v1/auth/refresh")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(refreshRequest(accessToken)))
           .andExpect(status().isUnauthorized())
           .andExpect(jsonPath("$.code").value("A002"));
  }

  @Test
  @DisplayName("refresh token으로 보호 경로를 호출하면 401 A002를 반환한다")
  void protectedResource_Unauthorized_WithRefreshToken() throws Exception {
    User user = fixtures.users.user().build();
    String refreshToken = jwtTokenProvider.generateRefreshToken(user);

    mockMvc.perform(get("/api/v1/families")
                        .header("Authorization", "Bearer " + refreshToken))
           .andExpect(status().isUnauthorized())
           .andExpect(jsonPath("$.code").value("A002"));
  }

  @Test
  @DisplayName("인증 정보 없이 보호 경로를 호출하면 401 A002를 반환한다")
  void protectedResource_Unauthorized_WithoutToken() throws Exception {
    mockMvc.perform(get("/api/v1/families"))
           .andExpect(status().isUnauthorized())
           .andExpect(jsonPath("$.code").value("A002"));
  }

  @Test
  @DisplayName("잘못된 JWT로 보호 경로를 호출하면 401 A002를 반환한다")
  void protectedResource_Unauthorized_WithInvalidToken() throws Exception {
    mockMvc.perform(get("/api/v1/families")
                        .header("Authorization", "Bearer invalid.jwt.token"))
           .andExpect(status().isUnauthorized())
           .andExpect(jsonPath("$.code").value("A002"));
  }

  @Test
  @DisplayName("인증 실패 응답은 UTF-8 JSON 형식의 401 A002를 반환한다")
  void authenticationEntryPoint_WritesUtf8InvalidTokenResponse() throws Exception {
    MockHttpServletRequest request = new MockHttpServletRequest("GET", "/api/v1/families");
    MockHttpServletResponse response = new MockHttpServletResponse();

    authenticationEntryPoint().commence(
        request, response, new InsufficientAuthenticationException("인증 정보가 없습니다"));

    String body = new String(response.getContentAsByteArray(), StandardCharsets.UTF_8);

    assertThat(response.getStatus()).isEqualTo(401);
    assertThat(response.getCharacterEncoding()).isEqualTo(StandardCharsets.UTF_8.name());
    assertThat(objectMapper.readTree(body).get("code").asText()).isEqualTo("A002");
    assertThat(body).contains("유효하지 않은 토큰입니다");
  }
}
