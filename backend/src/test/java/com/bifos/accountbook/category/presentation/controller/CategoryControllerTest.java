package com.bifos.accountbook.category.presentation.controller;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.bifos.accountbook.category.application.dto.CreateCategoryRequest;
import com.bifos.accountbook.category.application.dto.UpdateCategoryRequest;
import com.bifos.accountbook.category.domain.entity.Category;
import com.bifos.accountbook.category.domain.value.CategoryColor;
import com.bifos.accountbook.family.domain.entity.Family;
import com.bifos.accountbook.shared.AbstractControllerTest;
import com.bifos.accountbook.user.domain.entity.User;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;

@DisplayName("카테고리 컨트롤러 통합 테스트")
class CategoryControllerTest extends AbstractControllerTest {

  private User testUser;
  private Family testFamily;
  private Category testCategory;

  @BeforeEach
  void setUp() {
    doTransactionWithoutResult(() -> {
      testUser = fixtures.getDefaultUser();
      testFamily = fixtures.families.family().build();
      testCategory = fixtures.categories.category(testFamily).build();
    });
  }

  private org.springframework.test.web.servlet.ResultActions createWithColor(String color) throws Exception {
    CreateCategoryRequest request = new CreateCategoryRequest("식비", color, null, null);
    return mockMvc.perform(post("/api/v1/families/{familyUuid}/categories", testFamily.getUuid().getValue())
                               .contentType(MediaType.APPLICATION_JSON)
                               .header("X-User-UUID", testUser.getUuid().getValue())
                               .content(objectMapper.writeValueAsString(request)));
  }

  @Test
  @DisplayName("OKLCH 색상으로 카테고리를 만들 수 있다")
  void create_oklchColor() throws Exception {
    createWithColor("oklch(0.560 0.140 35)")
        .andExpect(status().isCreated())
        .andExpect(jsonPath("$.data.color").value("oklch(0.560 0.140 35)"));
  }

  @Test
  @DisplayName("hex 색상으로 카테고리를 만들 수 있다")
  void create_hexColor() throws Exception {
    createWithColor("#10b981")
        .andExpect(status().isCreated())
        .andExpect(jsonPath("$.data.color").value("#10b981"));
  }

  @Test
  @DisplayName("지원하지 않는 색상 형식이면 400 과 검증 문구를 돌려준다")
  void create_invalidColor() throws Exception {
    createWithColor("red")
        .andExpect(status().isBadRequest())
        .andExpect(jsonPath("$.errors[0].field").value("color"))
        .andExpect(jsonPath("$.errors[0].message").value(CategoryColor.MESSAGE));
  }

  @Test
  @DisplayName("OKLCH 값 사이에 공백이 둘이면 400 이다")
  void create_oklchDoubleSpace() throws Exception {
    createWithColor("oklch(0.560  0.140 35)")
        .andExpect(status().isBadRequest())
        .andExpect(jsonPath("$.errors[0].field").value("color"));
  }

  @Test
  @DisplayName("색상을 OKLCH 로 수정할 수 있다")
  void update_oklchColor() throws Exception {
    UpdateCategoryRequest request = new UpdateCategoryRequest(null, "oklch(0.520 0.120 152)", null, null);

    mockMvc.perform(put("/api/v1/families/{familyUuid}/categories/{categoryUuid}",
                        testFamily.getUuid().getValue(), testCategory.getUuid().getValue())
                        .contentType(MediaType.APPLICATION_JSON)
                        .header("X-User-UUID", testUser.getUuid().getValue())
                        .content(objectMapper.writeValueAsString(request)))
           .andExpect(status().isOk())
           .andExpect(jsonPath("$.data.color").value("oklch(0.520 0.120 152)"));
  }
}
