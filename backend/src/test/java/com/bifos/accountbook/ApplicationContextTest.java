package com.bifos.accountbook;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;

/**
 * Spring Application Context 초기화 테스트
 * 
 * 이 테스트는 Spring Boot 애플리케이션 컨텍스트가 정상적으로 로드되는지 확인합니다.
 * - Bean 설정 오류
 * - 의존성 주입 오류
 * - 설정 파일 오류
 * 등의 문제를 조기에 발견할 수 있습니다.
 */
@SpringBootTest
@ActiveProfiles("test")
class ApplicationContextTest {

    /**
     * Spring Context가 정상적으로 로드되는지 확인
     */
    @Test
    void contextLoads() {
        // 이 테스트가 통과하면 Spring Context가 정상적으로 로드된 것입니다.
    }
}

