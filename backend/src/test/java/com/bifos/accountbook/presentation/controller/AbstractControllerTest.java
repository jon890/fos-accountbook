package com.bifos.accountbook.presentation.controller;

import com.bifos.accountbook.common.DatabaseCleanupListener;
import com.bifos.accountbook.common.FosSpringBootTest;
import com.bifos.accountbook.common.TestFixtures;
import com.bifos.accountbook.common.TestFixturesSupport;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import com.fasterxml.jackson.module.paramnames.ParameterNamesModule;
import org.junit.jupiter.api.BeforeEach;
import org.springframework.beans.factory.annotation.Autowired;
import static org.springframework.security.test.web.servlet.setup.SecurityMockMvcConfigurers.springSecurity;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.transaction.support.TransactionTemplate;
import org.springframework.web.context.WebApplicationContext;
import org.springframework.web.filter.CharacterEncodingFilter;

/**
 * Presentation Layer 통합 테스트를 위한 추상 클래스
 *
 * <h3>제공되는 기능:</h3>
 * <ul>
 *     <li>Spring Boot 테스트 컨텍스트 로딩 ({@link FosSpringBootTest})</li>
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
public abstract class AbstractControllerTest extends TestFixturesSupport {

  protected MockMvc mockMvc;

  protected ObjectMapper objectMapper;

  @Autowired
  private WebApplicationContext context;
  @Autowired
  private TransactionTemplate transactionTemplate;

  @BeforeEach
  void setup() {
    mockMvc = MockMvcBuilders.webAppContextSetup(context)
                             .addFilter(new CharacterEncodingFilter("UTF-8", true))
                             .apply(springSecurity())
                             .build();
    objectMapper = new ObjectMapper()
        .registerModule(new JavaTimeModule())
        .registerModule(new ParameterNamesModule());
  }

  public void doTransactionWithoutResult(SimpleFunction func) {
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

