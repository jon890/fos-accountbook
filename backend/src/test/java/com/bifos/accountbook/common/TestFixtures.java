package com.bifos.accountbook.common;

import com.bifos.accountbook.common.fixtures.CategoryFixtures;
import com.bifos.accountbook.common.fixtures.ExpenseFixtures;
import com.bifos.accountbook.common.fixtures.FamilyFixtures;
import com.bifos.accountbook.common.fixtures.IncomeFixtures;
import com.bifos.accountbook.common.fixtures.UserFixtures;
import com.bifos.accountbook.domain.entity.Category;
import com.bifos.accountbook.domain.entity.Family;
import com.bifos.accountbook.domain.entity.User;
import com.bifos.accountbook.domain.repository.CategoryRepository;
import com.bifos.accountbook.domain.repository.ExpenseRepository;
import com.bifos.accountbook.domain.repository.FamilyMemberRepository;
import com.bifos.accountbook.domain.repository.FamilyRepository;
import com.bifos.accountbook.domain.repository.IncomeRepository;
import com.bifos.accountbook.domain.repository.UserRepository;
import org.springframework.context.ApplicationContext;

/**
 * 테스트용 Fixture 클래스 - 도메인별 Fixture 조합
 *
 * <h3>사용법:</h3>
 * <pre>{@code
 * @Test
 * void test() {
 *     // 기본 유저 사용
 *     User user = fixtures.users.getDefaultUser();
 *
 *     // 커스텀 유저 생성
 *     User customUser = fixtures.users.user()
 *         .email("custom@example.com")
 *         .name("Custom User")
 *         .build();
 *
 *     // 가족 생성
 *     Family family = fixtures.families.family()
 *         .name("My Family")
 *         .budget(BigDecimal.valueOf(1000000))
 *         .build();
 *
 *     // 카테고리 생성
 *     Category category = fixtures.categories.category(family)
 *         .name("식비")
 *         .color("#FF0000")
 *         .icon("🍚")
 *         .build();
 *
 *     // 지출 생성
 *     Expense expense = fixtures.expenses.expense(family, category)
 *         .amount(BigDecimal.valueOf(50000))
 *         .description("점심")
 *         .build();
 * }
 * }</pre>
 *
 * <h3>구조:</h3>
 * <ul>
 *     <li>users: 사용자 생성 및 SecurityContext 관리</li>
 *     <li>families: 가족 생성 및 멤버 관리</li>
 *     <li>categories: 카테고리 생성 및 관리</li>
 *     <li>expenses: 지출 생성 및 관리</li>
 *     <li>incomes: 수입 생성 및 관리</li>
 * </ul>
 *
 * <h3>장점:</h3>
 * <ul>
 *     <li>도메인별 책임 분리 (Single Responsibility Principle)</li>
 *     <li>명확한 의존성 구조</li>
 *     <li>확장 용이 (새 도메인 추가 시 새 Fixture 클래스만 추가)</li>
 *     <li>Fluent API로 가독성 좋음</li>
 * </ul>
 */
public class TestFixtures {

  // 도메인별 Fixture (public으로 직접 접근)
  public final UserFixtures users;
  public final FamilyFixtures families;
  public final CategoryFixtures categories;
  public final ExpenseFixtures expenses;
  public final IncomeFixtures incomes;

  public TestFixtures(ApplicationContext applicationContext) {
    final UserRepository userRepository = applicationContext.getBean(UserRepository.class);
    final FamilyRepository familyRepository = applicationContext.getBean(FamilyRepository.class);
    final FamilyMemberRepository familyMemberRepository = applicationContext.getBean(FamilyMemberRepository.class);
    final CategoryRepository categoryRepository = applicationContext.getBean(CategoryRepository.class);
    final ExpenseRepository expenseRepository = applicationContext.getBean(ExpenseRepository.class);
    final IncomeRepository incomeRepository = applicationContext.getBean(IncomeRepository.class);

    // 의존성 순서대로 초기화
    this.users = new UserFixtures(userRepository);
    this.families = new FamilyFixtures(familyRepository, familyMemberRepository, users);
    this.categories = new CategoryFixtures(categoryRepository, families);
    this.expenses = new ExpenseFixtures(expenseRepository, users);
    this.incomes = new IncomeFixtures(incomeRepository, users);
  }

  /**
   * 기본 유저 반환 (편의 메서드)
   */
  public User getDefaultUser() {
    return users.getDefaultUser();
  }

  /**
   * 기본 가족 반환 (편의 메서드)
   */
  public Family getDefaultFamily() {
    return families.getDefaultFamily();
  }

  /**
   * 기본 카테고리 반환 (편의 메서드)
   */
  public Category getDefaultCategory() {
    return categories.getDefaultCategory();
  }

  /**
   * 이름으로 카테고리 찾기 (편의 메서드)
   */
  public Category findCategoryByName(Family family, String name) {
    return categories.findByName(family, name);
  }

  /**
   * 캐시 초기화 (각 테스트 후 호출)
   */
  public void clear() {
    users.clear();
    families.clear();
    categories.clear();
  }
}

