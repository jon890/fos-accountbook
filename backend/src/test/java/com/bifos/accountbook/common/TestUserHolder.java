package com.bifos.accountbook.common;

import com.bifos.accountbook.domain.entity.User;
import com.bifos.accountbook.domain.repository.UserRepository;
import lombok.Getter;
import org.junit.jupiter.api.extension.AfterEachCallback;
import org.junit.jupiter.api.extension.BeforeEachCallback;
import org.junit.jupiter.api.extension.ExtensionContext;
import org.junit.jupiter.api.extension.ParameterContext;
import org.junit.jupiter.api.extension.ParameterResolver;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.test.context.junit.jupiter.SpringExtension;

/**
 * 테스트용 사용자 자동 생성 및 관리 Extension
 * 
 * <p>각 테스트 메서드 실행 전에:
 * <ul>
 *   <li>테스트 사용자를 자동으로 생성하고 DB에 저장</li>
 *   <li>SecurityContext에 인증 정보를 자동으로 설정</li>
 * </ul>
 * 
 * <p>각 테스트 메서드 실행 후에:
 * <ul>
 *   <li>SecurityContext를 자동으로 클리어</li>
 * </ul>
 * 
 * <pre>
 * 사용 예시:
 * {@code
 * @ExtendWith({DatabaseCleanupExtension.class, TestUserHolder.class})
 * class MyControllerTest {
 *     
 *     @Test
 *     void test(TestUserHolder testUserHolder) {
 *         User testUser = testUserHolder.getUser();
 *         // 테스트 로직
 *     }
 * }
 * }
 * </pre>
 */
public class TestUserHolder implements BeforeEachCallback, AfterEachCallback, ParameterResolver {

    private static final String TEST_USER_KEY = "testUser";

    @Getter
    private User user;

    @Override
    public void beforeEach(ExtensionContext context) {
        // Spring ApplicationContext에서 UserRepository 가져오기
        UserRepository userRepository = SpringExtension
                .getApplicationContext(context)
                .getBean(UserRepository.class);

        // SecurityContext 초기화
        SecurityContextHolder.clearContext();

        // 테스트 사용자 생성
        this.user = User.builder()
                .provider("google")
                .providerId("test-provider-id-" + System.currentTimeMillis())
                .email("test@example.com")
                .name("Test User")
                .build();
        this.user = userRepository.save(this.user);

        // ExtensionContext에 테스트 유저 저장
        getStore(context).put(TEST_USER_KEY, this.user);

        // SecurityContext에 인증 정보 설정
        UsernamePasswordAuthenticationToken authentication =
                new UsernamePasswordAuthenticationToken(this.user.getUuid().getValue(), null, null);
        SecurityContextHolder.getContext().setAuthentication(authentication);
    }

    @Override
    public void afterEach(ExtensionContext context) {
        // SecurityContext 클리어
        SecurityContextHolder.clearContext();
        
        // ExtensionContext에서 테스트 유저 제거
        getStore(context).remove(TEST_USER_KEY);
        this.user = null;
    }

    /**
     * ExtensionContext에서 테스트 유저를 가져오는 정적 메서드
     */
    public static User getTestUser(ExtensionContext context) {
        return (User) getStore(context).get(TEST_USER_KEY);
    }

    private static ExtensionContext.Store getStore(ExtensionContext context) {
        return context.getStore(ExtensionContext.Namespace.create(TestUserHolder.class));
    }

    /**
     * 파라미터가 TestUserHolder 타입인지 확인
     */
    @Override
    public boolean supportsParameter(ParameterContext parameterContext, ExtensionContext extensionContext) {
        return parameterContext.getParameter().getType().equals(TestUserHolder.class);
    }

    /**
     * TestUserHolder 인스턴스를 파라미터로 제공
     */
    @Override
    public Object resolveParameter(ParameterContext parameterContext, ExtensionContext extensionContext) {
        return this;
    }
}

