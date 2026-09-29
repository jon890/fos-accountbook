package com.bifos.accountbook.config;

import java.util.List;
import lombok.Getter;
import org.springframework.boot.context.properties.ConfigurationProperties;

/**
 * CORS 설정을 application.yml에서 관리하기 위한 Properties 클래스
 *
 * 모든 기본값은 application.yml에서 관리됩니다.
 * Immutable하게 관리되며, 애플리케이션 시작 시 한 번만 바인딩됩니다.
 */
@Getter
@ConfigurationProperties(prefix = "cors")
public class CorsProperties {

  /**
   * 허용할 Origin 목록
   * 예: http://localhost:3000, https://your-domain.vercel.app
   */
  private final List<String> allowedOrigins;

  /**
   * 허용할 HTTP 메서드
   */
  private final List<String> allowedMethods;

  /**
   * 허용할 헤더
   */
  private final List<String> allowedHeaders;

  /**
   * 노출할 헤더
   */
  private final List<String> exposedHeaders;

  /**
   * 자격 증명 허용 여부 (쿠키 포함)
   */
  private final boolean allowCredentials;

  /**
   * preflight 요청 캐싱 시간 (초)
   */
  private final long maxAge;

  /**
   * Constructor Binding을 통한 Immutable 객체 생성
   * Spring Boot 3.x에서는 생성자가 하나만 있으면 자동으로 Constructor Binding이 적용됩니다.
   *
   * @param allowedOrigins 허용할 Origin 목록 (application.yml에서 주입)
   * @param allowedMethods 허용할 HTTP 메서드 (application.yml에서 주입)
   * @param allowedHeaders 허용할 헤더 (application.yml에서 주입)
   * @param exposedHeaders 노출할 헤더 (application.yml에서 주입)
   * @param allowCredentials 자격 증명 허용 여부 (application.yml에서 주입)
   * @param maxAge preflight 캐싱 시간 (application.yml에서 주입)
   */
  public CorsProperties(
      List<String> allowedOrigins,
      List<String> allowedMethods,
      List<String> allowedHeaders,
      List<String> exposedHeaders,
      boolean allowCredentials,
      long maxAge
  ) {
    this.allowedOrigins = allowedOrigins;
    this.allowedMethods = allowedMethods;
    this.allowedHeaders = allowedHeaders;
    this.exposedHeaders = exposedHeaders;
    this.allowCredentials = allowCredentials;
    this.maxAge = maxAge;
  }
}

