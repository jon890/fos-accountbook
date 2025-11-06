package com.bifos.accountbook.common;

import jakarta.persistence.EntityManager;
import org.junit.jupiter.api.extension.AfterEachCallback;
import org.junit.jupiter.api.extension.ExtensionContext;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.ApplicationContext;
import org.springframework.test.context.junit.jupiter.SpringExtension;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.TransactionStatus;
import org.springframework.transaction.support.DefaultTransactionDefinition;

import java.util.Arrays;
import java.util.List;

/**
 * 테스트 후 데이터베이스 정리 Extension
 * 
 * 사용법:
 * @ExtendWith(DatabaseCleanupExtension.class)
 * class MyTest {
 *     // 테스트 메서드들
 * }
 * 
 * 주의: @Transactional과 함께 사용하면 롤백되므로, 
 * @Transactional 제거하고 이 Extension만 사용하세요.
 */
public class DatabaseCleanupExtension implements AfterEachCallback {

    private static final Logger log = LoggerFactory.getLogger(DatabaseCleanupExtension.class);
    
    /**
     * 프로젝트의 모든 테이블 목록 (외래키 순서를 고려하여 역순으로)
     */
    private static final List<String> TABLES = Arrays.asList(
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
     */
    @Override
    public void afterEach(ExtensionContext context) {
        ApplicationContext appContext = getApplicationContext(context);
        if (appContext == null) {
            log.warn("ApplicationContext를 찾을 수 없어 데이터 정리를 건너뜁니다.");
            return;
        }

        EntityManager em = appContext.getBean(EntityManager.class);
        PlatformTransactionManager txManager = appContext.getBean(PlatformTransactionManager.class);
        
        // 트랜잭션 시작
        DefaultTransactionDefinition txDef = new DefaultTransactionDefinition();
        TransactionStatus txStatus = txManager.getTransaction(txDef);

        try {
            // 외래키 제약 조건 비활성화
            em.createNativeQuery("SET REFERENTIAL_INTEGRITY FALSE").executeUpdate();

            // 각 테이블 TRUNCATE (외래키 순서를 고려하여 역순으로)
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

            // 외래키 제약 조건 활성화
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
        }
    }

    /**
     * Spring ApplicationContext 가져오기
     */
    private ApplicationContext getApplicationContext(ExtensionContext context) {
        try {
            return SpringExtension.getApplicationContext(context);
        } catch (Exception e) {
            log.warn("ApplicationContext를 가져올 수 없습니다: {}", e.getMessage());
            return null;
        }
    }
}

