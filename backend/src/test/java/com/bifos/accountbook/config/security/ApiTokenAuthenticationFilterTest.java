package com.bifos.accountbook.config.security;

import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.hasItem;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.bifos.accountbook.apitoken.application.dto.CreateApiTokenRequest;
import com.bifos.accountbook.apitoken.application.dto.CreatedApiTokenResponse;
import com.bifos.accountbook.apitoken.application.service.ApiTokenService;
import com.bifos.accountbook.apitoken.domain.entity.ApiToken;
import com.bifos.accountbook.apitoken.infra.repository.jpa.ApiTokenJpaRepository;
import com.bifos.accountbook.category.domain.entity.Category;
import com.bifos.accountbook.expense.application.dto.CreateExpenseRequest;
import com.bifos.accountbook.expense.application.dto.UpdateExpenseRequest;
import com.bifos.accountbook.expense.infra.repository.jpa.ExpenseJpaRepository;
import com.bifos.accountbook.family.domain.entity.Family;
import com.bifos.accountbook.family.infra.repository.jpa.FamilyJpaRepository;
import com.bifos.accountbook.shared.AbstractControllerTest;
import com.bifos.accountbook.shared.value.CustomUuid;
import com.bifos.accountbook.user.domain.entity.User;
import java.math.BigDecimal;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.test.web.servlet.ResultActions;
import org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder;

@DisplayName("연동 토큰 인증 필터 통합 테스트")
class ApiTokenAuthenticationFilterTest extends AbstractControllerTest {

  @Autowired
  private ApiTokenService apiTokenService;

  @Autowired
  private ApiTokenJpaRepository apiTokenJpaRepository;

  @Autowired
  private ExpenseJpaRepository expenseJpaRepository;

  @Autowired
  private FamilyJpaRepository familyJpaRepository;

  @Autowired
  private JwtTokenProvider jwtTokenProvider;

  private User userA;
  private Family familyA;
  private Category categoryA;
  private CreatedApiTokenResponse tokenA;

  @BeforeEach
  void setUp() {
    userA = fixtures.users.user().email("token-owner@test.com").build();
    familyA = fixtures.families.family().owner(userA).build();
    categoryA = fixtures.categories.category(familyA).build();
    tokenA = apiTokenService.issue(userA.getUuid(), new CreateApiTokenRequest("가계부 봇"));
  }

  private ResultActions perform(MockHttpServletRequestBuilder request, String rawToken) throws Exception {
    SecurityContextHolder.clearContext();
    return mockMvc.perform(request.header("Authorization", "Bearer " + rawToken));
  }

  private String expensesUrl(Family family) {
    return "/api/v1/families/" + family.getUuid().getValue() + "/expenses";
  }

  private String createExpenseBody(Category category, String amount) throws Exception {
    return objectMapper.writeValueAsString(
        new CreateExpenseRequest(category.getUuid().getValue(), new BigDecimal(amount), "점심", null, false));
  }

  private ApiToken storedToken() {
    return apiTokenJpaRepository.findAll().stream()
        .filter(token -> token.getUuid().getValue().equals(tokenA.getUuid()))
        .findFirst()
        .orElseThrow(() -> new AssertionError("저장된 토큰이 없다: " + tokenA.getUuid()));
  }

  @Test
  @DisplayName("토큰 주인으로 자기 가족의 지출을 등록, 조회, 수정, 삭제한다")
  void ownerCanManageExpenses() throws Exception {
    String body = perform(post(expensesUrl(familyA))
        .contentType(MediaType.APPLICATION_JSON)
        .content(createExpenseBody(categoryA, "12000")), tokenA.getToken())
        .andExpect(status().isCreated())
        .andExpect(jsonPath("$.data.amount").value(12000))
        .andReturn().getResponse().getContentAsString();
    String expenseUuid = objectMapper.readTree(body).get("data").get("uuid").asText();

    perform(get(expensesUrl(familyA)), tokenA.getToken())
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.data.items[*].uuid").value(hasItem(expenseUuid)));

    perform(put(expensesUrl(familyA) + "/" + expenseUuid)
        .contentType(MediaType.APPLICATION_JSON)
        .content(objectMapper.writeValueAsString(
            new UpdateExpenseRequest(null, new BigDecimal("15000"), null, null, null))), tokenA.getToken())
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.data.amount").value(15000));

    perform(delete(expensesUrl(familyA) + "/" + expenseUuid), tokenA.getToken())
        .andExpect(status().isOk());

    assertThat(expenseJpaRepository.findActiveByUuid(CustomUuid.from(expenseUuid)))
        .as("삭제한 지출은 활성 목록에서 사라져야 한다")
        .isEmpty();
  }

  @Test
  @DisplayName("토큰 주인이 멤버가 아닌 가족에 지출을 등록하면 403 F003 이다")
  void otherFamilyIsRejectedByService() throws Exception {
    User userB = fixtures.users.user().email("other-family@test.com").build();
    Family familyB = fixtures.families.family().owner(userB).build();
    Category categoryB = fixtures.categories.category(familyB).build();

    perform(post(expensesUrl(familyB))
        .contentType(MediaType.APPLICATION_JSON)
        .content(createExpenseBody(categoryB, "5000")), tokenA.getToken())
        .andExpect(status().isForbidden())
        .andExpect(jsonPath("$.code").value("F003"));
  }

  @Test
  @DisplayName("허용 목록 밖의 경로는 403 A005 이고 가족은 삭제되지 않는다")
  void pathsOutsideAllowListAreForbidden() throws Exception {
    perform(get("/api/v1/users/me/api-tokens"), tokenA.getToken())
        .andExpect(status().isForbidden())
        .andExpect(jsonPath("$.code").value("A005"))
        .andExpect(jsonPath("$.path").value("/api/v1/users/me/api-tokens"));

    perform(delete("/api/v1/families/" + familyA.getUuid().getValue()), tokenA.getToken())
        .andExpect(status().isForbidden())
        .andExpect(jsonPath("$.code").value("A005"));

    assertThat(familyJpaRepository.findActiveByUuid(familyA.getUuid()))
        .as("허용 목록 밖 요청으로 가족이 삭제되면 안 된다")
        .isPresent();
  }

  @Test
  @DisplayName("폐기한 토큰으로 부르면 401 A002 이다")
  void revokedTokenIsUnauthorized() throws Exception {
    perform(get("/api/v1/families"), tokenA.getToken())
        .andExpect(status().isOk());

    apiTokenService.revoke(userA.getUuid(), CustomUuid.from(tokenA.getUuid()));

    perform(get("/api/v1/families"), tokenA.getToken())
        .andExpect(status().isUnauthorized())
        .andExpect(jsonPath("$.code").value("A002"));
  }

  @Test
  @DisplayName("발급하지 않은 fab_ 토큰은 401 A002 이다")
  void unknownTokenIsUnauthorized() throws Exception {
    perform(get("/api/v1/families"), "fab_unknown")
        .andExpect(status().isUnauthorized())
        .andExpect(jsonPath("$.code").value("A002"))
        .andExpect(jsonPath("$.success").value(false));
  }

  @Test
  @DisplayName("첫 호출 뒤 마지막 사용 시각이 저장된다")
  void firstCallRecordsLastUsedAt() throws Exception {
    assertThat(storedToken().getLastUsedAt()).as("발급 직후에는 사용 시각이 없다").isNull();

    perform(get("/api/v1/families"), tokenA.getToken())
        .andExpect(status().isOk());

    assertThat(storedToken().getLastUsedAt()).as("호출 뒤에는 사용 시각이 채워져야 한다").isNotNull();
  }

  @Test
  @DisplayName("JWT 로 부르면 허용 목록과 무관하게 전과 같이 동작한다")
  void jwtStillWorks() throws Exception {
    String jwt = jwtTokenProvider.generateToken(userA).getToken();

    perform(get("/api/v1/users/me/api-tokens"), jwt)
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.data.length()").value(1));
  }
}
