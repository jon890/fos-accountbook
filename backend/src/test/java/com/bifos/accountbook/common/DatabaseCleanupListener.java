package com.bifos.accountbook.common;

import jakarta.persistence.EntityManager;
import lombok.extern.slf4j.Slf4j;
import org.springframework.test.context.TestContext;
import org.springframework.test.context.support.AbstractTestExecutionListener;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.TransactionStatus;
import org.springframework.transaction.support.DefaultTransactionDefinition;

import java.util.Arrays;
import java.util.List;

/**
 * 테스트 후 데이터베이스 정리 Listener (Spring TestExecutionListener 기반)
 * 
 * 사용법:
 * @TestExecutionListeners(
 *     value = DatabaseCleanupListener.class,
 *     mergeMode = TestExecutionListeners.MergeMode.MERGE_WITH_DEFAULTS
 * )
 * class MyTest {
 *     // 테스트 메서드들
 * }
 * 
 * 또는 @SpringBootTest에 자동으로 적용하려면:
 * spring.factories에 등록 (권장하지 않음, 명시적 사용 권장)
 * 
 * 장점:
 * - Spring 테스트 컨텍스트와 완전히 통합
 * - ApplicationContext 접근이 더 직접적이고 안정적
 * - Spring의 테스트 라이프사이클 활용
 * 
 * 주의: @Transactional과 함께 사용하면 롤백되므로, 
 * @Transactional 제거하고 이 Listener만 사용하세요.
 */
@Slf4j
public class DatabaseCleanupListener extends AbstractTestExecutionListener {
    
    /**
     * 프로젝트의 모든 테이블 목록 (외래키 순서를 고려하여 역순으로)
     */
    private static final List<String> TABLES = Arrays.asList(
            "notifications",
            "expenses",
            "incomes",
            "categories",
            "invitations",
            "family_members",
            "user_profiles",
            "families",
            "users"
    );

    /**
     * 각 테스트 메서드 실행 후 모든 테이블 데이터 삭제
     * 
     * Spring의 TestContext를 통해 ApplicationContext에 직접 접근
     */
    @Override
    public void afterTestMethod(TestContext testContext) throws Exception {
        // Spring TestContext에서 직접 Bean 가져오기
        EntityManager em = testContext.getApplicationContext().getBean(EntityManager.class);
        PlatformTransactionManager txManager = testContext.getApplicationContext()
                .getBean(PlatformTransactionManager.class);
        
        // 트랜잭션 시작
        DefaultTransactionDefinition txDef = new DefaultTransactionDefinition();
        TransactionStatus txStatus = txManager.getTransaction(txDef);

        try {
            // 외래키 제약 조건 비활성화 (H2 전용)
            em.createNativeQuery("SET REFERENTIAL_INTEGRITY FALSE").executeUpdate();

            // 각 테이블 TRUNCATE
            int cleanedCount = 0;
            for (String tableName : TABLES) {
                try {
                    em.createNativeQuery("TRUNCATE TABLE " + tableName).executeUpdate();
                    cleanedCount++;
                    log.debug("테이블 정리 완료: {}", tableName);
                } catch (Exception e) {
                    // 테이블이 없을 수도 있으므로 디버그 로그만
                    log.debug("테이블 정리 건너뜀: {} - {}", tableName, e.getMessage());
                }
            }

            // 외래키 제약 조건 활성화 (H2 전용)
            em.createNativeQuery("SET REFERENTIAL_INTEGRITY TRUE").executeUpdate();

            // 트랜잭션 커밋
            txManager.commit(txStatus);
            
            log.info("✅ 데이터베이스 정리 완료 ({}개 테이블)", cleanedCount);
        } catch (Exception e) {
            // 오류 시 롤백
            if (!txStatus.isCompleted()) {
                txManager.rollback(txStatus);
            }
            log.error("데이터베이스 정리 중 오류 발생", e);
            throw e; // 테스트 실패로 처리
        }
    }

    /**
     * Listener의 실행 순서 (낮을수록 먼저 실행)
     * 
     * 기본값: Ordered.LOWEST_PRECEDENCE (가장 나중에 실행)
     * 다른 Listener들이 모두 실행된 후 정리하도록 함
     */
    @Override
    public int getOrder() {
        return LOWEST_PRECEDENCE;
    }
}

