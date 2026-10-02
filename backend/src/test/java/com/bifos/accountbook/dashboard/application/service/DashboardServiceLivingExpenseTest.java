package com.bifos.accountbook.dashboard.application.service;

import static org.assertj.core.api.Assertions.assertThat;

import com.bifos.accountbook.budgetitem.application.dto.BudgetItemRequest;
import com.bifos.accountbook.budgetitem.application.dto.BudgetItemResponse;
import com.bifos.accountbook.budgetitem.application.service.BudgetItemService;
import com.bifos.accountbook.category.domain.entity.Category;
import com.bifos.accountbook.dashboard.application.dto.MonthlyStatsResponse;
import com.bifos.accountbook.family.application.dto.CreateFamilyRequest;
import com.bifos.accountbook.family.application.service.FamilyService;
import com.bifos.accountbook.family.domain.entity.Family;
import com.bifos.accountbook.family.domain.repository.FamilyRepository;
import com.bifos.accountbook.shared.TestFixturesSupport;
import com.bifos.accountbook.shared.value.CustomUuid;
import com.bifos.accountbook.user.domain.entity.User;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.YearMonth;
import java.util.List;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;

/** 월 통계의 monthlyExpense 가 생활비 합계 규칙을 따르는지 검증한다 (ADR-B25). */
@DisplayName("DashboardService 생활비 합계 통합 테스트")
class DashboardServiceLivingExpenseTest extends TestFixturesSupport {

  @Autowired private DashboardService dashboardService;

  @Autowired private BudgetItemService budgetItemService;

  @Autowired private FamilyService familyService;

  @Autowired private FamilyRepository familyRepository;

  private User testUser;
  private Family testFamily;
  private Category foodCategory;
  private Category allowanceCategory;
  private LocalDateTime testDate;
  private YearMonth testYearMonth;

  @BeforeEach
  void setUp() {
    testUser = fixtures.getDefaultUser();
    var familyResponse =
        familyService.createFamily(
            testUser.getUuid(),
            CreateFamilyRequest.builder()
                .name("생활비 테스트 가족")
                .monthlyBudget(new BigDecimal("1000000"))
                .build());
    testFamily =
        familyRepository.findByUuid(CustomUuid.from(familyResponse.getUuid())).orElseThrow();

    foodCategory = fixtures.findCategoryByName(testFamily, "식비");
    allowanceCategory = fixtures.findCategoryByName(testFamily, "교통비");
    testDate = LocalDateTime.now();
    testYearMonth = YearMonth.from(testDate);
  }

  private BigDecimal monthlyExpense() {
    MonthlyStatsResponse stats =
        dashboardService.getMonthlyStats(
            testUser.getUuid(),
            testFamily.getUuid(),
            testYearMonth.getYear(),
            testYearMonth.getMonthValue());
    return stats.getMonthlyExpense();
  }

  @Test
  @DisplayName("반복 지출이 만든 지출과 예산 항목 카테고리의 지출은 생활비에서 빠진다")
  void monthlyExpense_excludesRecurringAndBudgetItemExpenses() {
    fixtures
        .expenses
        .expense(testFamily, foodCategory)
        .amount(new BigDecimal("10000"))
        .date(testDate)
        .build();
    fixtures
        .expenses
        .expense(testFamily, foodCategory)
        .amount(new BigDecimal("20000"))
        .date(testDate)
        .recurringExpenseUuid(CustomUuid.generate().getValue())
        .build();
    fixtures
        .expenses
        .expense(testFamily, allowanceCategory)
        .amount(new BigDecimal("30000"))
        .date(testDate)
        .build();

    BudgetItemResponse item =
        budgetItemService.createBudgetItem(
            testUser.getUuid(),
            testFamily.getUuid(),
            new BudgetItemRequest(
                "용돈", new BigDecimal("400000"), List.of(allowanceCategory.getUuid().getValue())));

    assertThat(monthlyExpense()).isEqualByComparingTo("10000");

    // 항목을 지우면 그 카테고리의 지출이 다시 생활비에 들어간다
    budgetItemService.deleteBudgetItem(
        testUser.getUuid(), testFamily.getUuid(), CustomUuid.from(item.getUuid()));

    assertThat(monthlyExpense()).isEqualByComparingTo("40000");
  }
}
