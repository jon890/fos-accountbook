# Phase 01. 운영 로그에서 본문과 토큰을 뺀다

**Execution profile**: standard

## 목표

운영 로그(INFO)에 요청과 응답 본문이 남지 않게 한다. 지금은 `/api/v1/auth/social-login` 과 `/api/v1/auth/refresh` 응답의 access token, refresh token 원문과 가계부 금액이 운영 로그에 남는다.
비즈니스 예외 로그와 오류 응답의 `parameters` 도 운영에서 줄인다.

**범위 외**: 토큰 종류 구분은 phase 02, 연동 토큰 주인 상태 확인은 phase 03 이다.

## 컨텍스트

모든 경로는 저장소 root 기준이다. 명령은 `backend/` 에서 돌린다.

**근거 문서**: `backend/docs/adr/ADR-B20-log-body-policy.md`.

코드에서 확인한 사실:

- `backend/src/main/java/com/bifos/accountbook/shared/filter/RequestResponseLoggingFilter.java`
  - `doFilterInternal` 이 `logRequest` 를 `filterChain.doFilter` 보다 먼저 부른다. 그 시점의 `ContentCachingRequestWrapper` 는 본문을 아직 읽지 않아 요청 본문이 늘 비어 있다.
  - `logResponse` 는 응답 본문을 `MAX_PAYLOAD_LENGTH`(1000자)까지 `log.info` 로 남긴다. 가리는 예외는 `isApiTokenIssue`(POST `/api/v1/users/me/api-tokens`) 하나다.
  - `maskAuthorization`, `maskToken`, `extractSessionToken` 으로 헤더와 쿠키의 토큰은 이미 가린다. 이 동작은 유지한다.
- `backend/src/main/resources/logback-spring.xml` 의 prod 프로파일은 `com.bifos.accountbook` 을 INFO 로 둔다. 이 파일은 바꾸지 않는다.
- `backend/src/main/java/com/bifos/accountbook/shared/exception/GlobalExceptionHandler.java`
  - `handleBusinessException` 이 모든 `BusinessException` 을 `log.error(..., e)` 로 스택과 함께 남긴다.
  - 응답의 `parameters` 는 프로파일과 관계없이 싣고, `debugInfo` 만 `isDebugMode()`(local, dev, test 프로파일)일 때 싣는다.
  - `ErrorCode` 의 HTTP 상태는 `e.getErrorCode().getHttpStatus()` 로 얻는다.

## 의도 메모

- 민감 경로 목록을 늘리는 방식을 쓰지 않는다. 새 경로가 생길 때마다 빠뜨리기 쉽다(ADR-B20 대안 기각).
- 요청 본문 로깅을 고칠 때 순서만 바꾸면 `/auth/refresh` 요청 본문의 refresh token 이 새로 남는다. 인증 경로는 DEBUG 에서도 본문을 남기지 않는다.
- 프론트엔드가 운영 오류 응답의 `parameters` 를 읽는지 `git grep -n "parameters" frontend/src` 로 확인한다. `frontend/src/lib/errors/action-error.ts` 의 `parameters` 는 프론트가 스스로 만든 값이다. 백엔드 응답의 `parameters` 를 화면 분기에 쓰는 곳이 있으면 구현 전에 ask 로 알린다.

## 작업 항목

### 1. `RequestResponseLoggingFilter` 의 로그 수준과 본문 정책

- INFO 로그(`[REQ]`, `[RES]`)에는 메서드, 가린 경로와 쿼리, 상태, 처리 시간만 남긴다. 본문과 인증 헤더, 세션 토큰을 넣지 않는다.
- 기존 Authorization 과 세션 토큰 마스킹은 유지하되, 가린 인증 정보를 DEBUG 에서만 남긴다. 이는 ADR-B20 의 INFO 정보 제한을 따른다.
- `/api/v1/invitations/token/{token}` 의 토큰 부분은 `***` 로 가린다. 쿼리는 키만 남기고 모든 값을 `***` 로 가린다. 이 규칙은 DEBUG 로그에도 적용한다.
- 본문은 `log.isDebugEnabled()` 일 때만 붙인다. 요청 본문은 `filterChain.doFilter` 뒤에 읽어야 채워져 있다. 요청 로그를 체인 뒤에 남기거나, 본문만 응답 로그와 함께 DEBUG 로 남긴다.
- `/api/v1/auth/` 로 시작하는 경로와 연동 토큰 발급 요청(POST `/api/v1/users/me/api-tokens`)은 DEBUG 에서도 요청과 응답 본문을 남기지 않고 `(인증 경로라 생략)` 같은 표시만 남긴다. 기존 `isApiTokenIssue` 판정은 이 규칙에 합친다. 같은 경로의 GET 목록 응답은 일반 경로처럼 DEBUG 에 본문을 남긴다.

### 2. `GlobalExceptionHandler` 의 예외 로그와 `parameters`

- `handleBusinessException`: HTTP 상태가 5xx 면 지금처럼 `log.error` 와 스택, 4xx 면 `log.warn` 으로 코드와 메시지만 남기고 스택을 넣지 않는다. `parameters` 는 로그에 넣지 않는다.
- 응답의 `parameters` 는 `debugInfo` 와 같이 `isDebugMode()` 일 때만 싣는다.
- 같은 파일의 다른 핸들러도 `parameters` 를 응답에 싣는 곳이 있으면 같은 규칙을 적용한다.

### 3. 이 phase 를 검증하는 테스트

- 신규 `backend/src/test/java/com/bifos/accountbook/shared/filter/RequestResponseLoggingFilterTest.java`
  - 필터를 직접 만들어 `MockHttpServletRequest`, `MockHttpServletResponse`, 본문을 쓰는 `FilterChain` 으로 부른다. 로그는 Logback `ListAppender` 를 필터의 로거에 붙여 받는다. 로거 수준은 테스트 안에서 INFO 와 DEBUG 로 바꾼다.
  - INFO: `/api/v1/auth/refresh` 응답 본문 `{"accessToken":"secret-access"}` 가 어떤 로그 줄에도 없다. 일반 경로 응답 본문도 없다. `[RES]` 줄에 상태와 경로는 있다.
  - INFO: 일반 경로의 요청 본문도 없고 초대 토큰 경로와 쿼리 값 원문은 어떤 로그 줄에도 없다. DEBUG 에서도 경로와 쿼리 값은 가려진다.
  - INFO 에는 인증 헤더와 세션 토큰 필드가 없고, DEBUG 에서는 같은 값을 기존 규칙으로 가린다.
  - DEBUG: 일반 경로의 요청 본문과 응답 본문이 남는다. `/api/v1/auth/refresh` 의 요청 본문 `{"refreshToken":"secret-refresh"}` 와 응답 본문은 DEBUG 에서도 남지 않는다.
  - DEBUG: 연동 토큰 경로의 POST 발급 본문은 없고, GET 목록 본문은 남는다.
- 신규 `backend/src/test/java/com/bifos/accountbook/shared/exception/GlobalExceptionHandlerTest.java`
  - `MockEnvironment` 로 prod 프로파일을 준 핸들러: 4xx `BusinessException` 의 응답 `parameters` 와 `debugInfo` 가 null 이다.
  - test 프로파일을 준 핸들러: `parameters` 가 실린다.
  - 4xx 는 WARN, 5xx 는 ERROR 로 남는다(`ListAppender` 로 수준 확인).
  - 4xx 로그의 `getThrowableProxy()` 는 null 이고, 5xx 로그에는 throwable 이 있다. 두 로그 모두 `parameters` 원문이 없다.

## 검증

`backend/` 에서 실행한다. `gradle/wrapper/gradle-wrapper.jar` 가 없으면 먼저 `mise exec gradle@9.8.0 -- gradle wrapper --gradle-version 9.8.0` 을 돌린다. jar 는 커밋하지 않는다.

```bash
# cwd: backend/
./gradlew test --tests "com.bifos.accountbook.shared.filter.RequestResponseLoggingFilterTest" --tests "com.bifos.accountbook.shared.exception.GlobalExceptionHandlerTest" --no-daemon --console=plain
./gradlew checkstyleMain checkstyleTest test --no-daemon --console=plain
```

기대값: 두 명령 모두 BUILD SUCCESSFUL. 첫 명령에서 새 테스트가 실행된 건수가 0 이 아니다.

## 변경 파일

| 파일 | 변경 |
|---|---|
| `backend/src/main/java/com/bifos/accountbook/shared/filter/RequestResponseLoggingFilter.java` | 수정 |
| `backend/src/main/java/com/bifos/accountbook/shared/exception/GlobalExceptionHandler.java` | 수정 |
| `backend/src/test/java/com/bifos/accountbook/shared/filter/RequestResponseLoggingFilterTest.java` | 신규 |
| `backend/src/test/java/com/bifos/accountbook/shared/exception/GlobalExceptionHandlerTest.java` | 신규 |
