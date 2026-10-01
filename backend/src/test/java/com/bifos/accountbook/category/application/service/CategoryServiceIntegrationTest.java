package com.bifos.accountbook.category.application.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import com.bifos.accountbook.category.application.dto.CreateCategoryRequest;
import com.bifos.accountbook.category.domain.entity.Category;
import com.bifos.accountbook.category.domain.repository.CategoryRepository;
import com.bifos.accountbook.category.domain.value.CategoryStatus;
import com.bifos.accountbook.category.domain.value.CategoryType;
import com.bifos.accountbook.expense.domain.entity.Expense;
import com.bifos.accountbook.expense.domain.repository.ExpenseRepository;
import com.bifos.accountbook.family.domain.entity.Family;
import com.bifos.accountbook.income.domain.entity.Income;
import com.bifos.accountbook.income.domain.repository.IncomeRepository;
import com.bifos.accountbook.income.domain.value.IncomeStatus;
import com.bifos.accountbook.recurring.domain.entity.RecurringExpense;
import com.bifos.accountbook.recurring.domain.repository.RecurringExpenseRepository;
import com.bifos.accountbook.shared.TestFixturesSupport;
import com.bifos.accountbook.shared.exception.BusinessException;
import com.bifos.accountbook.shared.exception.ErrorCode;
import com.bifos.accountbook.user.domain.entity.User;
import java.math.BigDecimal;
import java.util.List;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;

@DisplayName("CategoryService 통합 테스트")
class CategoryServiceIntegrationTest extends TestFixturesSupport {

  @Autowired private CategoryService categoryService;

  @Autowired private CategoryRepository categoryRepository;

  @Autowired private ExpenseRepository expenseRepository;

  @Autowired private IncomeRepository incomeRepository;

  @Autowired private RecurringExpenseRepository recurringExpenseRepository;

  @Test
  @DisplayName("가족 생성 시 종류별 기본 카테고리가 하나씩 생성된다")
  void createDefaultCategoriesForFamily() {
    // given
    Family family = fixtures.families.family().build();

    // when
    categoryService.createDefaultCategoriesForFamily(family.getUuid());

    // then
    List<Category> categories = categoryRepository.findAllByFamilyUuid(family.getUuid());
    assertThat(categories).hasSizeGreaterThan(0);

    assertThat(categories.stream().filter(Category::isDefault)).hasSize(2);
    assertThat(
            categories.stream()
                .filter(category -> category.getType() == CategoryType.EXPENSE)
                .filter(Category::isDefault)
                .map(Category::getName))
        .containsExactly("미분류");
    assertThat(
            categories.stream()
                .filter(category -> category.getType() == CategoryType.INCOME)
                .filter(Category::isDefault)
                .map(Category::getName))
        .containsExactly("기타 수입");
  }

  @Test
  @DisplayName("기본 카테고리는 삭제할 수 없다")
  void cannotDeleteDefaultCategory() {
    // given
    User user = fixtures.users.user().buildAndSetSecurityContext();
    Family family = fixtures.families.family().owner(user).build();
    categoryService.createDefaultCategoriesForFamily(family.getUuid());

    Category defaultCategory =
        categoryRepository
            .getDefaultCategoryByFamily(family.getUuid(), CategoryType.EXPENSE)
            .orElseThrow();

    // when & then
    assertThatThrownBy(
            () ->
                categoryService.deleteCategory(
                    user.getUuid(), family.getUuid(), defaultCategory.getUuid().getValue()))
        .isInstanceOf(BusinessException.class)
        .extracting("errorCode")
        .isEqualTo(ErrorCode.CANNOT_DELETE_DEFAULT_CATEGORY);
  }

  @Test
  @DisplayName("수입 기본 카테고리는 삭제할 수 없다")
  void cannotDeleteIncomeDefaultCategory() {
    User user = fixtures.users.user().buildAndSetSecurityContext();
    Family family = fixtures.families.family().owner(user).build();
    categoryService.createDefaultCategoriesForFamily(family.getUuid());
    Category incomeDefault =
        categoryRepository
            .getDefaultCategoryByFamily(family.getUuid(), CategoryType.INCOME)
            .orElseThrow();

    assertThatThrownBy(
            () ->
                categoryService.deleteCategory(
                    user.getUuid(), family.getUuid(), incomeDefault.getUuid().getValue()))
        .isInstanceOf(BusinessException.class)
        .extracting("errorCode")
        .isEqualTo(ErrorCode.CANNOT_DELETE_DEFAULT_CATEGORY);
  }

  @Test
  @DisplayName("지출 기본 카테고리가 없으면 카테고리 삭제와 지출 이관을 모두 롤백한다")
  void deleteCategoryRollsBackWhenExpenseDefaultCategoryIsMissing() {
    User user = fixtures.users.user().buildAndSetSecurityContext();
    Family family = fixtures.families.family().owner(user).build();
    Category expenseCategory = fixtures.categories.category(family).name("이관 실패 대상").build();
    Expense expense = fixtures.expenses.expense(family, expenseCategory).user(user).build();

    assertThatThrownBy(
            () ->
                categoryService.deleteCategory(
                    user.getUuid(), family.getUuid(), expenseCategory.getUuid().getValue()))
        .isInstanceOf(BusinessException.class)
        .extracting("errorCode")
        .isEqualTo(ErrorCode.CATEGORY_NOT_FOUND);

    Category unchangedCategory =
        categoryRepository.findByUuid(expenseCategory.getUuid()).orElseThrow();
    Expense unchangedExpense = expenseRepository.findByUuid(expense.getUuid()).orElseThrow();
    assertThat(unchangedCategory.getStatus()).isEqualTo(CategoryStatus.ACTIVE);
    assertThat(unchangedExpense.getCategoryUuid()).isEqualTo(expenseCategory.getUuid());
    assertThat(
            categoryRepository.findAllByFamilyUuid(family.getUuid()).stream()
                .filter(Category::isDefault))
        .isEmpty();
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
    Expense expense =
        fixtures
            .expenses
            .expense(family, normalCategory)
            .user(user)
            .amount(BigDecimal.valueOf(10000))
            .build();

    // when
    categoryService.deleteCategory(
        user.getUuid(), family.getUuid(), normalCategory.getUuid().getValue());

    // then
    // 1. 일반 카테고리는 삭제 상태
    Category deletedCategory =
        categoryRepository.findByUuid(normalCategory.getUuid()).orElseThrow();
    assertThat(deletedCategory.getStatus()).isEqualTo(CategoryStatus.DELETED);

    // 2. 지출의 카테고리가 기본 카테고리로 변경되었는지 확인
    Expense updatedExpense = expenseRepository.findByUuid(expense.getUuid()).orElseThrow();
    Category defaultCategory =
        categoryRepository
            .getDefaultCategoryByFamily(family.getUuid(), CategoryType.EXPENSE)
            .orElseThrow();

    assertThat(updatedExpense.getCategoryUuid()).isEqualTo(defaultCategory.getUuid());
  }

  @Test
  @DisplayName("지출 카테고리 삭제 시 활성 반복 지출은 미분류로 이동한다")
  void deleteExpenseCategoryMovesActiveRecurringExpensesToExpenseDefault() {
    User user = fixtures.users.user().buildAndSetSecurityContext();
    Family family = fixtures.families.family().owner(user).build();
    categoryService.createDefaultCategoriesForFamily(family.getUuid());
    Category expenseCategory = fixtures.categories.category(family).name("정기 지출").build();
    RecurringExpense recurringExpense =
        fixtures.recurringExpenses.recurringExpense(family, expenseCategory).user(user).build();

    categoryService.deleteCategory(
        user.getUuid(), family.getUuid(), expenseCategory.getUuid().getValue());

    Category expenseDefault =
        categoryRepository
            .getDefaultCategoryByFamily(family.getUuid(), CategoryType.EXPENSE)
            .orElseThrow();
    RecurringExpense movedRecurringExpense =
        recurringExpenseRepository.findActiveByUuid(recurringExpense.getUuid()).orElseThrow();
    assertThat(movedRecurringExpense.getCategoryUuid())
        .isEqualTo(expenseDefault.getUuid().getValue());
  }

  @Test
  @DisplayName("수입 카테고리 삭제 시 활성 및 삭제 이력이 기타 수입으로 이동한다")
  void deleteIncomeCategoryMovesAllIncomeHistoryToIncomeDefault() {
    User user = fixtures.users.user().buildAndSetSecurityContext();
    Family family = fixtures.families.family().owner(user).build();
    categoryService.createDefaultCategoriesForFamily(family.getUuid());
    Category incomeCategory =
        fixtures.categories.category(family).name("임시 수입").type(CategoryType.INCOME).build();
    final Income activeIncome = fixtures.incomes.income(family, incomeCategory).user(user).build();
    Income deletedIncome = fixtures.incomes.income(family, incomeCategory).user(user).build();
    deletedIncome.delete();
    incomeRepository.save(deletedIncome);

    categoryService.deleteCategory(
        user.getUuid(), family.getUuid(), incomeCategory.getUuid().getValue());

    Category incomeDefault =
        categoryRepository
            .getDefaultCategoryByFamily(family.getUuid(), CategoryType.INCOME)
            .orElseThrow();
    Category deletedCategory =
        categoryRepository.findByUuid(incomeCategory.getUuid()).orElseThrow();
    assertThat(deletedCategory.getStatus()).isEqualTo(CategoryStatus.DELETED);
    assertThat(incomeRepository.findByUuid(activeIncome.getUuid()).orElseThrow().getCategoryUuid())
        .isEqualTo(incomeDefault.getUuid());
    Income movedDeletedIncome = incomeRepository.findByUuid(deletedIncome.getUuid()).orElseThrow();
    assertThat(movedDeletedIncome.getCategoryUuid()).isEqualTo(incomeDefault.getUuid());
    assertThat(movedDeletedIncome.getStatus()).isEqualTo(IncomeStatus.DELETED);
  }

  @Test
  @DisplayName("같은 가족에서는 종류가 다르면 같은 이름 카테고리를 만들 수 있다")
  void createCategory_allowsSameNameForDifferentTypes() {
    User user = fixtures.users.user().buildAndSetSecurityContext();
    Family family = fixtures.families.family().owner(user).build();

    categoryService.createCategory(
        user.getUuid(),
        family.getUuid(),
        new CreateCategoryRequest("공통", null, null, null, CategoryType.EXPENSE));

    categoryService.createCategory(
        user.getUuid(),
        family.getUuid(),
        new CreateCategoryRequest("공통", null, null, null, CategoryType.INCOME));

    assertThat(categoryRepository.findAllByFamilyUuid(family.getUuid()))
        .extracting(Category::getType)
        .contains(CategoryType.EXPENSE, CategoryType.INCOME);
  }

  @Test
  @DisplayName("같은 가족과 종류에서 카테고리 이름이 중복되면 거부한다")
  void createCategory_rejectsSameNameForSameType() {
    User user = fixtures.users.user().buildAndSetSecurityContext();
    Family family = fixtures.families.family().owner(user).build();
    CreateCategoryRequest request =
        new CreateCategoryRequest("중복", null, null, null, CategoryType.INCOME);
    categoryService.createCategory(user.getUuid(), family.getUuid(), request);

    assertThatThrownBy(
            () -> categoryService.createCategory(user.getUuid(), family.getUuid(), request))
        .isInstanceOf(BusinessException.class)
        .extracting("errorCode")
        .isEqualTo(ErrorCode.CATEGORY_ALREADY_EXISTS);
  }
}
