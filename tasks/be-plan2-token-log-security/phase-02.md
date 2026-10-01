# Phase 02. access token 과 refresh token 을 typ 클레임으로 구분한다

**Execution profile**: standard

## 목표

refresh token 으로 API 를 부르거나 access token 으로 토큰을 갱신하는 길을 막는다. `typ` 이 없는 옛 토큰은 배포 시점에 모두 무효가 된다.

**범위 외**: 로그 정책은 phase 01, 연동 토큰은 phase 03 이다. refresh token 회전과 DB 저장은 하지 않는다(ADR-B19 대안 기각). 프론트엔드는 바꾸지 않는다.

## 컨텍스트

모든 경로는 저장소 root 기준이다. 명령은 `backend/` 에서 돌린다.

**근거 문서**: `backend/docs/adr/ADR-B19-jwt-token-type-claim.md`, `backend/docs/flow.md` 의 「6. 인증 갱신」 절.

코드에서 확인한 사실:

- `backend/src/main/java/com/bifos/accountbook/config/security/JwtTokenProvider.java`
  - `generateToken(User)` 은 `AccessToken` 을, `generateRefreshToken(User)` 은 `String` 을 돌려준다. 둘 다 `subject`, `issuedAt`, `expiration` 만 넣는다.
  - `createAuthentication(String token)` 이 subject 로 `UsernamePasswordAuthenticationToken` 을 만든다.
- `backend/src/main/java/com/bifos/accountbook/config/security/AbstractJwtTokenProvider.java`
  - `validateToken(String)` 은 서명과 만료를 확인하고, audience 가 있는 토큰(소셜 로그인 서명, ADR-B17)을 거부한다.
  - `getClaimsFromToken(String)` 은 protected, `getUserIdFromToken(String)` 은 public 이다.
- 호출 위치(`git grep` 로 확인):
  - `backend/src/main/java/com/bifos/accountbook/config/security/JwtAuthenticationFilter.java:29` 가 `validateToken` 으로 API 인증을 한다.
  - `backend/src/main/java/com/bifos/accountbook/user/application/service/AuthService.java:73` 의 `refreshToken(String)` 이 `validateToken` 으로 refresh token 을 확인하고, 실패하면 `BusinessException(ErrorCode.INVALID_TOKEN, ...)` 을 던진다. `INVALID_TOKEN` 은 401, 코드 `A002` 다.
  - `AuthService` 98-99 행이 두 토큰을 발급한다.
  - 테스트: `backend/src/test/java/com/bifos/accountbook/config/security/JwtTokenProviderTest.java`, `ApiTokenAuthenticationFilterTest.java:188`(JWT 로 부르는 경우).
- `backend/src/test/java/com/bifos/accountbook/user/presentation/controller/AuthControllerTest.java` 는 `AbstractControllerTest` 를 상속하고 `mockMvc` 로 `/api/v1/auth/social-login` 을 부른다. refresh 경로 테스트는 같은 방식으로 더한다.

## 의도 메모

- 서명 키를 나누지 않는다. 키는 `AUTH_SECRET` 하나다(ADR-B17, ADR-B19).
- `validateToken` 을 그대로 두고 종류를 따로 묻지 않는다. 호출하는 쪽이 종류 확인을 빠뜨릴 수 있다. 종류별 검증 메서드(`validateAccessToken`, `validateRefreshToken` 같은 이름)를 만들고 두 호출 위치를 그것으로 바꾼다.
  `validateToken` 이 더 쓰이지 않으면 지우거나 protected 로 내린다.
- 클레임 이름은 `typ`, 값은 `access` 와 `refresh` 다. 문자열 상수로 한곳에 둔다.

## 작업 항목

### 1. `JwtTokenProvider` 와 `AbstractJwtTokenProvider` 에 토큰 종류 넣기와 확인

- 두 발급 메서드가 `typ` 클레임을 넣는다.
- 종류별 검증 메서드를 더한다. 서명, 만료, audience 확인은 기존과 같고, `typ` 이 기대값과 다르거나 없으면 false 다.

### 2. `JwtAuthenticationFilter` 와 `AuthService.refreshToken` 이 종류별 검증을 쓰게 바꾸기

- 필터는 access 만 인증한다.
- `refreshToken` 은 refresh 만 받는다. 아니면 지금과 같은 `INVALID_TOKEN` 예외다.

### 3. 이 phase 를 검증하는 테스트

- `JwtTokenProviderTest`: 발급한 access token 은 access 검증만, refresh token 은 refresh 검증만 통과한다. 같은 키로 서명했지만 `typ` 이 없는 토큰은 둘 다 실패한다.
- `AuthControllerTest`
  - POST `/api/v1/auth/refresh` 에 refresh token 을 주면 200 과 새 토큰.
  - access token 을 주면 401.
  - 보호 경로(예: GET `/api/v1/families`)를 refresh token 으로 부르면 401.
- 기존 테스트가 직접 만든 JWT 로 인증하는 곳이 있으면 `typ` 을 넣게 고친다(`git grep -n "Jwts.builder" backend/src/test` 로 찾는다). 소셜 로그인 서명 토큰은 그대로 둔다.

## 검증

`backend/` 에서 실행한다. `gradle/wrapper/gradle-wrapper.jar` 가 없으면 먼저 `mise exec gradle@9.8.0 -- gradle wrapper --gradle-version 9.8.0` 을 돌린다. jar 는 커밋하지 않는다.

```bash
./gradlew test --tests "com.bifos.accountbook.config.security.JwtTokenProviderTest" --tests "com.bifos.accountbook.user.presentation.controller.AuthControllerTest"
./gradlew checkstyleMain checkstyleTest test
```

기대값: 두 명령 모두 BUILD SUCCESSFUL.

## 변경 파일

| 파일 | 변경 |
|---|---|
| `backend/src/main/java/com/bifos/accountbook/config/security/JwtTokenProvider.java` | 수정 |
| `backend/src/main/java/com/bifos/accountbook/config/security/AbstractJwtTokenProvider.java` | 수정 |
| `backend/src/main/java/com/bifos/accountbook/config/security/JwtAuthenticationFilter.java` | 수정 |
| `backend/src/main/java/com/bifos/accountbook/user/application/service/AuthService.java` | 수정 |
| `backend/src/test/java/com/bifos/accountbook/config/security/JwtTokenProviderTest.java` | 수정 |
| `backend/src/test/java/com/bifos/accountbook/user/presentation/controller/AuthControllerTest.java` | 수정 |
