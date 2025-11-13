package com.bifos.accountbook.common;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.context.ApplicationContext;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.test.web.servlet.MockMvc;

/**
 * Presentation Layer 통합 테스트를 위한 추상 클래스
 *
 * <h3>제공되는 기능:</h3>
 * <ul>
 *     <li>Spring Boot 테스트 컨텍스트 로딩 ({@link FosSpringBootTest})</li>
 *     <li>MockMvc 자동 설정 ({@link AutoConfigureMockMvc})</li>
 *     <li>ObjectMapper 자동 주입 (JSON 직렬화/역직렬화)</li>
 *     <li>TestFixtures 자동 초기화 (Fluent API로 테스트 데이터 생성)</li>
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
 *         // Given: TestFixtures로 테스트 데이터 생성 (Fluent API)
 *         User user = fixtures.getDefaultUser();
 *         Family family = fixtures.family()
 *             .name("My Family")
 *             .budget(BigDecimal.valueOf(1000000))
 *             .build();
 *
 *         Category category = fixtures.category(family)
 *             .name("식비")
 *             .build();
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
 *     <li>TestFixtures는 각 테스트마다 초기화됩니다</li>
 *     <li>Fluent API로 필요한 테스트 데이터를 체이닝 방식으로 생성하세요</li>
 * </ul>
 *
 * @see FosSpringBootTest
 * @see TestFixtures
 * @see DatabaseCleanupListener
 */
@FosSpringBootTest
@AutoConfigureMockMvc
public abstract class AbstractControllerTest {

  @Autowired
  protected ApplicationContext applicationContext;

  /**
   * 테스트용 Fixture - Fluent API로 테스트 데이터 생성
   *
   * 사용 예시:
   * - fixtures.getDefaultUser() - 기본 사용자
   * - fixtures.user().email("custom@example.com").build() - 커스텀 사용자
   * - fixtures.family().owner(user).budget(amount).build() - 가족 생성
   * - fixtures.category(family).name("식비").build() - 카테고리 생성
   * - fixtures.expense(family, category).amount(amount).build() - 지출 생성
   */
  protected TestFixtures fixtures;

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

  @BeforeEach
  void setUpFixtures() {
    this.fixtures = new TestFixtures(applicationContext);
  }

  @AfterEach
  void tearDownFixtures() {
    // SecurityContext 정리
    SecurityContextHolder.clearContext();

    // Fixtures 캐시 정리
    if (fixtures != null) {
      fixtures.clear();
    }
  }
}

