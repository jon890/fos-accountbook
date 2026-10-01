package com.bifos.accountbook.config;

import static org.assertj.core.api.Assertions.assertThat;
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
import com.bifos.accountbook.expense.domain.entity.Expense;
import com.bifos.accountbook.expense.domain.repository.ExpenseRepository;
import com.bifos.accountbook.family.domain.entity.Family;
import com.bifos.accountbook.income.application.dto.CreateIncomeRequest;
import com.bifos.accountbook.income.domain.entity.Income;
import com.bifos.accountbook.income.domain.repository.IncomeRepository;
import com.bifos.accountbook.notification.domain.entity.Notification;
import com.bifos.accountbook.notification.domain.repository.NotificationRepository;
import com.bifos.accountbook.notification.domain.value.NotificationType;
import com.bifos.accountbook.recurring.application.service.RecurringExpenseScheduler;
import com.bifos.accountbook.recurring.presentation.dto.CreateRecurringExpenseRequest;
import com.bifos.accountbook.recurring.presentation.dto.UpdateRecurringExpenseRequest;
import com.bifos.accountbook.shared.AbstractControllerTest;
import com.bifos.accountbook.shared.value.CustomUuid;
import com.bifos.accountbook.user.domain.entity.User;
import java.math.BigDecimal;
import java.time.Clock;
import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneId;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Import;
import org.springframework.context.annotation.Primary;
import org.springframework.http.MediaType;

@Import(BusinessClockIntegrationTest.FixedClockConfig.class)
class BusinessClockIntegrationTest extends AbstractControllerTest {

  private static final ZoneId UTC = ZoneId.of("UTC");
  private static final LocalDateTime BUSINESS_NOW = LocalDateTime.of(2026, 4, 1, 1, 0);

  @TestConfiguration
  static class FixedClockConfig {

    @Bean
    @Primary
    Clock fixedClock() {
      return Clock.fixed(Instant.parse("2026-03-31T16:00:00Z"), UTC);
    }
  }

  @Autowired private RecurringExpenseScheduler recurringExpenseScheduler;

  @Autowired private ExpenseRepository expenseRepository;

  @Autowired private IncomeRepository incomeRepository;

  @Autowired private NotificationRepository notificationRepository;

  @Autowired private ApiTokenService apiTokenService;

  @Autowired private ApiTokenJpaRepository apiTokenJpaRepository;

  @Test
  void appliesFixedBusinessClockToRecurringTransactionsAndDashboard() throws Exception {
    User user = fixtures.getDefaultUser();
    Family family = fixtures.getDefaultFamily();
    Category category = fixtures.getDefaultCategory();
    String familyUuid = family.getUuid().getValue();
    String userUuid = user.getUuid().getValue();

    String recurringResponse =
        mockMvc
            .perform(
                post("/api/v1/families/{familyUuid}/recurring-expenses", familyUuid)
                    .header("X-User-UUID", userUuid)
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(
                        objectMapper.writeValueAsString(
                            new CreateRecurringExpenseRequest(
                                category.getUuid().getValue(),
                                "월 구독",
                                BigDecimal.valueOf(100),
                                1))))
            .andExpect(status().isCreated())
            .andExpect(jsonPath("$.data.generatedThisMonth").value(false))
            .andReturn()
            .getResponse()
            .getContentAsString();
    String recurringUuid =
        objectMapper.readTree(recurringResponse).path("data").path("uuid").asText();

    recurringExpenseScheduler.generateRecurringExpenses();

    assertThat(
            notificationRepository.findByFamilyAndType(
                family.getUuid(), NotificationType.RECURRING_EXPENSE_CREATED))
        .extracting(Notification::getYearMonth)
        .containsExactly("2026-04");

    mockMvc
        .perform(
            put(
                    "/api/v1/families/{familyUuid}/recurring-expenses/{uuid}",
                    familyUuid,
                    recurringUuid)
                .header("X-User-UUID", userUuid)
                .contentType(MediaType.APPLICATION_JSON)
                .content(
                    objectMapper.writeValueAsString(
                        new UpdateRecurringExpenseRequest(
                            null, "월 구독 갱신", BigDecimal.valueOf(100), 1))))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.data.generatedThisMonth").value(true));

    mockMvc
        .perform(
            get("/api/v1/families/{familyUuid}/recurring-expenses", familyUuid)
                .header("X-User-UUID", userUuid))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.data.items[0].generatedThisMonth").value(true));

    mockMvc
        .perform(
            get("/api/v1/families/{familyUuid}/recurring-expenses", familyUuid)
                .header("X-User-UUID", userUuid)
                .param("month", "2026-03"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.data.items[0].generatedThisMonth").value(false));

    String expenseResponse =
        mockMvc
            .perform(
                post("/api/v1/families/{familyUuid}/expenses", familyUuid)
                    .header("X-User-UUID", userUuid)
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(
                        objectMapper.writeValueAsString(
                            new CreateExpenseRequest(
                                category.getUuid().getValue(),
                                BigDecimal.valueOf(200),
                                "기본 날짜 지출",
                                null,
                                false))))
            .andExpect(status().isCreated())
            .andExpect(jsonPath("$.data.date").value("2026-04-01T01:00:00"))
            .andReturn()
            .getResponse()
            .getContentAsString();
    String expenseUuid = objectMapper.readTree(expenseResponse).path("data").path("uuid").asText();

    Expense expense = expenseRepository.findByUuid(CustomUuid.from(expenseUuid)).orElseThrow();
    assertThat(expense.getDate()).isEqualTo(BUSINESS_NOW);

    mockMvc
        .perform(
            post("/api/v1/families/{familyUuid}/expenses", familyUuid)
                .header("X-User-UUID", userUuid)
                .contentType(MediaType.APPLICATION_JSON)
                .content(
                    objectMapper.writeValueAsString(
                        new CreateExpenseRequest(
                            category.getUuid().getValue(),
                            BigDecimal.valueOf(400),
                            "명시 날짜 지출",
                            LocalDateTime.of(2026, 3, 15, 10, 0),
                            false))))
        .andExpect(status().isCreated())
        .andExpect(jsonPath("$.data.date").value("2026-03-15T10:00:00"));

    String incomeResponse =
        mockMvc
            .perform(
                post("/api/v1/families/{familyUuid}/incomes", familyUuid)
                    .header("X-User-UUID", userUuid)
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(
                        objectMapper.writeValueAsString(
                            CreateIncomeRequest.builder()
                                .categoryUuid(category.getUuid().getValue())
                                .amount(BigDecimal.valueOf(300))
                                .description("기본 날짜 수입")
                                .build())))
            .andExpect(status().isCreated())
            .andExpect(jsonPath("$.data.date").value("2026-04-01T01:00:00"))
            .andReturn()
            .getResponse()
            .getContentAsString();
    String incomeUuid = objectMapper.readTree(incomeResponse).path("data").path("uuid").asText();

    Income income = incomeRepository.findByUuid(CustomUuid.from(incomeUuid)).orElseThrow();
    assertThat(income.getDate()).isEqualTo(BUSINESS_NOW);

    mockMvc
        .perform(
            post("/api/v1/families/{familyUuid}/incomes", familyUuid)
                .header("X-User-UUID", userUuid)
                .contentType(MediaType.APPLICATION_JSON)
                .content(
                    objectMapper.writeValueAsString(
                        CreateIncomeRequest.builder()
                            .categoryUuid(category.getUuid().getValue())
                            .amount(BigDecimal.valueOf(500))
                            .description("명시 날짜 수입")
                            .date(LocalDateTime.of(2026, 3, 15, 10, 0))
                            .build())))
        .andExpect(status().isCreated())
        .andExpect(jsonPath("$.data.date").value("2026-03-15T10:00:00"));

    mockMvc
        .perform(
            get("/api/v1/families/{familyUuid}/dashboard/stats/monthly", familyUuid)
                .header("X-User-UUID", userUuid))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.data.year").value(2026))
        .andExpect(jsonPath("$.data.month").value(4))
        .andExpect(jsonPath("$.data.monthlyExpense").value(300))
        .andExpect(jsonPath("$.data.monthlyIncome").value(300));

    mockMvc
        .perform(
            get("/api/v1/families/{familyUuid}/dashboard/stats/monthly", familyUuid)
                .header("X-User-UUID", userUuid)
                .param("year", "2026")
                .param("month", "3"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.data.year").value(2026))
        .andExpect(jsonPath("$.data.month").value(3))
        .andExpect(jsonPath("$.data.monthlyExpense").value(400))
        .andExpect(jsonPath("$.data.monthlyIncome").value(500));
  }

  @Test
  void preservesUtcTimestampsForApiTokenUsageAndRevocation() throws Exception {
    User user = fixtures.getDefaultUser();
    Family family = fixtures.getDefaultFamily();
    CreatedApiTokenResponse issued =
        apiTokenService.issue(user.getUuid(), new CreateApiTokenRequest("시간대 회귀 검증"));

    mockMvc
        .perform(
            get("/api/v1/families/{familyUuid}/expenses", family.getUuid().getValue())
                .header("Authorization", "Bearer " + issued.getToken()))
        .andExpect(status().isOk());

    ApiToken usedToken = storedToken(issued.getUuid());
    assertThat(usedToken.getLastUsedAt()).isEqualTo(LocalDateTime.of(2026, 3, 31, 16, 0));

    apiTokenService.revoke(user.getUuid(), CustomUuid.from(issued.getUuid()));

    ApiToken revokedToken = storedToken(issued.getUuid());
    assertThat(revokedToken.getRevokedAt()).isEqualTo(LocalDateTime.of(2026, 3, 31, 16, 0));
  }

  private ApiToken storedToken(String tokenUuid) {
    return apiTokenJpaRepository.findAll().stream()
        .filter(token -> token.getUuid().getValue().equals(tokenUuid))
        .findFirst()
        .orElseThrow();
  }
}
