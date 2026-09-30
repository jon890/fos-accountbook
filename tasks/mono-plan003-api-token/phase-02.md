# Phase 02. 백엔드 연동 토큰 인증 필터와 허용 목록

**Execution profile**: deep

## 목표

`Authorization: Bearer fab_...` 요청을 토큰 주인으로 인증하고, 가계부 기록 경로(허용 목록)만 통과시킨다.
외부 에이전트가 사용자 권한 안에서 지출과 수입을 조회, 등록, 수정, 삭제할 수 있게 하는 인증 경계다.

**범위 외**: 토큰 발급, 목록, 폐기 API 는 phase 01 이 만들었다. 프론트는 phase 03, 04 다. 기존 JWT 인증 동작은 바꾸지 않는다.

## 컨텍스트

- 기존 인증: `backend/src/main/java/com/bifos/accountbook/config/security/JwtAuthenticationFilter.java` (`@Component`, `OncePerRequestFilter`). `Authorization: Bearer ` 뒤 값을 JWT 로 검증하고 `UsernamePasswordAuthenticationToken(userUuid, null, List.of())` 를 SecurityContext 에 둔다.
- 필터 등록: `backend/src/main/java/com/bifos/accountbook/config/SecurityConfig.java` 의 `filterChain` 이 `addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class)` 로 붙인다. 인증되지 않은 요청은 `anyRequest().authenticated()` 에서 403 이 된다 (별도 entry point 없음).
- `@LoginUser` 는 `shared/auth/LoginUserArgumentResolver.java` 가 principal 문자열(userUuid)에서 만든다. 새 필터도 principal 을 userUuid 문자열로 둬야 기존 컨트롤러가 그대로 동작한다.
- phase 01 이 만든 것: `apitoken/application/service/ApiTokenService.java` 의 `public static String hash(String rawToken)`, `apitoken/domain/repository/ApiTokenRepository.java` 의 `findActiveByTokenHash`, `apitoken/domain/entity/ApiToken.java` 의 `markUsed(LocalDateTime)`.
- 오류 응답 본문은 `shared/dto/ApiErrorResponse.of(ErrorCode, String path)` 로 만든다. 필터에서 던진 예외는 `GlobalExceptionHandler` 가 받지 못하므로 필터가 응답을 직접 쓴다.
- 가족 권한은 서비스가 검증한다. 지출: `expense/application/service/ExpenseService.java` 의 `createExpense`(`validateAndGetFamily`), `getFamilyExpenses`(`@ValidateFamilyAccess`), `getExpense`, `updateExpense`, `deleteExpense`(`validateFamilyAccess`). 수입: `income/application/service/IncomeService.java` 도 같다. 카테고리 목록은 `CategoryService.getFamilyCategories`(`@ValidateFamilyAccess`).

**근거 문서**: `backend/docs/flow.md` 의 「7. 연동 토큰으로 부르기」 (허용 목록의 단일 소스), `backend/docs/adr.md` 의 ADR-B18, ADR-B09

## 의도 메모

- 토큰이 `fab_` 로 시작하면 JWT 필터로 넘기지 않는다. 찾지 못하면 401 로 끝낸다. 형식이 달라 JWT 로도 통과할 수 없다.
- 허용 목록은 `flow.md` 「7」 의 표 그대로다. 경로 비교는 `org.springframework.http.server.PathContainer` 와 `org.springframework.web.util.pattern.PathPatternParser` 로 한다. 문자열 `startsWith` 로 비교하지 않는다(`/families/x/expenses-extra` 같은 경로가 새어 나간다).
- `last_used_at` 갱신은 `markUsed` 가 true 일 때만 저장한다. 요청마다 쓰지 않는다.
- 인증 객체의 권한에 `new SimpleGrantedAuthority("API_TOKEN")` 을 둔다. 로그만 구분하고 인가는 허용 목록이 한다.

## 작업 항목

### 1. `backend/src/main/java/com/bifos/accountbook/config/security/ApiTokenAuthenticationFilter.java` (신규)

`@Component`, `OncePerRequestFilter`.

- `Authorization` 헤더가 `Bearer fab_` 로 시작하지 않으면 그대로 다음 필터로 넘긴다.
- 해시(`ApiTokenService.hash`)로 `findActiveByTokenHash`. 없으면 401 `ErrorCode.INVALID_TOKEN` JSON 을 쓰고 끝낸다.
- `ApiTokenAccessPolicy.isAllowed(method, requestUri)` 가 false 면 403 `ErrorCode.FORBIDDEN` JSON 을 쓰고 끝낸다.
- 통과하면 `UsernamePasswordAuthenticationToken(token.getUserUuid().getValue(), null, List.of(new SimpleGrantedAuthority("API_TOKEN")))` 을 SecurityContext 에 두고, `markUsed(LocalDateTime.now(clock))` 가 true 면 저장한 뒤 다음 필터로 넘긴다.
- JSON 은 `ObjectMapper` 빈으로 `ApiErrorResponse.of(errorCode, request.getRequestURI())` 를 쓰고 `Content-Type: application/json;charset=UTF-8`.

### 2. `backend/src/main/java/com/bifos/accountbook/config/security/ApiTokenAccessPolicy.java` (신규)

허용 목록을 담은 클래스. `public boolean isAllowed(String method, String requestUri)`.
패턴은 `/api/v1` 접두사를 붙여 다음을 허용한다. 그 밖은 모두 false.

| 메서드 | 경로 패턴 |
| --- | --- |
| GET | `/api/v1/families` |
| GET | `/api/v1/families/{familyUuid}/categories` |
| GET, POST | `/api/v1/families/{familyUuid}/expenses` |
| GET, PUT, DELETE | `/api/v1/families/{familyUuid}/expenses/{expenseUuid}` |
| GET, POST | `/api/v1/families/{familyUuid}/incomes` |
| GET, PUT, DELETE | `/api/v1/families/{familyUuid}/incomes/{incomeUuid}` |

### 3. `backend/src/main/java/com/bifos/accountbook/config/SecurityConfig.java`

`ApiTokenAuthenticationFilter` 를 주입받아 `addFilterBefore(apiTokenAuthenticationFilter, JwtAuthenticationFilter.class)` 로 JWT 필터 앞에 붙인다. 다른 설정은 바꾸지 않는다.

### 4. 테스트 `backend/src/test/java/com/bifos/accountbook/config/security/ApiTokenAccessPolicyTest.java` (신규)

단위 테스트. 표의 모든 허용 조합이 true, 다음이 false 인지 확인한다: `DELETE /api/v1/families/{uuid}`, `POST /api/v1/families`, `GET /api/v1/users/me/api-tokens`, `POST /api/v1/families/{uuid}/categories`, `GET /api/v1/families/{uuid}/expenses-extra`, `PATCH /api/v1/families/{uuid}/expenses/{uuid}`.

### 5. 테스트 `backend/src/test/java/com/bifos/accountbook/config/security/ApiTokenAuthenticationFilterTest.java` (신규)

`AbstractControllerTest` 를 상속한다. SecurityContext 를 쓰지 않도록 사용자는 `fixtures.users.user().build()` 로 만들고(`getDefaultUser()` 는 쓰지 않는다), 가족은 `fixtures.families.family().owner(user).build()`, 카테고리는 `fixtures.categories.category(family).build()` 로 만든다.
토큰은 `ApiTokenService.issue` 로 만들어 원문을 헤더에 넣는다.

- 허용: 사용자 A 의 토큰으로 `POST /api/v1/families/{A 가족}/expenses` 201, 이어서 `GET` 목록에 그 지출이 있고, `PUT`, `DELETE` 가 성공한다
- 가족 권한: 사용자 A 의 토큰으로 사용자 B 가족에 `POST .../expenses` 하면 403 (`NOT_FAMILY_MEMBER`)
- 허용 목록 밖: A 토큰으로 `GET /api/v1/users/me/api-tokens` 403 `A005`, `DELETE /api/v1/families/{A 가족}` 403 이고 가족은 남는다
- 폐기: `ApiTokenService.revoke` 뒤 같은 토큰으로 `GET /api/v1/families` 가 401 `A002`
- 모르는 토큰: `Bearer fab_unknown` 은 401
- 사용 시각: 첫 호출 뒤 DB 의 `last_used_at` 이 채워진다
- 기존 JWT: 토큰 없이 `JwtTokenProvider.generateToken` 으로 만든 access token 은 전과 같이 `GET /api/v1/users/me/api-tokens` 200

## 검증

```bash
cd backend
./gradlew checkstyleMain checkstyleTest test --tests 'com.bifos.accountbook.config.security.*'
./gradlew checkstyleMain checkstyleTest test
```

기대: 새 테스트와 전체 테스트가 통과한다. `gradle-wrapper.jar` 가 없으면 먼저 `mise exec gradle@9.8.0 -- gradle wrapper --gradle-version 9.8.0` 을 `backend` 에서 실행한다.

## 변경 파일

| 파일 | 변경 |
|---|---|
| `backend/src/main/java/com/bifos/accountbook/config/security/ApiTokenAuthenticationFilter.java` | 신규 |
| `backend/src/main/java/com/bifos/accountbook/config/security/ApiTokenAccessPolicy.java` | 신규 |
| `backend/src/main/java/com/bifos/accountbook/config/SecurityConfig.java` | 수정 |
| `backend/src/test/java/com/bifos/accountbook/config/security/ApiTokenAccessPolicyTest.java` | 신규 |
| `backend/src/test/java/com/bifos/accountbook/config/security/ApiTokenAuthenticationFilterTest.java` | 신규 |
