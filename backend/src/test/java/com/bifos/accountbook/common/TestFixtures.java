package com.bifos.accountbook.common;

import com.bifos.accountbook.domain.entity.Category;
import com.bifos.accountbook.domain.entity.Expense;
import com.bifos.accountbook.domain.entity.Family;
import com.bifos.accountbook.domain.entity.FamilyMember;
import com.bifos.accountbook.domain.entity.Income;
import com.bifos.accountbook.domain.entity.User;
import com.bifos.accountbook.domain.repository.CategoryRepository;
import com.bifos.accountbook.domain.repository.ExpenseRepository;
import com.bifos.accountbook.domain.repository.FamilyMemberRepository;
import com.bifos.accountbook.domain.repository.FamilyRepository;
import com.bifos.accountbook.domain.repository.IncomeRepository;
import com.bifos.accountbook.domain.repository.UserRepository;
import com.bifos.accountbook.domain.value.CustomUuid;
import com.bifos.accountbook.domain.value.ExpenseStatus;
import com.bifos.accountbook.domain.value.FamilyMemberStatus;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import org.springframework.context.ApplicationContext;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;

/**
 * 테스트용 Fixture 클래스 - Fluent API로 테스트 데이터 구축
 *
 * <h3>사용법:</h3>
 * <pre>{@code
 * @Test
 * void test() {
 *     // 기본 유저 사용
 *     User user = fixtures.getDefaultUser();
 *
 *     // 커스텀 유저 생성
 *     User customUser = fixtures.user()
 *         .email("custom@example.com")
 *         .name("Custom User")
 *         .build();
 *
 *     // 체이닝으로 복잡한 데이터 구조 생성
 *     Family family = fixtures.user()
 *         .withFamily("My Family")
 *         .budget(BigDecimal.valueOf(1000000))
 *         .build();
 *
 *     // 카테고리와 지출 생성
 *     Category category = fixtures.category(family)
 *         .name("식비")
 *         .color("#FF0000")
 *         .icon("🍚")
 *         .build();
 *
 *     Expense expense = fixtures.expense(family, category)
 *         .amount(BigDecimal.valueOf(50000))
 *         .description("점심")
 *         .build();
 * }
 * }</pre>
 *
 * <h3>장점:</h3>
 * <ul>
 *     <li>Fluent API로 가독성 좋음</li>
 *     <li>기본값 제공 + 필요시 커스터마이징</li>
 *     <li>체이닝으로 연관 데이터 쉽게 생성</li>
 *     <li>UUID 기반 관계도 명확하게 표현</li>
 * </ul>
 */
public class TestFixtures {

  private final ApplicationContext applicationContext;
  private final UserRepository userRepository;
  private final FamilyRepository familyRepository;
  private final FamilyMemberRepository familyMemberRepository;
  private final CategoryRepository categoryRepository;
  private final ExpenseRepository expenseRepository;
  private final IncomeRepository incomeRepository;

  // 기본 fixture들 (lazy initialization)
  private User defaultUser;
  private Family defaultFamily;
  private Category defaultCategory;

  public TestFixtures(ApplicationContext applicationContext) {
    this.applicationContext = applicationContext;
    this.userRepository = applicationContext.getBean(UserRepository.class);
    this.familyRepository = applicationContext.getBean(FamilyRepository.class);
    this.familyMemberRepository = applicationContext.getBean(FamilyMemberRepository.class);
    this.categoryRepository = applicationContext.getBean(CategoryRepository.class);
    this.expenseRepository = applicationContext.getBean(ExpenseRepository.class);
    this.incomeRepository = applicationContext.getBean(IncomeRepository.class);
  }

  /**
   * 기본 유저 반환 (lazy initialization)
   * SecurityContext에 자동으로 설정됨
   */
  public User getDefaultUser() {
    if (defaultUser == null) {
      defaultUser = user().build();
    }
    return defaultUser;
  }

  /**
   * 기본 가족 반환 (lazy initialization)
   */
  public Family getDefaultFamily() {
    if (defaultFamily == null) {
      defaultFamily = family().build();
    }
    return defaultFamily;
  }

  /**
   * 기본 카테고리 반환 (lazy initialization)
   */
  public Category getDefaultCategory() {
    if (defaultCategory == null) {
      defaultCategory = category(getDefaultFamily()).build();
    }
    return defaultCategory;
  }

  /**
   * 이름으로 카테고리 찾기 (기본 카테고리 중에서)
   */
  public Category findCategoryByName(Family family, String name) {
    return categoryRepository.findAllByFamilyUuid(family.getUuid())
                             .stream()
                             .filter(c -> name.equals(c.getName()))
                             .findFirst()
                             .orElseThrow(() -> new IllegalArgumentException("카테고리를 찾을 수 없습니다: " + name));
  }

  /**
   * 캐시 초기화 (각 테스트 후 호출)
   */
  public void clear() {
    this.defaultUser = null;
    this.defaultFamily = null;
    this.defaultCategory = null;
  }

  // ============================================================
  // Fixture Builder 시작점
  // ============================================================

  public UserFixture user() {
    return new UserFixture(this);
  }

  public FamilyFixture family() {
    return new FamilyFixture(this);
  }

  public CategoryFixture category(Family family) {
    return new CategoryFixture(this, family);
  }

  public ExpenseFixture expense(Family family, Category category) {
    return new ExpenseFixture(this, family, category, getDefaultUser());
  }

  public IncomeFixture income(Family family, Category category) {
    return new IncomeFixture(this, family, category, getDefaultUser());
  }

  // ============================================================
  // UserFixture - 사용자 생성 Builder
  // ============================================================

  public class UserFixture {
    private String email = "test@example.com";
    private String name = "Test User";
    private String provider = "google";
    private final String providerId = "test-provider-" + System.currentTimeMillis();

    private final TestFixtures fixtures;

    UserFixture(TestFixtures fixtures) {
      this.fixtures = fixtures;
    }

    public UserFixture email(String email) {
      this.email = email;
      return this;
    }

    public UserFixture name(String name) {
      this.name = name;
      return this;
    }

    public UserFixture provider(String provider) {
      this.provider = provider;
      return this;
    }

    public User build() {
      User user = User.builder()
                      .email(email)
                      .name(name)
                      .provider(provider)
                      .providerId(providerId)
                      .build();
      user = userRepository.save(user);

      // SecurityContext에 인증 정보 자동 설정
      UsernamePasswordAuthenticationToken authentication =
          new UsernamePasswordAuthenticationToken(user.getUuid().getValue(), null, null);
      SecurityContextHolder.getContext().setAuthentication(authentication);

      return user;
    }

    // 연관관계 편의 메서드
    public FamilyFixture withFamily(String familyName) {
      User user = build();
      return fixtures.family()
                     .name(familyName)
                     .owner(user);
    }
  }

  // ============================================================
  // FamilyFixture - 가족 생성 Builder
  // ============================================================

  public class FamilyFixture {
    private String name = "Test Family";
    private BigDecimal budget = BigDecimal.ZERO;
    private User owner;

    private final TestFixtures fixtures;

    FamilyFixture(TestFixtures fixtures) {
      this.fixtures = fixtures;
    }

    public FamilyFixture name(String name) {
      this.name = name;
      return this;
    }

    public FamilyFixture budget(BigDecimal budget) {
      this.budget = budget;
      return this;
    }

    public FamilyFixture owner(User owner) {
      this.owner = owner;
      return this;
    }

    public Family build() {
      if (owner == null) {
        owner = fixtures.getDefaultUser();
      }

      Family family = Family.builder()
                            .name(name)
                            .monthlyBudget(budget)
                            .build();
      family = familyRepository.save(family);

      // 가족 멤버 자동 추가
      FamilyMember member = FamilyMember.builder()
                                        .uuid(CustomUuid.generate())
                                        .familyUuid(family.getUuid())
                                        .userUuid(owner.getUuid())
                                        .status(FamilyMemberStatus.ACTIVE)
                                        .build();
      familyMemberRepository.save(member);

      return family;
    }

    // 연관관계 편의 메서드
    public CategoryFixture withCategory(String categoryName) {
      Family family = build();
      return fixtures.category(family)
                     .name(categoryName);
    }
  }

  // ============================================================
  // CategoryFixture - 카테고리 생성 Builder
  // ============================================================

  public class CategoryFixture {
    private String name = "Test Category";
    private String color = "#6366f1";
    private String icon = "🏷️";

    private final TestFixtures fixtures;
    private final Family family;

    CategoryFixture(TestFixtures fixtures, Family family) {
      this.fixtures = fixtures;
      this.family = family;
    }

    public CategoryFixture name(String name) {
      this.name = name;
      return this;
    }

    public CategoryFixture color(String color) {
      this.color = color;
      return this;
    }

    public CategoryFixture icon(String icon) {
      this.icon = icon;
      return this;
    }

    public Category build() {
      Category category = Category.builder()
                                  .familyUuid(family.getUuid())
                                  .name(name)
                                  .color(color)
                                  .icon(icon)
                                  .build();
      return categoryRepository.save(category);
    }

    // 연관관계 편의 메서드
    public ExpenseFixture withExpense(BigDecimal amount) {
      Category category = build();
      return fixtures.expense(family, category)
                     .amount(amount);
    }

    public IncomeFixture withIncome(BigDecimal amount) {
      Category category = build();
      return fixtures.income(family, category)
                     .amount(amount);
    }
  }

  // ============================================================
  // ExpenseFixture - 지출 생성 Builder
  // ============================================================

  public class ExpenseFixture {
    private BigDecimal amount = BigDecimal.valueOf(10000);
    private String description = "Test Expense";
    private LocalDateTime date = LocalDateTime.now();

    private final TestFixtures fixtures;
    private final Family family;
    private final Category category;
    private User user;

    ExpenseFixture(TestFixtures fixtures, Family family, Category category, User defaultUser) {
      this.fixtures = fixtures;
      this.family = family;
      this.category = category;
      this.user = defaultUser;
    }

    public ExpenseFixture amount(BigDecimal amount) {
      this.amount = amount;
      return this;
    }

    public ExpenseFixture description(String description) {
      this.description = description;
      return this;
    }

    public ExpenseFixture date(LocalDateTime date) {
      this.date = date;
      return this;
    }

    public ExpenseFixture user(User user) {
      this.user = user;
      return this;
    }

    public Expense build() {
      // Expense 직접 생성 (@Transactional 없이도 동작)
      Expense expense = Expense.builder()
                               .family(family)
                               .categoryUuid(category.getUuid())
                               .userUuid(user.getUuid())
                               .amount(amount)
                               .description(description)
                               .date(date)
                               .status(ExpenseStatus.ACTIVE)
                               .build();
      return expenseRepository.save(expense);
    }
  }

  // ============================================================
  // IncomeFixture - 수입 생성 Builder
  // ============================================================

  public class IncomeFixture {
    private BigDecimal amount = BigDecimal.valueOf(100000);
    private String description = "Test Income";
    private LocalDateTime date = LocalDateTime.now();

    private final TestFixtures fixtures;
    private final Family family;
    private final Category category;
    private User user;

    IncomeFixture(TestFixtures fixtures, Family family, Category category, User defaultUser) {
      this.fixtures = fixtures;
      this.family = family;
      this.category = category;
      this.user = defaultUser;
    }

    public IncomeFixture amount(BigDecimal amount) {
      this.amount = amount;
      return this;
    }

    public IncomeFixture description(String description) {
      this.description = description;
      return this;
    }

    public IncomeFixture date(LocalDateTime date) {
      this.date = date;
      return this;
    }

    public IncomeFixture user(User user) {
      this.user = user;
      return this;
    }

    public Income build() {
      // Income 직접 생성 (@Transactional 없이도 동작)
      Income income = Income.builder()
                            .family(family)
                            .categoryUuid(category.getUuid())
                            .userUuid(user.getUuid())
                            .amount(amount)
                            .description(description)
                            .date(date)
                            .build();
      return incomeRepository.save(income);
    }
  }
}

