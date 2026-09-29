package com.bifos.accountbook.config;

import io.swagger.v3.oas.models.Components;
import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Contact;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.info.License;
import io.swagger.v3.oas.models.security.SecurityRequirement;
import io.swagger.v3.oas.models.security.SecurityScheme;
import io.swagger.v3.oas.models.servers.Server;
import java.util.List;
import org.springdoc.core.customizers.QuerydslPredicateOperationCustomizer;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class OpenApiConfig {

  @Value("${server.servlet.context-path:/api/v1}")
  private String contextPath;

  @Bean
  public QuerydslPredicateOperationCustomizer querydslPredicateOperationCustomizer() {
    return null;
  }

  @Bean
  public OpenAPI openAPI() {
    return new OpenAPI()
        .info(apiInfo())
        .servers(List.of(
            new Server()
                .url("http://localhost:8080" + contextPath)
                .description("로컬 개발 서버"),
            new Server()
                .url("https://api.your-domain.com" + contextPath)
                .description("프로덕션 서버")
        ))
        .components(new Components()
                        .addSecuritySchemes("bearerAuth", securityScheme()))
        .addSecurityItem(new SecurityRequirement().addList("bearerAuth"));
  }

  private Info apiInfo() {
    return new Info()
        .title("FOS Accountbook API")
        .description("""
                         ## 우리집 가계부 API 문서

                         가족 단위 가계부 관리를 위한 RESTful API입니다.

                         ### 주요 기능
                         - 👤 **인증**: JWT 기반 회원가입 및 로그인
                         - 👨‍👩‍👧‍👦 **가족 관리**: 가족 생성, 조회, 수정, 삭제
                         - 📧 **초대**: 가족 구성원 초대 및 관리
                         - 📂 **카테고리**: 지출 카테고리 관리
                         - 💰 **지출**: 지출 내역 등록 및 조회

                         ### 인증 방법
                         1. `/auth/login` 또는 `/auth/register`로 로그인/회원가입
                         2. 응답으로 받은 `accessToken`을 복사
                         3. 우측 상단 **Authorize** 버튼 클릭
                         4. `Bearer {accessToken}` 형식으로 입력 (Bearer 자동 추가됨)

                         ### 에러 코드
                         - `400 Bad Request`: 잘못된 요청 파라미터
                         - `401 Unauthorized`: 인증 실패 또는 토큰 만료
                         - `403 Forbidden`: 권한 없음
                         - `404 Not Found`: 리소스를 찾을 수 없음
                         - `500 Internal Server Error`: 서버 오류
                         """)
        .version("1.0.0")
        .contact(new Contact()
                     .name("FOS Accountbook Team")
                     .email("support@example.com")
                     .url("https://github.com/yourusername/fos-accountbook"))
        .license(new License()
                     .name("Apache 2.0")
                     .url("https://www.apache.org/licenses/LICENSE-2.0"));
  }

  private SecurityScheme securityScheme() {
    return new SecurityScheme()
        .type(SecurityScheme.Type.HTTP)
        .scheme("bearer")
        .bearerFormat("JWT")
        .in(SecurityScheme.In.HEADER)
        .name("Authorization")
        .description("JWT 토큰을 입력하세요. 'Bearer ' 접두사는 자동으로 추가됩니다.");
  }
}

