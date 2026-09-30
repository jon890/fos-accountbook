package com.bifos.accountbook.config.security;

import java.util.List;
import java.util.Set;
import org.springframework.http.server.PathContainer;
import org.springframework.stereotype.Component;
import org.springframework.web.util.pattern.PathPattern;
import org.springframework.web.util.pattern.PathPatternParser;

/**
 * 연동 토큰으로 부를 수 있는 경로 허용 목록 (ADR-B18).
 * 목록은 backend/docs/flow.md 의 「연동 토큰으로 부르기」 절과 같게 유지한다.
 * 경로는 문자열 접두사가 아니라 패턴 전체로 비교해 {@code /expenses-extra} 같은 경로가 통과하지 않게 한다.
 */
@Component
public class ApiTokenAccessPolicy {

  private static final PathPatternParser PARSER = PathPatternParser.defaultInstance;

  private final List<Rule> rules = List.of(
      rule("/api/v1/families", "GET"),
      rule("/api/v1/families/{familyUuid}/categories", "GET"),
      rule("/api/v1/families/{familyUuid}/expenses", "GET", "POST"),
      rule("/api/v1/families/{familyUuid}/expenses/{expenseUuid}", "GET", "PUT", "DELETE"),
      rule("/api/v1/families/{familyUuid}/incomes", "GET", "POST"),
      rule("/api/v1/families/{familyUuid}/incomes/{incomeUuid}", "GET", "PUT", "DELETE"));

  public boolean isAllowed(String method, String requestUri) {
    if (method == null || requestUri == null) {
      return false;
    }
    PathContainer path = PathContainer.parsePath(requestUri);
    return rules.stream().anyMatch(rule -> rule.matches(method, path));
  }

  private static Rule rule(String pattern, String... methods) {
    return new Rule(PARSER.parse(pattern), Set.of(methods));
  }

  private record Rule(PathPattern pattern, Set<String> methods) {

    boolean matches(String method, PathContainer path) {
      return methods.contains(method) && pattern.matches(path);
    }
  }
}
