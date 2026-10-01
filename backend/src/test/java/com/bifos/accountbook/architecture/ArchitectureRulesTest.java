package com.bifos.accountbook.architecture;

import com.tngtech.archunit.core.domain.JavaClasses;
import com.tngtech.archunit.core.importer.ClassFileImporter;
import com.tngtech.archunit.core.importer.ImportOption;
import com.tngtech.archunit.library.freeze.FreezingArchRule;
import org.junit.jupiter.api.Tag;
import org.junit.jupiter.api.Test;

@Tag("architecture")
class ArchitectureRulesTest {

  private static final JavaClasses MAIN =
      new ClassFileImporter()
          .withImportOption(ImportOption.Predefined.DO_NOT_INCLUDE_TESTS)
          .importPackages("com.bifos.accountbook");

  private static final JavaClasses TESTS =
      new ClassFileImporter()
          .withImportOption(ImportOption.Predefined.ONLY_INCLUDE_TESTS)
          .importPackages("com.bifos.accountbook");

  @Test
  void layerDirection() {
    FreezingArchRule.freeze(ArchitectureRules.LAYER_DIRECTION).check(MAIN);
  }

  @Test
  void controllersDoNotUseRepositories() {
    FreezingArchRule.freeze(ArchitectureRules.CONTROLLERS_DO_NOT_USE_REPOSITORIES).check(MAIN);
  }

  @Test
  void sharedDoesNotDependOnDomains() {
    FreezingArchRule.freeze(ArchitectureRules.SHARED_DOES_NOT_DEPEND_ON_DOMAINS).check(MAIN);
  }

  @Test
  void transactionalOnlyInApplication() {
    FreezingArchRule.freeze(ArchitectureRules.TRANSACTIONAL_ONLY_IN_APPLICATION).check(MAIN);
  }

  @Test
  void noDirectNowForBusinessDate() {
    FreezingArchRule.freeze(ArchitectureRules.NO_DIRECT_NOW_FOR_BUSINESS_DATE).check(MAIN);
  }

  @Test
  void testsAreNotTransactional() {
    FreezingArchRule.freeze(ArchitectureRules.TESTS_ARE_NOT_TRANSACTIONAL).check(TESTS);
  }
}
