package com.bifos.accountbook.presentation.controller;

import com.bifos.accountbook.common.DatabaseCleanupListener;
import com.bifos.accountbook.common.TestFixtures;
import com.bifos.accountbook.common.TestFixturesSupport;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.support.TransactionTemplate;

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
 *         Family family = fixtures.families.family()
 *             .name("My Family")
 *             .budget(BigDecimal.valueOf(1000000))
 *             .build();
 *
 *         Category category = fixtures.categories.category(family)
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
 *     <li>TestFixtures는 각 테스트마다 자동 초기화됩니다</li>
 *     <li>Fluent API로 필요한 테스트 데이터를 체이닝 방식으로 생성하세요</li>
 * </ul>
 *
 * @see TestFixturesSupport
 * @see TestFixtures
 * @see DatabaseCleanupListener
 */
@AutoConfigureMockMvc
public abstract class AbstractControllerTest extends TestFixturesSupport {

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

  @Autowired
  private TransactionTemplate transactionTemplate;

  public <T> void doTransactionWithoutResult(SimpleFunction func) {
    transactionTemplate.executeWithoutResult(status -> {
      func.apply();
    });
  }

  public <T> T doTransaction(TransactionFunction<T> func) {
    return transactionTemplate.execute(status -> func.apply());
  }

  @FunctionalInterface
  public interface SimpleFunction {
    void apply();
  }

  @FunctionalInterface
  public interface TransactionFunction<T> {
    T apply();
  }
}

