package com.bifos.accountbook.income.presentation.controller;

import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.hasSize;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.bifos.accountbook.category.domain.entity.Category;
import com.bifos.accountbook.family.domain.entity.Family;
import com.bifos.accountbook.income.application.dto.CreateIncomeRequest;
import com.bifos.accountbook.income.application.dto.IncomeResponse;
import com.bifos.accountbook.income.application.dto.UpdateIncomeRequest;
import com.bifos.accountbook.income.domain.entity.Income;
import com.bifos.accountbook.income.domain.repository.IncomeRepository;
import com.bifos.accountbook.shared.AbstractControllerTest;
import com.bifos.accountbook.user.domain.entity.User;
import com.bifos.accountbook.user.domain.repository.UserRepository;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;

@DisplayName("IncomeController 통합 테스트")
class IncomeControllerTest extends AbstractControllerTest {

  @Autowired private IncomeRepository incomeRepository;

  @Autowired private UserRepository userRepository;

  @Test
  @DisplayName("수입 생성 - 성공")
  void createIncome_Success() throws Exception {
    // Given: TestFixtures로 테스트 데이터 생성
    User user = fixtures.getDefaultUser();
    Family family = fixtures.getDefaultFamily();
    Category category =
        fixtures.categories.category(family).name("급여").color("#00FF00").icon("💰").build();

    CreateIncomeRequest request =
        CreateIncomeRequest.builder()
            .categoryUuid(category.getUuid().getValue())
            .amount(BigDecimal.valueOf(3000000))
            .description("월급")
            .date(LocalDateTime.now())
            .build();

    // When & Then
    mockMvc
        .perform(
            post("/api/v1/families/{familyUuid}/incomes", family.getUuid().getValue())
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
        .andExpect(status().isCreated())
        .andExpect(jsonPath("$.success").value(true))
        .andExpect(jsonPath("$.message").value("수입이 등록되었습니다"))
        .andExpect(jsonPath("$.data.amount").value(3000000))
        .andExpect(jsonPath("$.data.description").value("월급"))
        .andExpect(jsonPath("$.data.uuid").exists());

    // 데이터베이스 검증
    assertThat(
            incomeRepository
                .findAllByFamilyUuid(
                    family.getUuid(), org.springframework.data.domain.PageRequest.of(0, 10))
                .getTotalElements())
        .isEqualTo(1);
  }

  @Test
  @DisplayName("수입 목록 조회 - 성공")
  void getFamilyIncomes_Success() throws Exception {
    // Given: TestFixtures로 테스트 데이터 생성
    Family family = fixtures.getDefaultFamily();
    Category category = fixtures.getDefaultCategory();

    // 수입 2개 생성
    fixtures
        .incomes
        .income(family, category)
        .amount(BigDecimal.valueOf(3000000))
        .description("월급")
        .date(LocalDateTime.now())
        .build();

    fixtures
        .incomes
        .income(family, category)
        .amount(BigDecimal.valueOf(500000))
        .description("보너스")
        .date(LocalDateTime.now().minusDays(1))
        .build();

    // When & Then
    mockMvc
        .perform(get("/api/v1/families/{familyUuid}/incomes", family.getUuid().getValue()))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.success").value(true))
        .andExpect(jsonPath("$.data.items").isArray())
        .andExpect(jsonPath("$.data.items", hasSize(2)))
        .andExpect(jsonPath("$.data.totalElements").value(2))
        .andExpect(
            jsonPath("$.data.items[0].userUuid")
                .value(fixtures.getDefaultUser().getUuid().getValue()))
        .andExpect(jsonPath("$.data.items[0].description").value("월급"))
        .andExpect(jsonPath("$.data.items[1].description").value("보너스"));
  }

  @Test
  @DisplayName("수입 목록 조회 - 페이징")
  void getFamilyIncomes_WithPaging() throws Exception {
    // Given: TestFixtures로 테스트 데이터 생성
    Family family = fixtures.getDefaultFamily();
    Category category = fixtures.getDefaultCategory();

    // 25개 수입 생성
    for (int i = 0; i < 25; i++) {
      fixtures
          .incomes
          .income(family, category)
          .amount(BigDecimal.valueOf(100000 * (i + 1)))
          .description("수입 " + (i + 1))
          .date(LocalDateTime.now().minusDays(i))
          .build();
    }

    // When & Then
    mockMvc
        .perform(
            get("/api/v1/families/{familyUuid}/incomes", family.getUuid().getValue())
                .param("page", "0")
                .param("size", "10"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.data.items", hasSize(10)))
        .andExpect(jsonPath("$.data.totalElements").value(25))
        .andExpect(jsonPath("$.data.totalPages").value(3))
        .andExpect(jsonPath("$.data.currentPage").value(0));
  }

  @Test
  @DisplayName("수입 상세 조회 - 성공")
  void getIncome_Success() throws Exception {
    // Given: TestFixtures로 테스트 데이터 생성
    Family family = fixtures.getDefaultFamily();
    Category category = fixtures.getDefaultCategory();

    Income income =
        fixtures
            .incomes
            .income(family, category)
            .amount(BigDecimal.valueOf(3000000))
            .description("월급")
            .date(LocalDateTime.now())
            .build();

    assertThat(IncomeResponse.fromWithoutCategory(income).getUserUuid())
        .isEqualTo(income.getUserUuid().getValue());

    // When & Then
    mockMvc
        .perform(
            get(
                "/api/v1/families/{familyUuid}/incomes/{incomeUuid}",
                family.getUuid().getValue(),
                income.getUuid().getValue()))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.success").value(true))
        .andExpect(jsonPath("$.data.uuid").value(income.getUuid().getValue()))
        .andExpect(jsonPath("$.data.userUuid").value(income.getUserUuid().getValue()))
        .andExpect(jsonPath("$.data.amount").value(3000000))
        .andExpect(jsonPath("$.data.description").value("월급"));
  }

  @Test
  @DisplayName("수입 수정 - 성공")
  void updateIncome_Success() throws Exception {
    // Given: TestFixtures로 테스트 데이터 생성
    Family family = fixtures.getDefaultFamily();
    Category category = fixtures.getDefaultCategory();

    Income income =
        fixtures
            .incomes
            .income(family, category)
            .amount(BigDecimal.valueOf(3000000))
            .description("월급")
            .date(LocalDateTime.now())
            .build();

    UpdateIncomeRequest request =
        UpdateIncomeRequest.builder()
            .amount(BigDecimal.valueOf(3500000))
            .description("월급 (인상)")
            .build();

    // When & Then
    mockMvc
        .perform(
            put(
                    "/api/v1/families/{familyUuid}/incomes/{incomeUuid}",
                    family.getUuid().getValue(),
                    income.getUuid().getValue())
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.success").value(true))
        .andExpect(jsonPath("$.message").value("수입이 수정되었습니다"))
        .andExpect(jsonPath("$.data.amount").value(3500000))
        .andExpect(jsonPath("$.data.description").value("월급 (인상)"));

    // 데이터베이스 검증
    Income updatedIncome = incomeRepository.findByUuid(income.getUuid()).orElseThrow();
    assertThat(updatedIncome.getAmount()).isEqualByComparingTo(BigDecimal.valueOf(3500000));
    assertThat(updatedIncome.getDescription()).isEqualTo("월급 (인상)");
  }

  @Test
  @DisplayName("수입 삭제 - 성공")
  void deleteIncome_Success() throws Exception {
    // Given: TestFixtures로 테스트 데이터 생성
    Family family = fixtures.getDefaultFamily();
    Category category = fixtures.getDefaultCategory();

    Income income =
        fixtures
            .incomes
            .income(family, category)
            .amount(BigDecimal.valueOf(3000000))
            .description("월급")
            .date(LocalDateTime.now())
            .build();

    // When & Then
    mockMvc
        .perform(
            delete(
                "/api/v1/families/{familyUuid}/incomes/{incomeUuid}",
                family.getUuid().getValue(),
                income.getUuid().getValue()))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.success").value(true))
        .andExpect(jsonPath("$.message").value("수입이 삭제되었습니다"));

    // 데이터베이스 검증 - Soft Delete이므로 조회되지 않아야 함
    assertThat(incomeRepository.findActiveByUuid(income.getUuid())).isEmpty();
  }

  @Test
  @DisplayName("권한 없는 사용자 - 수입 조회 실패")
  void getFamilyIncomes_UnauthorizedUser() throws Exception {
    // Given: 기본 가족 생성 (다른 사용자의 가족)
    Family family = fixtures.getDefaultFamily();

    // 권한 없는 새로운 사용자 생성
    User unauthorizedUser =
        User.builder()
            .provider("google")
            .providerId("unauthorized-user")
            .email("unauthorized@example.com")
            .name("Unauthorized User")
            .build();
    unauthorizedUser = userRepository.save(unauthorizedUser);

    // SecurityContext에 권한 없는 사용자 설정
    UsernamePasswordAuthenticationToken unauthorizedAuth =
        new UsernamePasswordAuthenticationToken(unauthorizedUser.getUuid().getValue(), null, null);
    SecurityContextHolder.getContext().setAuthentication(unauthorizedAuth);

    // When & Then
    mockMvc
        .perform(get("/api/v1/families/{familyUuid}/incomes", family.getUuid().getValue()))
        .andExpect(status().isForbidden())
        .andExpect(jsonPath("$.success").value(false))
        .andExpect(jsonPath("$.code").value("F003")); // NOT_FAMILY_MEMBER
  }
}
