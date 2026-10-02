package com.bifos.accountbook.family.domain.entity;

import static org.assertj.core.api.Assertions.assertThat;

import java.lang.reflect.Field;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

/** ADR-B24: Family 는 지출과 수입을 컬렉션으로 들고 있지 않는다. 다시 생기면 등록마다 전체 조회가 돌아온다. */
@DisplayName("Family 엔티티 구조")
class FamilyStructureTest {

  @Test
  @DisplayName("가족 엔티티는 지출과 수입 컬렉션을 갖지 않는다")
  void hasNoExpenseOrIncomeCollections() {
    assertThat(Family.class.getDeclaredFields())
        .extracting(Field::getName)
        .doesNotContain("expenses", "incomes");
  }
}
