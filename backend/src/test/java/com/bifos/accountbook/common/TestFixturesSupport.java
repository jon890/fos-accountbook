package com.bifos.accountbook.common;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.ApplicationContext;
import org.springframework.security.core.context.SecurityContextHolder;

/**
 * 테스트용 Fixture 자동 관리를 위한 추상 클래스
 *
 * <h3>사용법:</h3>
 * <pre>{@code
 * @FosSpringBootTest
 * class MyTest extends TestFixturesSupport {
 *     @Test
 *     void test() {
 *         // fixtures 자동 초기화됨
 *         User user = fixtures.users.user().build();
 *         Family family = fixtures.families.family().build();
 *         Category category = fixtures.categories.category(family).build();
 *     }
 * }
 * }</pre>
 *
 * <h3>기능:</h3>
 * <ul>
 *     <li>{@code @BeforeEach}: fixtures 자동 초기화</li>
 *     <li>{@code @AfterEach}: fixtures 캐시 및 SecurityContext 자동 정리</li>
 *     <li>{@code @FosSpringBootTest}와 함께 사용 권장</li>
 * </ul>
 *
 * <h3>장점:</h3>
 * <ul>
 *     <li>반복적인 setUp/tearDown 로직 제거</li>
 *     <li>일관된 테스트 패턴</li>
 *     <li>코드 중복 최소화</li>
 *     <li>테스트 격리 보장 (SecurityContext 자동 정리)</li>
 * </ul>
 */
@FosSpringBootTest
public abstract class TestFixturesSupport {

  @Autowired
  protected ApplicationContext applicationContext;

  /**
   * 테스트용 Fixture (자동 초기화됨)
   */
  protected TestFixtures fixtures;

  /**
   * 각 테스트 실행 전 fixtures 자동 초기화
   */
  @BeforeEach
  void setUpFixtures() {
    fixtures = new TestFixtures(applicationContext);
  }

  /**
   * 각 테스트 실행 후 fixtures 캐시 및 SecurityContext 자동 정리
   */
  @AfterEach
  void tearDownFixtures() {
    // SecurityContext 정리 (테스트 격리 보장)
    SecurityContextHolder.clearContext();

    // Fixtures 캐시 정리
    if (fixtures != null) {
      fixtures.clear();
    }
  }
}
