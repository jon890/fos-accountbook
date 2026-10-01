package com.bifos.accountbook.config;

import com.bifos.accountbook.shared.filter.RequestResponseLoggingFilter;
import com.bifos.accountbook.config.security.ApiTokenAuthenticationFilter;
import com.bifos.accountbook.config.security.JwtAuthenticationFilter;
import com.bifos.accountbook.shared.dto.ApiErrorResponse;
import com.bifos.accountbook.shared.exception.ErrorCode;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.security.web.context.SecurityContextHolderFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;
import tools.jackson.databind.json.JsonMapper;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity
@RequiredArgsConstructor
public class SecurityConfig {

  private final JwtAuthenticationFilter jwtAuthenticationFilter;
  private final ApiTokenAuthenticationFilter apiTokenAuthenticationFilter;
  private final CorsProperties corsProperties;
  private final RequestResponseLoggingFilter requestResponseLoggingFilter;
  private final JsonMapper jsonMapper;

  @Bean
  public SecurityFilterChain filterChain(HttpSecurity http) {
    http
        // CSRF 비활성화 (JWT 사용)
        .csrf(AbstractHttpConfigurer::disable)

        // CORS 설정
        .cors(cors -> cors.configurationSource(corsConfigurationSource()))

        // 세션 사용하지 않음 (JWT 사용)
        .sessionManagement(session -> session
            .sessionCreationPolicy(SessionCreationPolicy.STATELESS))

        .exceptionHandling(exception -> exception
            .authenticationEntryPoint((request, response, authenticationException) ->
                writeInvalidTokenResponse(request.getRequestURI(), response)))

        // 요청에 대한 인증/인가 설정
        .authorizeHttpRequests(auth -> auth
            // Public endpoints (Actuator)
            .requestMatchers("/actuator/**").permitAll()

            // Public API endpoints
            .requestMatchers(HttpMethod.POST, "/api/v1/auth/**").permitAll()
            .requestMatchers(HttpMethod.GET, "/api/v1/invitations/token/**").permitAll() // 초대장 조회
            .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()

            // Swagger UI 및 OpenAPI 문서
            .requestMatchers(
                "/v3/api-docs/**",
                "/swagger-ui/**",
                "/swagger-ui.html",
                "/swagger-resources/**",
                "/webjars/**")
            .permitAll()
            .anyRequest().authenticated())
        .addFilterBefore(requestResponseLoggingFilter, SecurityContextHolderFilter.class)
        .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class)
        .addFilterBefore(apiTokenAuthenticationFilter, JwtAuthenticationFilter.class);

    return http.build();
  }

  private void writeInvalidTokenResponse(String requestUri, jakarta.servlet.http.HttpServletResponse response)
      throws IOException {
    response.setStatus(ErrorCode.INVALID_TOKEN.getStatusCode());
    response.setContentType(MediaType.APPLICATION_JSON_VALUE + ";charset=" + StandardCharsets.UTF_8.name());
    response.getWriter().write(
        jsonMapper.writeValueAsString(ApiErrorResponse.of(ErrorCode.INVALID_TOKEN, requestUri)));
  }

  @Bean
  public CorsConfigurationSource corsConfigurationSource() {
    CorsConfiguration configuration = new CorsConfiguration();

    // application.yml에서 CORS 설정 읽기
    configuration.setAllowedOrigins(corsProperties.getAllowedOrigins());
    configuration.setAllowedMethods(corsProperties.getAllowedMethods());
    configuration.setAllowedHeaders(corsProperties.getAllowedHeaders());
    configuration.setExposedHeaders(corsProperties.getExposedHeaders());
    configuration.setAllowCredentials(corsProperties.isAllowCredentials());
    configuration.setMaxAge(corsProperties.getMaxAge());

    UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
    source.registerCorsConfiguration("/**", configuration);

    return source;
  }

  @Bean
  public PasswordEncoder passwordEncoder() {
    return new BCryptPasswordEncoder();
  }
}
