package com.bifos.accountbook.common;

import java.lang.annotation.Documented;
import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.TestExecutionListeners;

/**
 * FOS 가계부 통합 테스트를 위한 커스텀 애노테이션
 *
 * <p>다음 기능을 자동으로 적용합니다:</p>
 * <ul>
 *     <li>{@link SpringBootTest} - Spring Boot 통합 테스트 활성화</li>
 *     <li>{@link DatabaseCleanupListener} - 각 테스트 후 데이터베이스 자동 정리</li>
 * </ul>
 *
 * <h3>사용법:</h3>
 * <pre>{@code
 * @FosSpringBootTest
 * class MyControllerTest {
 *     @RegisterExtension
 *     TestUserHolder testUserHolder = new TestUserHolder();
 *
 *     @Test
 *     void test() {
 *         Family family = testUserHolder.getFamily();
 *         Category category = testUserHolder.getCategory();
 *         // 테스트 로직
 *     }
 * }
 * }</pre>
 *
 * <h3>장점:</h3>
 * <ul>
 *     <li>테스트 코드가 간결해짐 (3줄 → 1줄)</li>
 *     <li>일관된 테스트 설정 보장</li>
 *     <li>DatabaseCleanupListener 적용 누락 방지</li>
 *     <li>프로젝트 전체에 동일한 테스트 패턴 적용</li>
 * </ul>
 *
 * @see SpringBootTest
 * @see DatabaseCleanupListener
 * @see TestUserHolder
 */
@Target(ElementType.TYPE)
@Retention(RetentionPolicy.RUNTIME)
@Documented
@SpringBootTest
@TestExecutionListeners(
    value = DatabaseCleanupListener.class,
    mergeMode = TestExecutionListeners.MergeMode.MERGE_WITH_DEFAULTS
)
public @interface FosSpringBootTest {

  /**
   * Spring Boot 애플리케이션의 설정 클래스를 지정합니다.
   *
   * @return 설정 클래스 배열
   * @see SpringBootTest#classes()
   */
  Class<?>[] classes() default {};

  /**
   * 테스트에 사용할 Spring profile을 지정합니다.
   *
   * @return 프로파일 배열
   * @see SpringBootTest#properties()
   */
  String[] properties() default {};

  /**
   * 웹 환경 모드를 지정합니다.
   *
   * @return 웹 환경 모드
   * @see SpringBootTest#webEnvironment()
   */
  SpringBootTest.WebEnvironment webEnvironment() default SpringBootTest.WebEnvironment.MOCK;
}

