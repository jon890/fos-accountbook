package com.bifos.accountbook.infra.config;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.List;

/**
 * CORS 설정을 application.yml에서 관리하기 위한 Properties 클래스
 */
@Getter
@Setter
@Component
@ConfigurationProperties(prefix = "cors")
public class CorsProperties {

    /**
     * 허용할 Origin 목록
     * 예: http://localhost:3000, https://your-domain.vercel.app
     */
    private List<String> allowedOrigins = new ArrayList<>();

    /**
     * 허용할 HTTP 메서드
     */
    private List<String> allowedMethods = List.of("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS");

    /**
     * 허용할 헤더
     */
    private List<String> allowedHeaders = List.of("Authorization", "Content-Type", "X-Requested-With", "Accept", "Origin");

    /**
     * 노출할 헤더
     */
    private List<String> exposedHeaders = List.of("Authorization");

    /**
     * 자격 증명 허용 여부 (쿠키 포함)
     */
    private boolean allowCredentials = true;

    /**
     * preflight 요청 캐싱 시간 (초)
     */
    private long maxAge = 3600L;
}

