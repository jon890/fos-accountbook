package com.bifos.accountbook.expense.presentation.controller;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.bifos.accountbook.category.domain.entity.Category;
import com.bifos.accountbook.category.domain.value.CategoryType;
import com.bifos.accountbook.expense.application.dto.CreateExpenseRequest;
import com.bifos.accountbook.expense.application.dto.UpdateExpenseRequest;
import com.bifos.accountbook.expense.domain.entity.Expense;
import com.bifos.accountbook.family.domain.entity.Family;
import com.bifos.accountbook.shared.AbstractControllerTest;
import java.math.BigDecimal;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;

@DisplayName("ExpenseController 통합 테스트")
class ExpenseControllerTest extends AbstractControllerTest {

  @Test
  @DisplayName("수입 카테고리로 지출을 생성하면 CT005를 반환한다")
  void createExpense_FailsWhenCategoryTypeIsIncome() throws Exception {
    Family family = fixtures.getDefaultFamily();
    Category incomeCategory =
        fixtures
            .categories
            .category(family)
            .name("지출 생성용 수입 카테고리")
            .type(CategoryType.INCOME)
            .build();
    CreateExpenseRequest request =
        new CreateExpenseRequest(
            incomeCategory.getUuid().getValue(),
            BigDecimal.valueOf(10000),
            "잘못된 카테고리 지출",
            null,
            false);

    mockMvc
        .perform(
            post("/api/v1/families/{familyUuid}/expenses", family.getUuid().getValue())
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
        .andExpect(status().isBadRequest())
        .andExpect(jsonPath("$.code").value("CT005"));
  }

  @Test
  @DisplayName("수입 카테고리로 지출을 수정하면 CT005를 반환한다")
  void updateExpense_FailsWhenCategoryTypeIsIncome() throws Exception {
    Family family = fixtures.getDefaultFamily();
    Category expenseCategory = fixtures.getDefaultCategory();
    Category incomeCategory =
        fixtures
            .categories
            .category(family)
            .name("지출 수정용 수입 카테고리")
            .type(CategoryType.INCOME)
            .build();
    Expense expense = fixtures.expenses.expense(family, expenseCategory).build();
    UpdateExpenseRequest request =
        new UpdateExpenseRequest(incomeCategory.getUuid().getValue(), null, null, null, null);

    mockMvc
        .perform(
            put(
                    "/api/v1/families/{familyUuid}/expenses/{expenseUuid}",
                    family.getUuid().getValue(),
                    expense.getUuid().getValue())
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
        .andExpect(status().isBadRequest())
        .andExpect(jsonPath("$.code").value("CT005"));
  }
}
