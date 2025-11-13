package com.bifos.accountbook.config;

import com.bifos.accountbook.infra.filter.RequestResponseLoggingFilter;
import com.bifos.accountbook.infra.security.JwtAuthenticationFilter;
import com.bifos.accountbook.infra.security.NextAuthTokenFilter;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
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

@Configuration
@EnableWebSecurity
@EnableMethodSecurity
@RequiredArgsConstructor
public class SecurityConfig {

  private final JwtAuthenticationFilter jwtAuthenticationFilter;
  private final NextAuthTokenFilter nextAuthTokenFilter;
  private final CorsProperties corsProperties;
  private final RequestResponseLoggingFilter requestResponseLoggingFilter;

  @Bean
  public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
    http
        // CSRF 비활성화 (JWT 사용)
        .csrf(AbstractHttpConfigurer::disable)

        // CORS 설정
        .cors(cors -> cors.configurationSource(corsConfigurationSource()))

        // 세션 사용하지 않음 (JWT 사용)
        .sessionManagement(session -> session
            .sessionCreationPolicy(SessionCreationPolicy.STATELESS))

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

            // 나머지 요청은 인증 필요
            .anyRequest().authenticated())

        // 로깅 필터 추가 (가장 먼저 실행)
        .addFilterBefore(requestResponseLoggingFilter, SecurityContextHolderFilter.class)
        // NextAuth 세션 필터 추가 (JWT 필터보다 먼저 실행)
        .addFilterBefore(nextAuthTokenFilter, UsernamePasswordAuthenticationFilter.class)
        // JWT 필터 추가
        .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class);

    return http.build();
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

