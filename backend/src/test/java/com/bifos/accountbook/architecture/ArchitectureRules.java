package com.bifos.accountbook.architecture;

import static com.tngtech.archunit.core.domain.JavaClass.Predicates.resideInAPackage;
import static com.tngtech.archunit.core.domain.JavaClass.Predicates.resideOutsideOfPackage;
import static com.tngtech.archunit.lang.syntax.ArchRuleDefinition.noClasses;
import static com.tngtech.archunit.lang.syntax.ArchRuleDefinition.noMethods;
import static com.tngtech.archunit.library.Architectures.layeredArchitecture;

import com.tngtech.archunit.lang.ArchRule;
import com.tngtech.archunit.lang.CompositeArchRule;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.YearMonth;
import org.springframework.transaction.annotation.Transactional;

/** ADR-B22에 따라 운영 코드와 테스트 코드에 적용하는 구조 규칙이다. */
public final class ArchitectureRules {

  private static final String BASE_PACKAGE = "com.bifos.accountbook";
  private static final String APPLICATION_PACKAGE = "..application..";
  private static final String PRESENTATION_PACKAGE = "..presentation..";

  private ArchitectureRules() {}

  public static final ArchRule LAYER_DIRECTION =
      layeredArchitecture()
          .consideringOnlyDependenciesInLayers()
          .layer("presentation")
          .definedBy(BASE_PACKAGE + ".*.presentation..")
          .layer("application")
          .definedBy(BASE_PACKAGE + ".*.application..")
          .layer("infra")
          .definedBy(BASE_PACKAGE + ".*.infra..")
          .layer("domain")
          .definedBy(BASE_PACKAGE + ".*.domain..")
          .whereLayer("presentation")
          .mayNotBeAccessedByAnyLayer()
          .whereLayer("application")
          .mayOnlyBeAccessedByLayers("presentation")
          .whereLayer("infra")
          .mayNotBeAccessedByAnyLayer()
          .whereLayer("domain")
          .mayOnlyBeAccessedByLayers("presentation", "application", "infra")
          .as("층은 presentation 에서 application 을 거쳐 domain 으로 흐른다");

  public static final ArchRule CONTROLLERS_DO_NOT_USE_REPOSITORIES =
      noClasses()
          .that()
          .resideInAPackage(PRESENTATION_PACKAGE)
          .should()
          .dependOnClassesThat()
          .resideInAnyPackage("..domain.repository..", "..infra..")
          .as("presentation 은 domain.repository 와 infra 에 의존하지 않는다");

  public static final ArchRule SHARED_DOES_NOT_DEPEND_ON_DOMAINS =
      noClasses()
          .that()
          .resideInAPackage(BASE_PACKAGE + ".shared..")
          .should()
          .dependOnClassesThat(
              resideInAPackage(BASE_PACKAGE + ".(*)..")
                  .and(resideOutsideOfPackage(BASE_PACKAGE + ".shared.."))
                  .and(resideOutsideOfPackage(BASE_PACKAGE + ".config..")))
          .as("shared 는 도메인 패키지에 의존하지 않는다");

  public static final ArchRule TRANSACTIONAL_ONLY_IN_APPLICATION =
      CompositeArchRule.of(
              noClasses()
                  .that()
                  .resideOutsideOfPackage(APPLICATION_PACKAGE)
                  .should()
                  .beAnnotatedWith(Transactional.class))
          .and(
              noClasses()
                  .that()
                  .resideOutsideOfPackage(APPLICATION_PACKAGE)
                  .should()
                  .beAnnotatedWith(jakarta.transaction.Transactional.class))
          .and(
              noMethods()
                  .that()
                  .areDeclaredInClassesThat()
                  .resideOutsideOfPackage(APPLICATION_PACKAGE)
                  .should()
                  .beAnnotatedWith(Transactional.class))
          .and(
              noMethods()
                  .that()
                  .areDeclaredInClassesThat()
                  .resideOutsideOfPackage(APPLICATION_PACKAGE)
                  .should()
                  .beAnnotatedWith(jakarta.transaction.Transactional.class))
          .as("Transactional 은 application 안에서만 쓴다");

  public static final ArchRule NO_DIRECT_NOW_FOR_BUSINESS_DATE =
      noClasses()
          .that()
          .resideInAnyPackage(APPLICATION_PACKAGE, PRESENTATION_PACKAGE)
          .should()
          .callMethod(LocalDate.class, "now")
          .orShould()
          .callMethod(LocalDateTime.class, "now")
          .orShould()
          .callMethod(YearMonth.class, "now")
          .as("application 과 presentation 은 업무 날짜에 인자 없는 now 를 직접 부르지 않는다");

  public static final ArchRule TESTS_ARE_NOT_TRANSACTIONAL =
      CompositeArchRule.of(noClasses().should().beAnnotatedWith(Transactional.class))
          .and(noClasses().should().beAnnotatedWith(jakarta.transaction.Transactional.class))
          .and(noMethods().should().beAnnotatedWith(Transactional.class))
          .and(noMethods().should().beAnnotatedWith(jakarta.transaction.Transactional.class))
          .as("테스트 클래스와 메서드는 Transactional 을 쓰지 않는다");
}
