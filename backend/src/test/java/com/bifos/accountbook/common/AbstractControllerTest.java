package com.bifos.accountbook.common;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.extension.RegisterExtension;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.test.web.servlet.MockMvc;

/**
 * Presentation Layer 통합 테스트를 위한 추상 클래스
 * 
 * <h3>제공되는 기능:</h3>
 * <ul>
 *     <li>Spring Boot 테스트 컨텍스트 로딩 ({@link FosSpringBootTest})</li>
 *     <li>MockMvc 자동 설정 ({@link AutoConfigureMockMvc})</li>
 *     <li>ObjectMapper 자동 주입 (JSON 직렬화/역직렬화)</li>
 *     <li>TestUserHolder 자동 등록 (테스트 사용자 및 데이터 생성)</li>
 *     <li>데이터베이스 자동 정리 (각 테스트 메서드 후)</li>
 * </ul>
 * 
 * <h3>사용법:</h3>
 * <pre>{@code
 * @DisplayName("User API 통합 테스트")
 * class UserControllerTest extends AbstractControllerTest {
 * 
 *     @Test
 *     void createUser_Success() throws Exception {
 *         // Given: TestUserHolder를 통해 테스트 데이터 생성
 *         User user = testUserHolder.getUser();
 *         Family family = testUserHolder.getFamily();
 *         
 *         CreateUserRequest request = new CreateUserRequest("John");
 *         
 *         // When & Then: MockMvc로 API 호출 및 검증
 *         mockMvc.perform(post("/api/users")
 *                 .contentType(MediaType.APPLICATION_JSON)
 *                 .content(objectMapper.writeValueAsString(request)))
 *             .andExpect(status().isCreated())
 *             .andExpect(jsonPath("$.success").value(true));
 *     }
 * }
 * }</pre>
 * 
 * <h3>주의사항:</h3>
 * <ul>
 *     <li>각 테스트 메서드는 독립적으로 실행됩니다 (데이터베이스 자동 정리)</li>
 *     <li>TestUserHolder는 각 테스트마다 새로운 사용자를 생성합니다</li>
 *     <li>필요한 테스트 데이터는 TestUserHolder의 메서드를 활용하세요</li>
 * </ul>
 * 
 * @see FosSpringBootTest
 * @see TestUserHolder
 * @see DatabaseCleanupListener
 */
@FosSpringBootTest
@AutoConfigureMockMvc
public abstract class AbstractControllerTest {

    /**
     * 테스트용 사용자 및 데이터 관리 Extension
     * 
     * 각 테스트마다 자동으로:
     * - 새로운 테스트 사용자 생성
     * - SecurityContext에 인증 정보 설정
     * - 필요 시 Family, Category 등 lazy 생성
     */
    @RegisterExtension
    protected TestUserHolder testUserHolder = new TestUserHolder();

    /**
     * Spring MockMvc 인스턴스
     * 
     * Controller API를 테스트하기 위한 MockMvc.
     * 실제 HTTP 요청 없이 Controller 메서드를 호출할 수 있습니다.
     */
    @Autowired
    protected MockMvc mockMvc;

    /**
     * Jackson ObjectMapper
     * 
     * Request/Response 객체를 JSON으로 직렬화/역직렬화할 때 사용합니다.
     * 
     * <pre>{@code
     * String json = objectMapper.writeValueAsString(request);
     * mockMvc.perform(post("/api/users").content(json))
     * }</pre>
     */
    @Autowired
    protected ObjectMapper objectMapper;
}

