package com.bifos.accountbook.budgetitem.presentation.controller;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.bifos.accountbook.budgetitem.application.dto.BudgetItemRequest;
import com.bifos.accountbook.budgetitem.application.service.BudgetItemService;
import com.bifos.accountbook.category.domain.entity.Category;
import com.bifos.accountbook.category.domain.value.CategoryType;
import com.bifos.accountbook.family.domain.entity.Family;
import com.bifos.accountbook.shared.AbstractControllerTest;
import com.bifos.accountbook.user.domain.entity.User;
import java.math.BigDecimal;
import java.util.List;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.ResultActions;

@DisplayName("BudgetItemController 통합 테스트")
class BudgetItemControllerTest extends AbstractControllerTest {

  @Autowired private BudgetItemService budgetItemService;

  private Family family;
  private Category food;
  private Category snack;
  private Category taxi;

  @BeforeEach
  void setUp() {
    fixtures.getDefaultUser();
    family = fixtures.getDefaultFamily();
    food = fixtures.categories.category(family).name("식비").build();
    snack = fixtures.categories.category(family).name("간식").build();
    taxi = fixtures.categories.category(family).name("택시").build();
  }

  private String basePath() {
    return "/api/v1/families/" + family.getUuid().getValue() + "/budget-items";
  }

  private ResultActions create(String name, int limit, Category... categories) throws Exception {
    return mockMvc.perform(
        post(basePath())
            .contentType(MediaType.APPLICATION_JSON)
            .content(objectMapper.writeValueAsString(request(name, limit, categories))));
  }

  private BudgetItemRequest request(String name, int limit, Category... categories) {
    return new BudgetItemRequest(
        name,
        BigDecimal.valueOf(limit),
        List.of(categories).stream().map(c -> c.getUuid().getValue()).toList());
  }

  private String createdUuid(String name, int limit, Category... categories) throws Exception {
    String body =
        create(name, limit, categories)
            .andExpect(status().isCreated())
            .andReturn()
            .getResponse()
            .getContentAsString();
    return objectMapper.readTree(body).path("data").path("uuid").asText();
  }

  @Test
  @DisplayName("지출 카테고리 둘로 예산 항목을 만들면 201 과 카테고리 묶음을 돌려준다")
  void create_success() throws Exception {
    create("남편 용돈", 400000, food, snack)
        .andExpect(status().isCreated())
        .andExpect(jsonPath("$.data.name").value("남편 용돈"))
        .andExpect(jsonPath("$.data.categoryUuids.length()").value(2));
  }

  @Test
  @DisplayName("목록은 만든 순서로 나온다")
  void list_orderedByCreation() throws Exception {
    createdUuid("첫째", 100, food);
    createdUuid("둘째", 200, snack);

    mockMvc
        .perform(get(basePath()))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.data.length()").value(2))
        .andExpect(jsonPath("$.data[0].name").value("첫째"))
        .andExpect(jsonPath("$.data[0].categoryUuids.length()").value(1))
        .andExpect(jsonPath("$.data[1].name").value("둘째"));
  }

  @Test
  @DisplayName("수정하면 카테고리 묶음이 통째로 바뀐다")
  void update_replacesCategories() throws Exception {
    String uuid = createdUuid("남편 용돈", 400000, food, snack);

    mockMvc
        .perform(
            put(basePath() + "/" + uuid)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request("남편 용돈", 500000, snack, taxi))))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.data.monthlyLimit").value(500000))
        .andExpect(jsonPath("$.data.categoryUuids.length()").value(2))
        .andExpect(jsonPath("$.data.categoryUuids[0]").value(snack.getUuid().getValue()))
        .andExpect(jsonPath("$.data.categoryUuids[1]").value(taxi.getUuid().getValue()));

    mockMvc
        .perform(get(basePath()))
        .andExpect(jsonPath("$.data[0].categoryUuids.length()").value(2));
    // 빠진 식비는 다른 항목이 쓸 수 있다
    create("식비 한도", 300000, food).andExpect(status().isCreated());
  }

  @Test
  @DisplayName("삭제하면 목록에서 빠지고 그 카테고리를 다른 항목에 다시 넣을 수 있다")
  void delete_releasesCategories() throws Exception {
    String uuid = createdUuid("남편 용돈", 400000, food);

    mockMvc.perform(delete(basePath() + "/" + uuid)).andExpect(status().isOk());

    mockMvc
        .perform(get(basePath()))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.data.length()").value(0));
    create("새 항목", 100000, food).andExpect(status().isCreated());
  }

  @Test
  @DisplayName("다른 항목에 속한 카테고리로 만들면 BI002 를 돌려준다")
  void create_fails_whenCategoryConflicts() throws Exception {
    createdUuid("남편 용돈", 400000, food);

    create("아내 용돈", 400000, food, snack)
        .andExpect(status().isConflict())
        .andExpect(jsonPath("$.code").value("BI002"));
  }

  @Test
  @DisplayName("수입 카테고리로 만들면 CT005 를 돌려준다")
  void create_fails_whenIncomeCategory() throws Exception {
    Category salary =
        fixtures.categories.category(family).name("월급").type(CategoryType.INCOME).build();

    create("잘못된 항목", 100000, salary)
        .andExpect(status().isBadRequest())
        .andExpect(jsonPath("$.code").value("CT005"));
  }

  @Test
  @DisplayName("같은 이름이면 BI004 를 돌려준다")
  void create_fails_whenNameDuplicated() throws Exception {
    createdUuid("남편 용돈", 400000, food);

    create("남편 용돈", 100000, snack)
        .andExpect(status().isConflict())
        .andExpect(jsonPath("$.code").value("BI004"));
  }

  @Test
  @DisplayName("카테고리가 비어 있으면 400 이다")
  void create_fails_whenCategoriesEmpty() throws Exception {
    create("빈 항목", 100000).andExpect(status().isBadRequest());
  }

  @Test
  @DisplayName("열한 번째 항목을 만들면 BI003 을 돌려준다")
  void create_fails_whenLimitExceeded() throws Exception {
    // 카테고리는 가족 단위로 캐시되므로 첫 요청 전에 모두 만든다
    List<Category> categories = new java.util.ArrayList<>();
    for (int i = 0; i < 10; i++) {
      categories.add(fixtures.categories.category(family).name("카테고리" + i).build());
    }
    for (int i = 0; i < 10; i++) {
      createdUuid("항목" + i, 1000, categories.get(i));
    }

    create("열한 번째", 1000, food)
        .andExpect(status().isBadRequest())
        .andExpect(jsonPath("$.code").value("BI003"));
  }

  @Test
  @DisplayName("없는 항목을 수정하면 BI001 을 돌려준다")
  void update_fails_whenNotFound() throws Exception {
    mockMvc
        .perform(
            put(basePath() + "/" + java.util.UUID.randomUUID())
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request("없는 항목", 1000, food))))
        .andExpect(status().isNotFound())
        .andExpect(jsonPath("$.code").value("BI001"));
  }

  @Test
  @DisplayName("다른 가족의 항목은 수정과 삭제에서 BI001 을 돌려준다")
  void updateAndDelete_fail_whenOtherFamilyItem() throws Exception {
    User otherUser = fixtures.users.getOtherUser();
    Family otherFamily = fixtures.families.family().owner(otherUser).build();
    Category otherCategory = fixtures.categories.category(otherFamily).name("타가족").build();
    String otherItemUuid =
        budgetItemService
            .createBudgetItem(
                otherUser.getUuid(), otherFamily.getUuid(), request("타가족 항목", 1000, otherCategory))
            .getUuid();

    mockMvc
        .perform(
            put(basePath() + "/" + otherItemUuid)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request("수정", 1000, food))))
        .andExpect(status().isNotFound())
        .andExpect(jsonPath("$.code").value("BI001"));
    mockMvc
        .perform(delete(basePath() + "/" + otherItemUuid))
        .andExpect(status().isNotFound())
        .andExpect(jsonPath("$.code").value("BI001"));
  }

  @Test
  @DisplayName("다른 가족의 카테고리로 만들면 CT001 을 돌려준다")
  void create_fails_whenOtherFamilyCategory() throws Exception {
    User otherUser = fixtures.users.getOtherUser();
    Family otherFamily = fixtures.families.family().owner(otherUser).build();
    Category otherCategory = fixtures.categories.category(otherFamily).name("타가족").build();

    create("타가족 카테고리", 1000, otherCategory)
        .andExpect(status().isNotFound())
        .andExpect(jsonPath("$.code").value("CT001"));
  }

  @Test
  @DisplayName("수정에서 다른 항목의 카테고리를 넣으면 BI002 를 돌려준다")
  void update_fails_whenCategoryConflicts() throws Exception {
    createdUuid("첫째", 1000, food);
    String second = createdUuid("둘째", 1000, snack);

    mockMvc
        .perform(
            put(basePath() + "/" + second)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request("둘째", 1000, snack, food))))
        .andExpect(status().isConflict())
        .andExpect(jsonPath("$.code").value("BI002"));
  }

  @Test
  @DisplayName("월 한도가 소수이거나 14자리 정수면 400 이다")
  void create_fails_whenLimitInvalid() throws Exception {
    for (String limit : List.of("0.5", "10000000000000")) {
      mockMvc
          .perform(
              post(basePath())
                  .contentType(MediaType.APPLICATION_JSON)
                  .content(
                      "{\"name\":\"한도\",\"monthlyLimit\":"
                          + limit
                          + ",\"categoryUuids\":[\""
                          + food.getUuid().getValue()
                          + "\"]}"))
          .andExpect(status().isBadRequest());
    }
  }

  @Test
  @DisplayName("공백을 포함해 31자 이상이어도 trim 뒤 30자면 201 이고 trim 한 이름을 저장한다")
  void create_success_whenNameFitsAfterTrim() throws Exception {
    String name = "가".repeat(30);

    create("  " + name + "  ", 1000, food)
        .andExpect(status().isCreated())
        .andExpect(jsonPath("$.data.name").value(name));
  }

  @Test
  @DisplayName("trim 뒤 30자를 넘거나 비어 있으면 400 이다")
  void create_fails_whenNameInvalidAfterTrim() throws Exception {
    create("가".repeat(31), 1000, food).andExpect(status().isBadRequest());
    create("   ", 1000, food).andExpect(status().isBadRequest());
  }
}
