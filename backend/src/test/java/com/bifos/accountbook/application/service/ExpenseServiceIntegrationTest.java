package com.bifos.accountbook.application.service;

import com.bifos.accountbook.application.dto.expense.CreateExpenseRequest;
import com.bifos.accountbook.application.dto.expense.ExpenseResponse;
import com.bifos.accountbook.application.dto.expense.ExpenseSearchRequest;
import com.bifos.accountbook.application.dto.family.CreateFamilyRequest;
import com.bifos.accountbook.application.dto.family.FamilyResponse;
import com.bifos.accountbook.domain.entity.Category;
import com.bifos.accountbook.domain.entity.User;
import com.bifos.accountbook.domain.repository.CategoryRepository;
import com.bifos.accountbook.domain.repository.UserRepository;
import com.bifos.accountbook.domain.value.CustomUuid;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.data.domain.Page;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * ExpenseService 통합 테스트
 * 지출 조회 시 필터링 및 정렬이 올바르게 동작하는지 검증합니다.
 */
@SpringBootTest
@Transactional // 각 테스트 후 자동 롤백
@DisplayName("ExpenseService 통합 테스트")
class ExpenseServiceIntegrationTest {

    @Autowired
    private ExpenseService expenseService;

    @Autowired
    private FamilyService familyService;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private CategoryRepository categoryRepository;

    private User testUser;
    private FamilyResponse testFamily;
    private Category foodCategory;
    private Category cafeCategory;
    private Category transportCategory;

    @BeforeEach
    void setUp() {
        // 테스트 사용자 생성
        testUser = User.builder()
                .email("expense-test@example.com")
                .name("지출 테스트 사용자")
                .provider("google")
                .providerId("expense-test-provider-id")
                .build();
        testUser = userRepository.save(testUser);

        // 테스트 가족 생성 (기본 카테고리 포함)
        CreateFamilyRequest familyRequest = new CreateFamilyRequest("지출 테스트 가족");
        testFamily = familyService.createFamily(testUser.getUuid(), familyRequest);

        // 카테고리 조회
        CustomUuid familyUuid = CustomUuid.from(testFamily.getUuid());
        List<Category> categories = categoryRepository.findAllByFamilyUuid(familyUuid);

        foodCategory = categories.stream()
                .filter(c -> "식비".equals(c.getName()))
                .findFirst()
                .orElseThrow();

        cafeCategory = categories.stream()
                .filter(c -> "카페".equals(c.getName()))
                .findFirst()
                .orElseThrow();

        transportCategory = categories.stream()
                .filter(c -> "교통비".equals(c.getName()))
                .findFirst()
                .orElseThrow();

        // 테스트 지출 데이터 생성
        createTestExpenses();
    }

    private void createTestExpenses() {
        // 2025-01-15 - 식비 30000원
        CreateExpenseRequest expense1 = new CreateExpenseRequest(
                foodCategory.getUuid().getValue(),
                BigDecimal.valueOf(30000),
                "점심 식사",
                LocalDateTime.of(2025, 1, 15, 12, 0));
        expenseService.createExpense(testUser.getUuid(), testFamily.getUuid(), expense1);

        // 2025-01-20 - 카페 5000원
        CreateExpenseRequest expense2 = new CreateExpenseRequest(
                cafeCategory.getUuid().getValue(),
                BigDecimal.valueOf(5000),
                "커피",
                LocalDateTime.of(2025, 1, 20, 15, 0));
        expenseService.createExpense(testUser.getUuid(), testFamily.getUuid(), expense2);

        // 2025-01-25 - 식비 50000원
        CreateExpenseRequest expense3 = new CreateExpenseRequest(
                foodCategory.getUuid().getValue(),
                BigDecimal.valueOf(50000),
                "저녁 식사",
                LocalDateTime.of(2025, 1, 25, 19, 0));
        expenseService.createExpense(testUser.getUuid(), testFamily.getUuid(), expense3);

        // 2025-02-05 - 교통비 20000원
        CreateExpenseRequest expense4 = new CreateExpenseRequest(
                transportCategory.getUuid().getValue(),
                BigDecimal.valueOf(20000),
                "택시",
                LocalDateTime.of(2025, 2, 5, 10, 0));
        expenseService.createExpense(testUser.getUuid(), testFamily.getUuid(), expense4);

        // 2025-02-10 - 식비 40000원
        CreateExpenseRequest expense5 = new CreateExpenseRequest(
                foodCategory.getUuid().getValue(),
                BigDecimal.valueOf(40000),
                "가족 식사",
                LocalDateTime.of(2025, 2, 10, 18, 0));
        expenseService.createExpense(testUser.getUuid(), testFamily.getUuid(), expense5);
    }

    @Test
    @DisplayName("지출 조회 시 날짜 내림차순으로 정렬되어야 한다")
    void getFamilyExpenses_ShouldBeSortedByDateDescending() {
        // Given
        ExpenseSearchRequest searchRequest = ExpenseSearchRequest.builder()
                .page(0)
                .size(10)
                .build();

        // When
        Page<ExpenseResponse> expenses = expenseService.getFamilyExpenses(
                testUser.getUuid(), testFamily.getUuid(), searchRequest);

        // Then
        assertThat(expenses.getContent()).hasSize(5);

        // 날짜가 내림차순으로 정렬되어 있는지 확인 (최신 날짜가 먼저)
        List<ExpenseResponse> expenseList = expenses.getContent();
        assertThat(expenseList.get(0).getDescription()).isEqualTo("가족 식사"); // 2025-02-10
        assertThat(expenseList.get(1).getDescription()).isEqualTo("택시"); // 2025-02-05
        assertThat(expenseList.get(2).getDescription()).isEqualTo("저녁 식사"); // 2025-01-25
        assertThat(expenseList.get(3).getDescription()).isEqualTo("커피"); // 2025-01-20
        assertThat(expenseList.get(4).getDescription()).isEqualTo("점심 식사"); // 2025-01-15
    }

    @Test
    @DisplayName("카테고리 필터링이 올바르게 동작해야 한다")
    void getFamilyExpenses_ShouldFilterByCategory() {
        // Given - 식비 카테고리로 필터링
        ExpenseSearchRequest searchRequest = ExpenseSearchRequest.builder()
                .page(0)
                .size(10)
                .categoryId(foodCategory.getUuid().getValue())
                .build();

        // When
        Page<ExpenseResponse> expenses = expenseService.getFamilyExpenses(
                testUser.getUuid(), testFamily.getUuid(), searchRequest);

        // Then - 식비 카테고리 지출만 3개 조회되어야 함
        assertThat(expenses.getContent()).hasSize(3);
        assertThat(expenses.getTotalElements()).isEqualTo(3);

        // 모든 지출이 식비 카테고리인지 확인
        expenses.getContent().forEach(expense -> {
            assertThat(expense.getCategoryUuid()).isEqualTo(foodCategory.getUuid().getValue());
        });

        // 날짜 내림차순 정렬 확인
        List<ExpenseResponse> expenseList = expenses.getContent();
        assertThat(expenseList.get(0).getDescription()).isEqualTo("가족 식사"); // 2025-02-10
        assertThat(expenseList.get(1).getDescription()).isEqualTo("저녁 식사"); // 2025-01-25
        assertThat(expenseList.get(2).getDescription()).isEqualTo("점심 식사"); // 2025-01-15
    }

    @Test
    @DisplayName("날짜 범위 필터링이 올바르게 동작해야 한다")
    void getFamilyExpenses_ShouldFilterByDateRange() {
        // Given - 2025년 1월 지출만 조회
        ExpenseSearchRequest searchRequest = ExpenseSearchRequest.builder()
                .page(0)
                .size(10)
                .startDate("2025-01-01")
                .endDate("2025-01-31")
                .build();

        // When
        Page<ExpenseResponse> expenses = expenseService.getFamilyExpenses(
                testUser.getUuid(), testFamily.getUuid(), searchRequest);

        // Then - 1월 지출 3개만 조회되어야 함
        assertThat(expenses.getContent()).hasSize(3);
        assertThat(expenses.getTotalElements()).isEqualTo(3);

        // 날짜 내림차순 정렬 확인
        List<ExpenseResponse> expenseList = expenses.getContent();
        assertThat(expenseList.get(0).getDescription()).isEqualTo("저녁 식사"); // 2025-01-25
        assertThat(expenseList.get(1).getDescription()).isEqualTo("커피"); // 2025-01-20
        assertThat(expenseList.get(2).getDescription()).isEqualTo("점심 식사"); // 2025-01-15
    }

    @Test
    @DisplayName("시작 날짜만 지정한 경우 해당 날짜 이후 지출이 조회되어야 한다")
    void getFamilyExpenses_ShouldFilterByStartDateOnly() {
        // Given - 2025-01-20 이후 지출만 조회
        ExpenseSearchRequest searchRequest = ExpenseSearchRequest.builder()
                .page(0)
                .size(10)
                .startDate("2025-01-20")
                .build();

        // When
        Page<ExpenseResponse> expenses = expenseService.getFamilyExpenses(
                testUser.getUuid(), testFamily.getUuid(), searchRequest);

        // Then - 4개 조회되어야 함 (1-15는 제외)
        assertThat(expenses.getContent()).hasSize(4);
        assertThat(expenses.getTotalElements()).isEqualTo(4);

        // 1월 15일 지출은 포함되지 않아야 함
        expenses.getContent().forEach(expense -> {
            assertThat(expense.getDescription()).isNotEqualTo("점심 식사");
        });
    }

    @Test
    @DisplayName("종료 날짜만 지정한 경우 해당 날짜 이전 지출이 조회되어야 한다")
    void getFamilyExpenses_ShouldFilterByEndDateOnly() {
        // Given - 2025-01-31 이전 지출만 조회
        ExpenseSearchRequest searchRequest = ExpenseSearchRequest.builder()
                .page(0)
                .size(10)
                .endDate("2025-01-31")
                .build();

        // When
        Page<ExpenseResponse> expenses = expenseService.getFamilyExpenses(
                testUser.getUuid(), testFamily.getUuid(), searchRequest);

        // Then - 1월 지출 3개만 조회되어야 함
        assertThat(expenses.getContent()).hasSize(3);
        assertThat(expenses.getTotalElements()).isEqualTo(3);

        // 2월 지출은 포함되지 않아야 함
        expenses.getContent().forEach(expense -> {
            assertThat(expense.getDescription()).isNotIn("택시", "가족 식사");
        });
    }

    @Test
    @DisplayName("카테고리와 날짜 범위를 함께 필터링할 수 있어야 한다")
    void getFamilyExpenses_ShouldFilterByCategoryAndDateRange() {
        // Given - 1월 식비만 조회
        ExpenseSearchRequest searchRequest = ExpenseSearchRequest.builder()
                .page(0)
                .size(10)
                .categoryId(foodCategory.getUuid().getValue())
                .startDate("2025-01-01")
                .endDate("2025-01-31")
                .build();

        // When
        Page<ExpenseResponse> expenses = expenseService.getFamilyExpenses(
                testUser.getUuid(), testFamily.getUuid(), searchRequest);

        // Then - 1월 식비 2개만 조회되어야 함
        assertThat(expenses.getContent()).hasSize(2);
        assertThat(expenses.getTotalElements()).isEqualTo(2);

        // 모두 식비 카테고리이고, 1월 지출인지 확인
        List<ExpenseResponse> expenseList = expenses.getContent();
        assertThat(expenseList.get(0).getDescription()).isEqualTo("저녁 식사"); // 2025-01-25
        assertThat(expenseList.get(0).getCategoryUuid()).isEqualTo(foodCategory.getUuid().getValue());
        assertThat(expenseList.get(1).getDescription()).isEqualTo("점심 식사"); // 2025-01-15
        assertThat(expenseList.get(1).getCategoryUuid()).isEqualTo(foodCategory.getUuid().getValue());
    }

    @Test
    @DisplayName("페이징이 올바르게 동작해야 한다")
    void getFamilyExpenses_ShouldSupportPagination() {
        // Given - 페이지 크기 2, 첫 번째 페이지
        ExpenseSearchRequest searchRequest1 = ExpenseSearchRequest.builder()
                .page(0)
                .size(2)
                .build();

        // When - 첫 번째 페이지 조회
        Page<ExpenseResponse> page1 = expenseService.getFamilyExpenses(
                testUser.getUuid(), testFamily.getUuid(), searchRequest1);

        // Then
        assertThat(page1.getContent()).hasSize(2);
        assertThat(page1.getTotalElements()).isEqualTo(5);
        assertThat(page1.getTotalPages()).isEqualTo(3);
        assertThat(page1.getNumber()).isEqualTo(0);
        assertThat(page1.isFirst()).isTrue();
        assertThat(page1.isLast()).isFalse();

        // 최신 2개 지출인지 확인
        assertThat(page1.getContent().get(0).getDescription()).isEqualTo("가족 식사"); // 2025-02-10
        assertThat(page1.getContent().get(1).getDescription()).isEqualTo("택시"); // 2025-02-05

        // Given - 두 번째 페이지
        ExpenseSearchRequest searchRequest2 = ExpenseSearchRequest.builder()
                .page(1)
                .size(2)
                .build();

        // When - 두 번째 페이지 조회
        Page<ExpenseResponse> page2 = expenseService.getFamilyExpenses(
                testUser.getUuid(), testFamily.getUuid(), searchRequest2);

        // Then
        assertThat(page2.getContent()).hasSize(2);
        assertThat(page2.getNumber()).isEqualTo(1);
        assertThat(page2.isFirst()).isFalse();
        assertThat(page2.isLast()).isFalse();

        // 다음 2개 지출인지 확인
        assertThat(page2.getContent().get(0).getDescription()).isEqualTo("저녁 식사"); // 2025-01-25
        assertThat(page2.getContent().get(1).getDescription()).isEqualTo("커피"); // 2025-01-20
    }

    @Test
    @DisplayName("필터 조건에 맞는 지출이 없으면 빈 결과를 반환해야 한다")
    void getFamilyExpenses_ShouldReturnEmptyWhenNoMatch() {
        // Given - 3월 지출 조회 (실제로는 없음)
        ExpenseSearchRequest searchRequest = ExpenseSearchRequest.builder()
                .page(0)
                .size(10)
                .startDate("2025-03-01")
                .endDate("2025-03-31")
                .build();

        // When
        Page<ExpenseResponse> expenses = expenseService.getFamilyExpenses(
                testUser.getUuid(), testFamily.getUuid(), searchRequest);

        // Then
        assertThat(expenses.getContent()).isEmpty();
        assertThat(expenses.getTotalElements()).isEqualTo(0);
        assertThat(expenses.getTotalPages()).isEqualTo(0);
    }

    @Test
    @DisplayName("존재하지 않는 카테고리로 필터링하면 빈 결과를 반환해야 한다")
    void getFamilyExpenses_ShouldReturnEmptyWhenCategoryNotExists() {
        // Given - 존재하지 않는 카테고리 UUID
        ExpenseSearchRequest searchRequest = ExpenseSearchRequest.builder()
                .page(0)
                .size(10)
                .categoryId("00000000-0000-0000-0000-000000000000")
                .build();

        // When
        Page<ExpenseResponse> expenses = expenseService.getFamilyExpenses(
                testUser.getUuid(), testFamily.getUuid(), searchRequest);

        // Then
        assertThat(expenses.getContent()).isEmpty();
        assertThat(expenses.getTotalElements()).isEqualTo(0);
    }
}
