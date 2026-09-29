package com.bifos.accountbook.dashboard.infra.repository;

import com.bifos.accountbook.shared.FosSpringBootTest;
import com.bifos.accountbook.category.domain.entity.Category;
import com.bifos.accountbook.expense.domain.entity.Expense;
import com.bifos.accountbook.family.domain.entity.Family;
import com.bifos.accountbook.user.domain.entity.User;
import com.bifos.accountbook.category.domain.repository.CategoryRepository;
import com.bifos.accountbook.dashboard.domain.repository.DashboardRepository;
import com.bifos.accountbook.expense.domain.repository.ExpenseRepository;
import com.bifos.accountbook.family.domain.repository.FamilyRepository;
import com.bifos.accountbook.user.domain.repository.UserRepository;
import com.bifos.accountbook.expense.domain.repository.projection.CategoryExpenseProjection;
import com.bifos.accountbook.category.domain.value.CategoryStatus;
import com.bifos.accountbook.shared.value.CustomUuid;
import com.bifos.accountbook.expense.domain.value.ExpenseStatus;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import static org.assertj.core.api.Assertions.assertThat;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;

/**
 * DashboardRepository QueryDSL 통합 테스트
 * - 실제 DB와 QueryDSL 쿼리 동작 검증
 * - 카테고리별 지출 통계 조회
 * - 전체 지출 합계 조회
 * - 대시보드 전용 통계 쿼리 테스트
 */
@FosSpringBootTest
@DisplayName("DashboardRepository QueryDSL 통합 테스트")
class DashboardRepositoryTest {

  @Autowired
  private DashboardRepository dashboardRepository;

  @Autowired
  private ExpenseRepository expenseRepository;

  @Autowired
  private CategoryRepository categoryRepository;

  @Autowired
  private FamilyRepository familyRepository;

  @Autowired
  private UserRepository userRepository;

  private User testUser;
  private Family testFamily;
  private Category foodCategory;
  private Category transportCategory;
  private CustomUuid familyUuid;
  private CustomUuid userUuid;

  @BeforeEach
  void setUp() {
    // Given: 테스트 데이터 생성
    userUuid = CustomUuid.generate();
    testUser = User.builder()
                   .uuid(userUuid)
                   .email("test@example.com")
                   .name("테스트 사용자")
                   .provider("GOOGLE")
                   .providerId("google-123")
                   .build();
    testUser = userRepository.save(testUser);

    familyUuid = CustomUuid.generate();
    testFamily = Family.builder()
                       .uuid(familyUuid)
                       .name("테스트 가족")
                       .build();
    testFamily = familyRepository.save(testFamily);

    // 카테고리 생성
    foodCategory = Category.builder()
                           .uuid(CustomUuid.generate())
                           .familyUuid(familyUuid)
                           .name("식비")
                           .icon("🍕")
                           .color("#FF5733")
                           .status(CategoryStatus.ACTIVE)
                           .build();
    foodCategory = categoryRepository.save(foodCategory);

    transportCategory = Category.builder()
                                .uuid(CustomUuid.generate())
                                .familyUuid(familyUuid)
                                .name("교통비")
                                .icon("🚗")
                                .color("#3498DB")
                                .status(CategoryStatus.ACTIVE)
                                .build();
    transportCategory = categoryRepository.save(transportCategory);
  }

  @Test
  @DisplayName("카테고리별 지출 통계 조회 - QueryDSL로 집계 쿼리 실행")
  void findCategoryExpenseStats_Success() {
    // Given: 여러 지출 데이터 생성
    LocalDateTime now = LocalDateTime.now();

    // 식비 지출 3건
    createExpense(familyUuid, userUuid, foodCategory.getUuid(), BigDecimal.valueOf(15000), now.minusDays(1));
    createExpense(familyUuid, userUuid, foodCategory.getUuid(), BigDecimal.valueOf(20000), now.minusDays(2));
    createExpense(familyUuid, userUuid, foodCategory.getUuid(), BigDecimal.valueOf(25000), now.minusDays(3));

    // 교통비 지출 2건
    createExpense(familyUuid, userUuid, transportCategory.getUuid(), BigDecimal.valueOf(5000), now.minusDays(1));
    createExpense(familyUuid, userUuid, transportCategory.getUuid(), BigDecimal.valueOf(10000), now.minusDays(2));

    // When: 카테고리별 통계 조회 (DashboardRepository)
    List<CategoryExpenseProjection> stats = dashboardRepository.getCategoryExpenseStats(
        familyUuid,
        null, // 모든 카테고리
        now.minusDays(7), // 최근 7일
        now
    );

    // Then: 카테고리별로 집계되어야 함
    assertThat(stats).hasSize(2);

    // 식비가 가장 많아서 첫 번째여야 함 (ORDER BY SUM(amount) DESC)
    CategoryExpenseProjection foodStat = stats.get(0);
    assertThat(foodStat.categoryName()).isEqualTo("식비");
    assertThat(foodStat.categoryIcon()).isEqualTo("🍕");
    assertThat(foodStat.categoryColor()).isEqualTo("#FF5733");
    assertThat(foodStat.totalAmount()).isEqualByComparingTo(BigDecimal.valueOf(60000)); // 15000 + 20000 + 25000
    assertThat(foodStat.count()).isEqualTo(3L);

    // 교통비가 두 번째
    CategoryExpenseProjection transportStat = stats.get(1);
    assertThat(transportStat.categoryName()).isEqualTo("교통비");
    assertThat(transportStat.totalAmount()).isEqualByComparingTo(BigDecimal.valueOf(15000)); // 5000 + 10000
    assertThat(transportStat.count()).isEqualTo(2L);
  }

  @Test
  @DisplayName("전체 지출 합계 조회 - QueryDSL로 SUM 집계")
  void getTotalExpenseAmount_Success() {
    // Given: 여러 지출 데이터 생성
    LocalDateTime now = LocalDateTime.now();

    createExpense(familyUuid, userUuid, foodCategory.getUuid(), BigDecimal.valueOf(10000), now.minusDays(1));
    createExpense(familyUuid, userUuid, foodCategory.getUuid(), BigDecimal.valueOf(20000), now.minusDays(2));
    createExpense(familyUuid, userUuid, transportCategory.getUuid(), BigDecimal.valueOf(5000), now.minusDays(1));

    // When: 전체 지출 합계 조회 (DashboardRepository)
    BigDecimal total = dashboardRepository.getTotalExpenseAmount(
        familyUuid,
        null,
        now.minusDays(7),
        now
    );

    // Then: 모든 지출의 합계
    assertThat(total).isEqualByComparingTo(BigDecimal.valueOf(35000)); // 10000 + 20000 + 5000
  }

  @Test
  @DisplayName("카테고리 필터링 - 특정 카테고리만 집계")
  void findCategoryExpenseStats_WithCategoryFilter() {
    // Given: 여러 카테고리 지출 생성
    LocalDateTime now = LocalDateTime.now();

    createExpense(familyUuid, userUuid, foodCategory.getUuid(), BigDecimal.valueOf(10000), now.minusDays(1));
    createExpense(familyUuid, userUuid, transportCategory.getUuid(), BigDecimal.valueOf(5000), now.minusDays(1));

    // When: 식비 카테고리만 조회
    List<CategoryExpenseProjection> stats = dashboardRepository.getCategoryExpenseStats(
        familyUuid,
        foodCategory.getUuid(), // 식비만
        now.minusDays(7),
        now
    );

    // Then: 식비 카테고리만 반환
    assertThat(stats).hasSize(1);
    assertThat(stats.get(0).categoryName()).isEqualTo("식비");
    assertThat(stats.get(0).totalAmount()).isEqualByComparingTo(BigDecimal.valueOf(10000));
  }

  @Test
  @DisplayName("날짜 범위 필터링 - 기간 내 지출만 집계")
  void findCategoryExpenseStats_WithDateRange() {
    // Given: 다양한 날짜의 지출 생성
    LocalDateTime now = LocalDateTime.now();

    createExpense(familyUuid, userUuid, foodCategory.getUuid(), BigDecimal.valueOf(10000), now.minusDays(1)); // 최근
    createExpense(familyUuid, userUuid, foodCategory.getUuid(), BigDecimal.valueOf(20000), now.minusDays(10)); // 오래됨

    // When: 최근 5일 내 지출만 조회
    List<CategoryExpenseProjection> stats = dashboardRepository.getCategoryExpenseStats(
        familyUuid,
        null,
        now.minusDays(5),
        now
    );

    // Then: 최근 지출만 포함
    assertThat(stats).hasSize(1);
    assertThat(stats.get(0).totalAmount()).isEqualByComparingTo(BigDecimal.valueOf(10000));
  }

  @Test
  @DisplayName("삭제된 지출은 통계에서 제외")
  void findCategoryExpenseStats_ExcludeDeletedExpenses() {
    // Given: 활성 지출과 삭제된 지출 생성
    LocalDateTime now = LocalDateTime.now();

    Expense activeExpense = createExpense(familyUuid, userUuid, foodCategory.getUuid(), BigDecimal.valueOf(10000), now);
    Expense deletedExpense = createExpense(familyUuid, userUuid, foodCategory.getUuid(), BigDecimal.valueOf(20000), now);

    // 지출 삭제 (Soft Delete)
    deletedExpense.delete();
    expenseRepository.save(deletedExpense);

    // When: 통계 조회
    List<CategoryExpenseProjection> stats = dashboardRepository.getCategoryExpenseStats(
        familyUuid,
        null,
        now.minusDays(1),
        now.plusDays(1)
    );

    // Then: 활성 지출만 집계
    assertThat(stats).hasSize(1);
    assertThat(stats.get(0).totalAmount()).isEqualByComparingTo(BigDecimal.valueOf(10000));
  }

  @Test
  @DisplayName("지출이 없을 때 - 빈 리스트 반환")
  void findCategoryExpenseStats_NoExpenses() {
    // Given: 지출 데이터 없음
    LocalDateTime now = LocalDateTime.now();

    // When: 통계 조회
    List<CategoryExpenseProjection> stats = dashboardRepository.getCategoryExpenseStats(familyUuid,
                                                                                        null,
                                                                                        now.minusDays(7),
                                                                                        now
    );

    // Then: 빈 리스트
    assertThat(stats).isEmpty();
  }

  @Test
  @DisplayName("지출이 없을 때 - 합계는 0")
  void getTotalExpenseAmount_NoExpenses() {
    // Given: 지출 데이터 없음
    LocalDateTime now = LocalDateTime.now();

    // When: 합계 조회
    BigDecimal total = dashboardRepository.getTotalExpenseAmount(
        familyUuid,
        null,
        now.minusDays(7),
        now
    );

    // Then: 0 반환
    assertThat(total).isEqualByComparingTo(BigDecimal.ZERO);
  }

  // ===== Helper Methods =====

  private Expense createExpense(CustomUuid familyUuid, CustomUuid userUuid, CustomUuid categoryUuid,
                                BigDecimal amount, LocalDateTime date) {
    Family family = familyRepository.findByUuid(familyUuid)
                                    .orElseThrow(() -> new RuntimeException("Family not found"));

    Expense expense = Expense.builder()
                             .uuid(CustomUuid.generate())
                             .family(family)  // JPA 연관관계 사용
                             .userUuid(userUuid)
                             .categoryUuid(categoryUuid)
                             .amount(amount)
                             .description("테스트 지출")
                             .date(date)
                             .status(ExpenseStatus.ACTIVE)
                             .build();
    return expenseRepository.save(expense);
  }
}

