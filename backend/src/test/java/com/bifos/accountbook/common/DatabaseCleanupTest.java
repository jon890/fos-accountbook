package com.bifos.accountbook.common;

import com.bifos.accountbook.domain.entity.User;
import com.bifos.accountbook.domain.repository.UserRepository;
import com.bifos.accountbook.domain.value.CustomUuid;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.TestExecutionListeners;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * DatabaseCleanupListener 테스트
 */
@SpringBootTest
@TestExecutionListeners(
    value = DatabaseCleanupListener.class,
    mergeMode = TestExecutionListeners.MergeMode.MERGE_WITH_DEFAULTS
)
@DisplayName("데이터베이스 정리 Listener 테스트")
class DatabaseCleanupTest {

    @Autowired
    private UserRepository userRepository;

    @PersistenceContext
    private EntityManager entityManager;

    @Test
    @DisplayName("첫 번째 테스트 - 사용자 생성")
    void test1_CreateUser() {
        // Given
        User user = User.builder()
                .uuid(CustomUuid.generate())
                .provider("google")
                .providerId("test-1-" + System.currentTimeMillis())
                .email("test1@example.com")
                .name("테스트1")
                .build();

        // When
        User saved = userRepository.save(user);

        // Then
        assertThat(saved.getId()).isNotNull();
        assertThat(userRepository.findByEmail("test1@example.com")).isPresent();
        
        // EntityManager로 카운트 확인
        long count = entityManager.createQuery("SELECT COUNT(u) FROM User u", Long.class)
                .getSingleResult();
        assertThat(count).isGreaterThan(0);
    }

    @Test
    @DisplayName("두 번째 테스트 - 이전 데이터가 정리되었는지 확인")
    void test2_CheckCleanup() {
        // Given & When
        // DatabaseCleanupListener가 test1 이후 데이터를 정리했어야 함

        // Then
        assertThat(userRepository.findByEmail("test1@example.com")).isEmpty();
        
        // EntityManager로 카운트 확인
        long count = entityManager.createQuery("SELECT COUNT(u) FROM User u", Long.class)
                .getSingleResult();
        assertThat(count).isEqualTo(0);
    }

    @Test
    @DisplayName("세 번째 테스트 - 다시 사용자 생성")
    void test3_CreateAnotherUser() {
        // Given
        User user = User.builder()
                .uuid(CustomUuid.generate())
                .provider("google")
                .providerId("test-3-" + System.currentTimeMillis())
                .email("test3@example.com")
                .name("테스트3")
                .build();

        // When
        User saved = userRepository.save(user);

        // Then
        assertThat(saved.getId()).isNotNull();
        assertThat(userRepository.findByEmail("test3@example.com")).isPresent();
        
        // EntityManager로 카운트 확인
        long count = entityManager.createQuery("SELECT COUNT(u) FROM User u", Long.class)
                .getSingleResult();
        assertThat(count).isEqualTo(1);
    }
}

