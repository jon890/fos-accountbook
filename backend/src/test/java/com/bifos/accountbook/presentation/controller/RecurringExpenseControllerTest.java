package com.bifos.accountbook.presentation.controller;

import com.bifos.accountbook.domain.entity.Category;
import com.bifos.accountbook.domain.entity.Family;
import com.bifos.accountbook.domain.entity.User;
import com.bifos.accountbook.domain.value.CustomUuid;
import com.bifos.accountbook.presentation.dto.recurringexpense.CreateRecurringExpenseRequest;
import com.bifos.accountbook.presentation.dto.recurringexpense.UpdateRecurringExpenseRequest;
import java.math.BigDecimal;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@DisplayName("반복 지출 API 통합 테스트")
class RecurringExpenseControllerTest extends AbstractControllerTest {

  private User testUser;
  private Family testFamily;
  private Category testCategory;

  @BeforeEach
  void setUp() {
    doTransactionWithoutResult(() -> {
      testUser = fixtures.getDefaultUser();
      testFamily = fixtures.families.family()
          .owner(testUser)
          .budget(new BigDecimal("1000000.00"))
          .build();
      testCategory = fixtures.categories.category(testFamily)
          .name("고정비")
          .build();
    });
  }

  @Test
  @DisplayName("반복 지출을 등록할 수 있다")
  void createRecurringExpense_Success() throws Exception {
    CreateRecurringExpenseRequest request = new CreateRecurringExpenseRequest(
        testCategory.getUuid().getValue(),
        "넷플릭스",
        new BigDecimal("17000.00"),
        15
    );

    mockMvc.perform(post("/api/v1/families/{familyUuid}/recurring-expenses",
            testFamily.getUuid().getValue())
            .contentType(MediaType.APPLICATION_JSON)
            .header("X-User-UUID", testUser.getUuid().getValue())
            .content(objectMapper.writeValueAsString(request)))
        .andExpect(status().isCreated())
        .andExpect(jsonPath("$.success").value(true))
        .andExpect(jsonPath("$.data.uuid").exists())
        .andExpect(jsonPath("$.data.name").value("넷플릭스"))
        .andExpect(jsonPath("$.data.amount").value(17000.00))
        .andExpect(jsonPath("$.data.dayOfMonth").value(15))
        .andExpect(jsonPath("$.data.status").value("ACTIVE"));
  }

  @Test
  @DisplayName("결제일이 29 이상이면 등록에 실패한다")
  void createRecurringExpense_FailsWhenDayOfMonthExceeds28() throws Exception {
    CreateRecurringExpenseRequest request = new CreateRecurringExpenseRequest(
        testCategory.getUuid().getValue(),
        "넷플릭스",
        new BigDecimal("17000.00"),
        29
    );

    mockMvc.perform(post("/api/v1/families/{familyUuid}/recurring-expenses",
            testFamily.getUuid().getValue())
            .contentType(MediaType.APPLICATION_JSON)
            .header("X-User-UUID", testUser.getUuid().getValue())
            .content(objectMapper.writeValueAsString(request)))
        .andExpect(status().isBadRequest());
  }

  @Test
  @DisplayName("반복 지출 목록을 조회할 수 있다")
  void getRecurringExpenses_Success() throws Exception {
    // Given: 반복 지출 2건 등록
    CreateRecurringExpenseRequest request1 = new CreateRecurringExpenseRequest(
        testCategory.getUuid().getValue(),
        "넷플릭스",
        new BigDecimal("17000.00"),
        15
    );
    CreateRecurringExpenseRequest request2 = new CreateRecurringExpenseRequest(
        testCategory.getUuid().getValue(),
        "통신비",
        new BigDecimal("55000.00"),
        25
    );

    mockMvc.perform(post("/api/v1/families/{familyUuid}/recurring-expenses",
            testFamily.getUuid().getValue())
            .contentType(MediaType.APPLICATION_JSON)
            .header("X-User-UUID", testUser.getUuid().getValue())
            .content(objectMapper.writeValueAsString(request1)))
        .andExpect(status().isCreated());

    mockMvc.perform(post("/api/v1/families/{familyUuid}/recurring-expenses",
            testFamily.getUuid().getValue())
            .contentType(MediaType.APPLICATION_JSON)
            .header("X-User-UUID", testUser.getUuid().getValue())
            .content(objectMapper.writeValueAsString(request2)))
        .andExpect(status().isCreated());

    // When & Then
    mockMvc.perform(get("/api/v1/families/{familyUuid}/recurring-expenses",
            testFamily.getUuid().getValue())
            .header("X-User-UUID", testUser.getUuid().getValue()))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.success").value(true))
        .andExpect(jsonPath("$.data.totalMonthlyAmount").value(72000.00))
        .andExpect(jsonPath("$.data.items").isArray())
        .andExpect(jsonPath("$.data.items.length()").value(2))
        .andExpect(jsonPath("$.data.items[0].generatedThisMonth").value(false))
        .andExpect(jsonPath("$.data.items[1].generatedThisMonth").value(false));
  }

  @Test
  @DisplayName("반복 지출을 수정할 수 있다")
  void updateRecurringExpense_Success() throws Exception {
    // Given: 반복 지출 등록
    CreateRecurringExpenseRequest createRequest = new CreateRecurringExpenseRequest(
        testCategory.getUuid().getValue(),
        "넷플릭스",
        new BigDecimal("17000.00"),
        15
    );

    String createResponse = mockMvc.perform(post(
            "/api/v1/families/{familyUuid}/recurring-expenses",
            testFamily.getUuid().getValue())
            .contentType(MediaType.APPLICATION_JSON)
            .header("X-User-UUID", testUser.getUuid().getValue())
            .content(objectMapper.writeValueAsString(createRequest)))
        .andExpect(status().isCreated())
        .andReturn().getResponse().getContentAsString();

    String uuid = objectMapper.readTree(createResponse).path("data").path("uuid").asText();

    // When: 수정
    UpdateRecurringExpenseRequest updateRequest = new UpdateRecurringExpenseRequest(
        null,
        "넷플릭스 프리미엄",
        new BigDecimal("23000.00"),
        20
    );

    mockMvc.perform(put(
            "/api/v1/families/{familyUuid}/recurring-expenses/{uuid}",
            testFamily.getUuid().getValue(), uuid)
            .contentType(MediaType.APPLICATION_JSON)
            .header("X-User-UUID", testUser.getUuid().getValue())
            .content(objectMapper.writeValueAsString(updateRequest)))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.success").value(true))
        .andExpect(jsonPath("$.data.name").value("넷플릭스 프리미엄"))
        .andExpect(jsonPath("$.data.amount").value(23000.00))
        .andExpect(jsonPath("$.data.dayOfMonth").value(20));

    // Then: 재조회하여 변경값 반영 확인
    mockMvc.perform(get("/api/v1/families/{familyUuid}/recurring-expenses",
            testFamily.getUuid().getValue())
            .header("X-User-UUID", testUser.getUuid().getValue()))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.data.items[0].name").value("넷플릭스 프리미엄"))
        .andExpect(jsonPath("$.data.items[0].amount").value(23000.00));
  }

  @Test
  @DisplayName("반복 지출을 삭제할 수 있다")
  void deleteRecurringExpense_Success() throws Exception {
    // Given: 반복 지출 등록
    CreateRecurringExpenseRequest createRequest = new CreateRecurringExpenseRequest(
        testCategory.getUuid().getValue(),
        "넷플릭스",
        new BigDecimal("17000.00"),
        15
    );

    String createResponse = mockMvc.perform(post(
            "/api/v1/families/{familyUuid}/recurring-expenses",
            testFamily.getUuid().getValue())
            .contentType(MediaType.APPLICATION_JSON)
            .header("X-User-UUID", testUser.getUuid().getValue())
            .content(objectMapper.writeValueAsString(createRequest)))
        .andExpect(status().isCreated())
        .andReturn().getResponse().getContentAsString();

    String uuid = objectMapper.readTree(createResponse).path("data").path("uuid").asText();

    // When: 삭제
    mockMvc.perform(delete(
            "/api/v1/families/{familyUuid}/recurring-expenses/{uuid}",
            testFamily.getUuid().getValue(), uuid)
            .header("X-User-UUID", testUser.getUuid().getValue()))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.success").value(true));

    // Then: 재조회 시 목록에서 사라짐 확인
    mockMvc.perform(get("/api/v1/families/{familyUuid}/recurring-expenses",
            testFamily.getUuid().getValue())
            .header("X-User-UUID", testUser.getUuid().getValue()))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.data.items.length()").value(0));
  }

  @Test
  @DisplayName("존재하지 않는 반복 지출을 수정하면 404를 반환한다")
  void updateRecurringExpense_FailsWhenNotFound() throws Exception {
    String randomUuid = CustomUuid.generate().getValue();

    UpdateRecurringExpenseRequest request = new UpdateRecurringExpenseRequest(
        null,
        "변경된 이름",
        new BigDecimal("20000.00"),
        10
    );

    mockMvc.perform(put(
            "/api/v1/families/{familyUuid}/recurring-expenses/{uuid}",
            testFamily.getUuid().getValue(), randomUuid)
            .contentType(MediaType.APPLICATION_JSON)
            .header("X-User-UUID", testUser.getUuid().getValue())
            .content(objectMapper.writeValueAsString(request)))
        .andExpect(status().isNotFound());
  }

  @Test
  @DisplayName("존재하지 않는 반복 지출을 삭제하면 404를 반환한다")
  void deleteRecurringExpense_FailsWhenNotFound() throws Exception {
    String randomUuid = CustomUuid.generate().getValue();

    mockMvc.perform(delete(
            "/api/v1/families/{familyUuid}/recurring-expenses/{uuid}",
            testFamily.getUuid().getValue(), randomUuid)
            .header("X-User-UUID", testUser.getUuid().getValue()))
        .andExpect(status().isNotFound());
  }

  @Test
  @DisplayName("결제일이 0이면 등록에 실패한다")
  void createRecurringExpense_FailsWhenDayOfMonthIsZero() throws Exception {
    CreateRecurringExpenseRequest request = new CreateRecurringExpenseRequest(
        testCategory.getUuid().getValue(),
        "넷플릭스",
        new BigDecimal("17000.00"),
        0
    );

    mockMvc.perform(post("/api/v1/families/{familyUuid}/recurring-expenses",
            testFamily.getUuid().getValue())
            .contentType(MediaType.APPLICATION_JSON)
            .header("X-User-UUID", testUser.getUuid().getValue())
            .content(objectMapper.writeValueAsString(request)))
        .andExpect(status().isBadRequest());
  }

  @Test
  @DisplayName("결제일이 음수이면 등록에 실패한다")
  void createRecurringExpense_FailsWhenDayOfMonthIsNegative() throws Exception {
    CreateRecurringExpenseRequest request = new CreateRecurringExpenseRequest(
        testCategory.getUuid().getValue(),
        "넷플릭스",
        new BigDecimal("17000.00"),
        -1
    );

    mockMvc.perform(post("/api/v1/families/{familyUuid}/recurring-expenses",
            testFamily.getUuid().getValue())
            .contentType(MediaType.APPLICATION_JSON)
            .header("X-User-UUID", testUser.getUuid().getValue())
            .content(objectMapper.writeValueAsString(request)))
        .andExpect(status().isBadRequest());
  }

  @Test
  @DisplayName("월간 총액 엔드포인트가 반복 지출 합계를 반환한다")
  void getMonthlyTotal_Success() throws Exception {
    // Given: 반복 지출 2건 등록
    CreateRecurringExpenseRequest request1 = new CreateRecurringExpenseRequest(
        testCategory.getUuid().getValue(),
        "넷플릭스",
        new BigDecimal("17000.00"),
        15
    );
    CreateRecurringExpenseRequest request2 = new CreateRecurringExpenseRequest(
        testCategory.getUuid().getValue(),
        "통신비",
        new BigDecimal("55000.00"),
        25
    );

    mockMvc.perform(post("/api/v1/families/{familyUuid}/recurring-expenses",
            testFamily.getUuid().getValue())
            .contentType(MediaType.APPLICATION_JSON)
            .header("X-User-UUID", testUser.getUuid().getValue())
            .content(objectMapper.writeValueAsString(request1)))
        .andExpect(status().isCreated());

    mockMvc.perform(post("/api/v1/families/{familyUuid}/recurring-expenses",
            testFamily.getUuid().getValue())
            .contentType(MediaType.APPLICATION_JSON)
            .header("X-User-UUID", testUser.getUuid().getValue())
            .content(objectMapper.writeValueAsString(request2)))
        .andExpect(status().isCreated());

    // When & Then
    mockMvc.perform(get(
            "/api/v1/families/{familyUuid}/recurring-expenses/monthly-total",
            testFamily.getUuid().getValue())
            .header("X-User-UUID", testUser.getUuid().getValue()))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.success").value(true))
        .andExpect(jsonPath("$.data").value(72000.00));
  }

  @Test
  @DisplayName("반복 지출이 없으면 월간 총액이 0이다")
  void getMonthlyTotal_EmptyWhenNoRecurringExpenses() throws Exception {
    mockMvc.perform(get(
            "/api/v1/families/{familyUuid}/recurring-expenses/monthly-total",
            testFamily.getUuid().getValue())
            .header("X-User-UUID", testUser.getUuid().getValue()))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.success").value(true))
        .andExpect(jsonPath("$.data").value(0));
  }

  @Test
  @DisplayName("삭제된 반복 지출은 목록에서 제외된다")
  void deletedRecurringExpense_ExcludedFromList() throws Exception {
    // Given: 반복 지출 2건 등록
    CreateRecurringExpenseRequest request1 = new CreateRecurringExpenseRequest(
        testCategory.getUuid().getValue(),
        "넷플릭스",
        new BigDecimal("17000.00"),
        15
    );
    CreateRecurringExpenseRequest request2 = new CreateRecurringExpenseRequest(
        testCategory.getUuid().getValue(),
        "통신비",
        new BigDecimal("55000.00"),
        25
    );

    mockMvc.perform(post("/api/v1/families/{familyUuid}/recurring-expenses",
            testFamily.getUuid().getValue())
            .contentType(MediaType.APPLICATION_JSON)
            .header("X-User-UUID", testUser.getUuid().getValue())
            .content(objectMapper.writeValueAsString(request1)))
        .andExpect(status().isCreated());

    String createResponse = mockMvc.perform(post(
            "/api/v1/families/{familyUuid}/recurring-expenses",
            testFamily.getUuid().getValue())
            .contentType(MediaType.APPLICATION_JSON)
            .header("X-User-UUID", testUser.getUuid().getValue())
            .content(objectMapper.writeValueAsString(request2)))
        .andExpect(status().isCreated())
        .andReturn().getResponse().getContentAsString();

    String deletedUuid = objectMapper.readTree(createResponse)
        .path("data").path("uuid").asText();

    // When: 두 번째 항목 삭제
    mockMvc.perform(delete(
            "/api/v1/families/{familyUuid}/recurring-expenses/{uuid}",
            testFamily.getUuid().getValue(), deletedUuid)
            .header("X-User-UUID", testUser.getUuid().getValue()))
        .andExpect(status().isOk());

    // Then: 목록에 1건만 남고 월간 총액도 변경됨
    mockMvc.perform(get("/api/v1/families/{familyUuid}/recurring-expenses",
            testFamily.getUuid().getValue())
            .header("X-User-UUID", testUser.getUuid().getValue()))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.data.items.length()").value(1))
        .andExpect(jsonPath("$.data.items[0].name").value("넷플릭스"))
        .andExpect(jsonPath("$.data.totalMonthlyAmount").value(17000.00));
  }

  @Test
  @DisplayName("다른 가족의 반복 지출에 접근하면 403을 반환한다")
  void createRecurringExpense_FailsWithForbiddenForOtherFamily() throws Exception {
    // Given: 다른 가족 UUID
    String otherFamilyUuid = CustomUuid.generate().getValue();

    CreateRecurringExpenseRequest request = new CreateRecurringExpenseRequest(
        testCategory.getUuid().getValue(),
        "넷플릭스",
        new BigDecimal("17000.00"),
        15
    );

    // When & Then
    mockMvc.perform(post("/api/v1/families/{familyUuid}/recurring-expenses",
            otherFamilyUuid)
            .contentType(MediaType.APPLICATION_JSON)
            .header("X-User-UUID", testUser.getUuid().getValue())
            .content(objectMapper.writeValueAsString(request)))
        .andExpect(status().isForbidden());
  }
}
