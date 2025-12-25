package com.bifos.accountbook.application.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import com.bifos.accountbook.application.exception.BusinessException;
import com.bifos.accountbook.application.exception.ErrorCode;
import com.bifos.accountbook.common.TestFixturesSupport;
import com.bifos.accountbook.domain.entity.Category;
import com.bifos.accountbook.domain.entity.Expense;
import com.bifos.accountbook.domain.entity.Family;
import com.bifos.accountbook.domain.entity.User;
import com.bifos.accountbook.domain.repository.CategoryRepository;
import com.bifos.accountbook.domain.repository.ExpenseRepository;
import com.bifos.accountbook.domain.value.CategoryStatus;
import java.math.BigDecimal;
import java.util.List;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;

@DisplayName("CategoryService 통합 테스트")
class CategoryServiceIntegrationTest extends TestFixturesSupport {

  @Autowired
  private CategoryService categoryService;

  @Autowired
  private CategoryRepository categoryRepository;

  @Autowired
  private ExpenseRepository expenseRepository;

  @Test
  @DisplayName("가족 생성 시 기본 카테고리가 생성되며, 그 중 하나는 isDefault=true여야 한다")
  void createDefaultCategoriesForFamily() {
    // given
    Family family = fixtures.families.family().build();

    // when
    categoryService.createDefaultCategoriesForFamily(family.getUuid());

    // then
    List<Category> categories = categoryRepository.findAllByFamilyUuid(family.getUuid());
    assertThat(categories).hasSizeGreaterThan(0);

    long defaultCount = categories.stream().filter(Category::isDefault).count();
    assertThat(defaultCount).isEqualTo(1);

    Category defaultCategory = categories.stream().filter(Category::isDefault).findFirst().get();
    assertThat(defaultCategory.getName()).isEqualTo("미분류");
  }

  @Test
  @DisplayName("기본 카테고리는 삭제할 수 없다")
  void cannotDeleteDefaultCategory() {
    // given
    User user = fixtures.users.user().buildAndSetSecurityContext();
    Family family = fixtures.families.family().owner(user).build();
    categoryService.createDefaultCategoriesForFamily(family.getUuid());

    Category defaultCategory = categoryRepository.getDefaultCategoryByFamily(family.getUuid()).orElseThrow();

    // when & then
    assertThatThrownBy(() -> categoryService.deleteCategory(user.getUuid(), defaultCategory.getUuid().getValue()))
        .isInstanceOf(BusinessException.class)
        .extracting("errorCode")
        .isEqualTo(ErrorCode.CANNOT_DELETE_DEFAULT_CATEGORY);
  }

  @Test
  @DisplayName("카테고리 삭제 시 소속된 지출은 기본 카테고리로 이동해야 한다")
  void deleteCategoryMovesExpensesToDefault() {
    // given
    User user = fixtures.users.user().buildAndSetSecurityContext();
    Family family = fixtures.families.family().owner(user).build();
    categoryService.createDefaultCategoriesForFamily(family.getUuid());

    // 일반 카테고리 생성
    Category normalCategory = fixtures.categories.category(family).name("일반").build();

    // 지출 생성 (일반 카테고리에 속함)
    Expense expense = fixtures.expenses.expense(family, normalCategory)
        .user(user)
        .amount(BigDecimal.valueOf(10000))
        .build();

    // when
    categoryService.deleteCategory(user.getUuid(), normalCategory.getUuid().getValue());

    // then
    // 1. 일반 카테고리는 삭제 상태
    Category deletedCategory = categoryRepository.findByUuid(normalCategory.getUuid()).orElseThrow();
    assertThat(deletedCategory.getStatus()).isEqualTo(CategoryStatus.DELETED);

    // 2. 지출의 카테고리가 기본 카테고리로 변경되었는지 확인
    Expense updatedExpense = expenseRepository.findByUuid(expense.getUuid()).orElseThrow();
    Category defaultCategory = categoryRepository.getDefaultCategoryByFamily(family.getUuid()).orElseThrow();

    assertThat(updatedExpense.getCategoryUuid()).isEqualTo(defaultCategory.getUuid());
  }
}
