package com.bifos.accountbook.config.security;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;

@DisplayName("연동 토큰 허용 목록")
class ApiTokenAccessPolicyTest {

  private static final String FAMILY = "11111111-1111-1111-1111-111111111111";
  private static final String ITEM = "22222222-2222-2222-2222-222222222222";

  private final ApiTokenAccessPolicy policy = new ApiTokenAccessPolicy();

  @ParameterizedTest(name = "{0} {1} 은 허용한다")
  @CsvSource({
      "GET, /api/v1/families",
      "GET, /api/v1/families/" + FAMILY + "/categories",
      "GET, /api/v1/families/" + FAMILY + "/expenses",
      "POST, /api/v1/families/" + FAMILY + "/expenses",
      "GET, /api/v1/families/" + FAMILY + "/expenses/" + ITEM,
      "PUT, /api/v1/families/" + FAMILY + "/expenses/" + ITEM,
      "DELETE, /api/v1/families/" + FAMILY + "/expenses/" + ITEM,
      "GET, /api/v1/families/" + FAMILY + "/incomes",
      "POST, /api/v1/families/" + FAMILY + "/incomes",
      "GET, /api/v1/families/" + FAMILY + "/incomes/" + ITEM,
      "PUT, /api/v1/families/" + FAMILY + "/incomes/" + ITEM,
      "DELETE, /api/v1/families/" + FAMILY + "/incomes/" + ITEM
  })
  void allowedRequests(String method, String uri) {
    assertThat(policy.isAllowed(method, uri))
        .as("%s %s 는 허용 목록에 있어야 한다", method, uri)
        .isTrue();
  }

  @ParameterizedTest(name = "{0} {1} 은 거부한다")
  @CsvSource({
      "DELETE, /api/v1/families/" + FAMILY,
      "POST, /api/v1/families",
      "GET, /api/v1/users/me/api-tokens",
      "POST, /api/v1/families/" + FAMILY + "/categories",
      "GET, /api/v1/families/" + FAMILY + "/expenses-extra",
      "PATCH, /api/v1/families/" + FAMILY + "/expenses/" + ITEM,
      "GET, /api/v1/families/" + FAMILY + "/dashboard/stats/monthly"
  })
  void deniedRequests(String method, String uri) {
    assertThat(policy.isAllowed(method, uri))
        .as("%s %s 는 허용 목록 밖이어야 한다", method, uri)
        .isFalse();
  }
}
