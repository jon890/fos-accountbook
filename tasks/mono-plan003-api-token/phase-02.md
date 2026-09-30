# Phase 02. 백엔드 연동 토큰 인증 필터와 허용 목록

**Execution profile**: deep

## 목표

`Authorization: Bearer fab_...` 요청을 토큰 주인으로 인증하고, 가계부 기록 경로(허용 목록)만 통과시킨다.
외부 에이전트가 사용자 권한 안에서 지출과 수입을 조회, 등록, 수정, 삭제할 수 있게 하는 인증 경계다.

**범위 외**: 토큰 저장과 발급, 목록, 폐기 API 는 phase 01 이 만들었다. 프론트는 phase 03, 04 다. 기존 JWT 인증 동작은 바꾸지 않는다.

## 컨텍스트

- 기존 인증: `backend/src/main/java/com/bifos/accountbook/config/security/JwtAuthenticationFilter.java` (`@Component`, `OncePerRequestFilter`). `Authorization: Bearer ` 뒤 값을 JWT 로 검증하고, 검증에 실패하면 debug 로그만 남기고 인증을 설정하지 않는다. `fab_` 토큰은 JWT 검증에 실패하므로 이미 설정된 인증을 덮어쓰지 않는다.
- 필터 등록: `backend/src/main/java/com/bifos/accountbook/config/SecurityConfig.java` 의 `filterChain` 이 `.addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class)` 로 붙인다. 인증되지 않은 요청은 `anyRequest().authenticated()` 에서 403 이 된다(별도 entry point 없음).
- `@LoginUser` 는 `shared/auth/LoginUserArgumentResolver.java` 가 principal 문자열(userUuid)에서 만든다. 새 필터도 principal 을 userUuid 문자열로 둬야 기존 컨트롤러가 그대로 동작한다.
- phase 01 이 만든 것: `apitoken/application/service/ApiTokenService.java` 의 `findActive(String rawToken)`, `recordUsage(ApiToken, LocalDateTime)`, `issue`, `revoke`, `apitoken/domain/entity/ApiToken.java`.
- 오류 응답 본문은 `shared/dto/ApiErrorResponse.of(ErrorCode, String path)` 로 만든다. 필터에서 던진 예외는 `GlobalExceptionHandler` 가 받지 못하므로 필터가 응답을 직접 쓴다.
- Spring Boot 4 는 Jackson 3 을 쓴다. JSON 직렬화에 주입할 빈 타입은 `tools.jackson.databind.json.JsonMapper` 다. `com.fasterxml.jackson.databind.ObjectMapper` 는 classpath 에 있지만 빈이 없어 주입하면 컨텍스트가 뜨지 않는다.
- 시각은 `config/ClockConfig.java` 의 `Clock` 빈으로 얻는다.
- 가족 권한은 서비스가 검증한다. 지출: `expense/application/service/ExpenseService.java` 의 `createExpense`(`validateAndGetFamily`), `getFamilyExpenses`(`@ValidateFamilyAccess`), `getExpense`, `updateExpense`, `deleteExpense`(`validateFamilyAccess`). 수입: `income/application/service/IncomeService.java` 도 같다. 카테고리 목록은 `CategoryService.getFamilyCategories`(`@ValidateFamilyAccess`). 멤버가 아니면 `ErrorCode.NOT_FAMILY_MEMBER`(403, `F003`).

**근거 문서**: `backend/docs/flow.md` 의 「7. 연동 토큰으로 부르기」 (허용 목록의 단일 소스), `backend/docs/adr.md` 의 ADR-B18, ADR-B09

## 의도 메모

- `fab_` 토큰을 찾지 못하면 이 필터가 401 로 끝낸다. 찾으면 인증을 설정하고 다음 필터로 넘긴다. JWT 필터는 `fab_` 값을 검증하지 못해 아무것도 바꾸지 않는다.
- 경로 비교는 `org.springframework.web.util.pattern.PathPatternParser` 로 만든 `PathPattern` 과 `org.springframework.http.server.PathContainer.parsePath(requestUri)` 로 한다. 문자열 `startsWith` 로 비교하지 않는다(`/families/x/expenses-extra` 같은 경로가 새어 나간다).
- 인증은 기존 context 를 고치지 않고 새로 만든다: `SecurityContext context = SecurityContextHolder.createEmptyContext(); context.setAuthentication(auth); SecurityContextHolder.setContext(context);`
- 권한에 `new SimpleGrantedAuthority("API_TOKEN")` 을 둔다. 인가는 허용 목록이 하고 권한은 로그 구분용이다.

## 작업 항목

### 1. `backend/src/main/java/com/bifos/accountbook/config/security/ApiTokenAccessPolicy.java` (신규)

`@Component`. 허용 목록을 필드로 갖고 `public boolean isAllowed(String method, String requestUri)` 를 제공한다. 그 밖은 모두 false.

| 메서드 | 경로 패턴 |
| --- | --- |
| GET | `/api/v1/families` |
| GET | `/api/v1/families/{familyUuid}/categories` |
| GET, POST | `/api/v1/families/{familyUuid}/expenses` |
| GET, PUT, DELETE | `/api/v1/families/{familyUuid}/expenses/{expenseUuid}` |
| GET, POST | `/api/v1/families/{familyUuid}/incomes` |
| GET, PUT, DELETE | `/api/v1/families/{familyUuid}/incomes/{incomeUuid}` |

### 2. `backend/src/main/java/com/bifos/accountbook/config/security/ApiTokenAuthenticationFilter.java` (신규)

`@Component`, `OncePerRequestFilter`. 생성자 주입: `ApiTokenService`, `ApiTokenAccessPolicy`, `JsonMapper`, `Clock`.

- `Authorization` 헤더가 `Bearer fab_` 로 시작하지 않으면 그대로 다음 필터로 넘긴다.
- `apiTokenService.findActive(원문)` 가 비면 401 `ErrorCode.INVALID_TOKEN` 을 쓰고 끝낸다.
- `policy.isAllowed(request.getMethod(), request.getRequestURI())` 가 false 면 403 `ErrorCode.FORBIDDEN` 을 쓰고 끝낸다.
- 통과하면 principal 을 `token.getUserUuid().getValue()` 로 한 `UsernamePasswordAuthenticationToken` 을 의도 메모 방식으로 설정하고, `apiTokenService.recordUsage(token, LocalDateTime.now(clock))` 를 부른 뒤 다음 필터로 넘긴다.
- 오류 JSON: `response.setStatus(errorCode.getStatusCode())`, `Content-Type: application/json;charset=UTF-8`, 본문은 `jsonMapper.writeValueAsString(ApiErrorResponse.of(errorCode, request.getRequestURI()))`.

### 3. `backend/src/main/java/com/bifos/accountbook/config/SecurityConfig.java`

`ApiTokenAuthenticationFilter` 를 생성자로 주입받는다. 기존 `.addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class)` 줄 **다음에** `.addFilterBefore(apiTokenAuthenticationFilter, JwtAuthenticationFilter.class)` 를 더한다. 기준 필터가 먼저 등록돼야 순서를 잡을 수 있다. 다른 설정은 바꾸지 않는다.

### 4. 테스트 `backend/src/test/java/com/bifos/accountbook/config/security/ApiTokenAccessPolicyTest.java` (신규)

단위 테스트(`new ApiTokenAccessPolicy()`). 표의 모든 허용 조합이 true 이고, 다음은 false 다: `DELETE /api/v1/families/{uuid}`, `POST /api/v1/families`, `GET /api/v1/users/me/api-tokens`, `POST /api/v1/families/{uuid}/categories`, `GET /api/v1/families/{uuid}/expenses-extra`, `PATCH /api/v1/families/{uuid}/expenses/{uuid}`, `GET /api/v1/families/{uuid}/dashboard/stats/monthly`.

### 5. 테스트 `backend/src/test/java/com/bifos/accountbook/config/security/ApiTokenAuthenticationFilterTest.java` (신규)

`AbstractControllerTest` 를 상속한다. SecurityContext 를 쓰지 않도록 사용자는 `fixtures.users.user().email(...).build()` 로 만들고(`getDefaultUser()` 는 쓰지 않는다), 가족은 `fixtures.families.family().owner(user).build()`, 카테고리는 `fixtures.categories.category(family).build()` 로 만든다. 요청마다 `SecurityContextHolder.clearContext()` 를 먼저 부른다.
토큰은 `ApiTokenService.issue` 로 만들어 원문을 `Authorization: Bearer <원문>` 에 넣는다.

- 허용: 사용자 A 토큰으로 `POST /api/v1/families/{A 가족}/expenses` 201, 이어서 `GET` 목록에 그 지출이 있고, `PUT`, `DELETE` 가 성공한다
- 가족 권한: A 토큰으로 사용자 B 가족에 `POST .../expenses` 는 403 `F003`
- 허용 목록 밖: A 토큰으로 `GET /api/v1/users/me/api-tokens` 403 `A005`, `DELETE /api/v1/families/{A 가족}` 403 이고 가족은 남는다
- 폐기: `ApiTokenService.revoke` 뒤 같은 토큰으로 `GET /api/v1/families` 가 401 `A002`
- 모르는 토큰: `Bearer fab_unknown` 은 401 `A002`
- 사용 시각: 첫 호출 뒤 DB 의 `lastUsedAt` 이 채워진다
- 기존 JWT: `JwtTokenProvider.generateToken(user).getToken()` 을 헤더에 넣으면 전과 같이 `GET /api/v1/users/me/api-tokens` 가 200 이다

## 검증

```bash
# cwd: backend
./gradlew checkstyleMain checkstyleTest test --tests 'com.bifos.accountbook.config.security.*'
./gradlew checkstyleMain checkstyleTest test
```

기대: 새 테스트와 전체 테스트가 통과한다. `gradle-wrapper.jar` 가 없으면 먼저 `mise exec gradle@9.8.0 -- gradle wrapper --gradle-version 9.8.0` 을 `backend` 에서 실행한다.

## 변경 파일

| 파일 | 변경 |
|---|---|
| `backend/src/main/java/com/bifos/accountbook/config/security/ApiTokenAccessPolicy.java` | 신규 |
| `backend/src/main/java/com/bifos/accountbook/config/security/ApiTokenAuthenticationFilter.java` | 신규 |
| `backend/src/main/java/com/bifos/accountbook/config/SecurityConfig.java` | 수정 |
| `backend/src/test/java/com/bifos/accountbook/config/security/ApiTokenAccessPolicyTest.java` | 신규 |
| `backend/src/test/java/com/bifos/accountbook/config/security/ApiTokenAuthenticationFilterTest.java` | 신규 |
