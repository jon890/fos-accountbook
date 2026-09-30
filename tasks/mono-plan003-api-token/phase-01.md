# Phase 01. 백엔드 연동 토큰 저장과 발급, 목록, 폐기 API

**Execution profile**: standard

## 목표

사용자가 자기 연동 토큰을 발급, 조회, 폐기할 수 있게 `api_tokens` 테이블과 `/api/v1/users/me/api-tokens` API 를 만든다.

**범위 외**: 토큰으로 인증하는 필터와 허용 목록은 phase 02 가 맡는다. 이 phase 가 끝나도 토큰으로 인증되지는 않는다. 프론트는 phase 03, 04 다.

## 컨텍스트

- 새 도메인 패키지 `com.bifos.accountbook.apitoken` 을 ADR-B16 배치(`presentation`, `application`, `domain`, `infra`)로 만든다.
  배치 선례는 `backend/src/main/java/com/bifos/accountbook/recurring/` 다.
  - 엔티티: `recurring/domain/entity/RecurringExpense.java` (`@EntityListeners(AuditingEntityListener.class)`, `CustomUuid uuid`, `@PrePersist` 로 uuid 생성, `@CreatedDate`, `@LastModifiedDate`)
  - 상태 enum 과 변환기: `recurring/domain/value/RecurringExpenseStatus.java` (`implements com.bifos.accountbook.shared.value.CodeEnum`), `recurring/domain/converter/RecurringExpenseStatusConverter.java` (`extends com.bifos.accountbook.shared.converter.AbstractCodeEnumConverter`, `@Converter(autoApply = true)`)
  - 저장소: 도메인 인터페이스 `recurring/domain/repository/RecurringExpenseRepository.java`, 구현 `recurring/infra/repository/impl/RecurringExpenseRepositoryImpl.java`, JPA `recurring/infra/repository/jpa/RecurringExpenseJpaRepository.java`
- 컨트롤러 선례: `user/presentation/controller/UserProfileController.java` (`@LoginUser LoginUserDto user`, `user.userUuid()` 는 `CustomUuid`, 응답은 `ApiSuccessResponse.of(message, data)`)
- 마이그레이션은 `backend/src/main/resources/db/migration/` 이고 마지막이 `V14__create_recurring_expenses_table.sql` 이다. 테이블과 컬럼 이름은 백틱 규칙(ADR-B15)을 따른다.
- 시각은 `config/ClockConfig.java` 의 `Clock` 빈으로 얻는다.
- 오류는 `shared/exception/BusinessException` 과 `shared/exception/ErrorCode` 로 던진다.

**근거 문서**: `backend/docs/data-schema.md` 의 「[apitoken] api_tokens」 와 「API 엔드포인트 전체 목록」, `backend/docs/flow.md` 의 「7. 연동 토큰으로 부르기」, `backend/docs/adr.md` 의 ADR-B18, ADR-B03, ADR-B15, ADR-B16

## 의도 메모

- 원문은 저장하지 않는다. `SHA-256` hex 64자만 저장하고, 조회는 고유 인덱스로 한다. bcrypt 를 쓰지 않는 이유는 ADR-B18 에 있다.
- 폐기는 물리 삭제가 아니라 `status = REVOKED`, `revoked_at` 기록이다 (ADR-B03).
- 남의 토큰을 폐기하려 하면 없는 토큰과 같은 404 로 답한다. 토큰 존재 여부를 흘리지 않는다.
- 토큰 원문 생성은 `java.security.SecureRandom` 32바이트를 `Base64.getUrlEncoder().withoutPadding()` 으로 인코딩하고 앞에 `fab_` 를 붙인다.

## 작업 항목

### 1. 마이그레이션 `backend/src/main/resources/db/migration/V15__create_api_tokens_table.sql`

`backend/docs/data-schema.md` 의 「[apitoken] api_tokens」 DDL 을 그대로 만든다.
`V14__create_recurring_expenses_table.sql` 처럼 `UNIQUE KEY uq_api_tokens_uuid (uuid)`, `UNIQUE KEY uq_api_tokens_token_hash (token_hash)`, `CONSTRAINT fk_api_tokens_user FOREIGN KEY (user_uuid) REFERENCES users (uuid)`, `INDEX idx_api_tokens_user_uuid (user_uuid)` 로 쓴다.

### 2. 도메인 `apitoken/domain`

- `value/ApiTokenStatus.java`: `ACTIVE`, `REVOKED` (코드 문자열 동일)
- `converter/ApiTokenStatusConverter.java`
- `entity/ApiToken.java`: 칸은 DDL 과 같다. `userUuid` 는 `CustomUuid`, `status` 기본값 `ACTIVE`. 메서드 `revoke(LocalDateTime now)` 는 `status = REVOKED`, `revokedAt = now`. 메서드 `markUsed(LocalDateTime now)` 는 `lastUsedAt` 이 null 이거나 `now` 보다 5분 넘게 앞서면 `lastUsedAt = now` 로 바꾸고 바꿨는지 boolean 을 돌려준다.
- `repository/ApiTokenRepository.java`: `save`, `findActiveByTokenHash(String)`, `findActiveByUuidAndUserUuid(CustomUuid uuid, CustomUuid userUuid)`, `findAllActiveByUserUuid(CustomUuid)`(최근 발급 순), `countActiveByUserUuid(CustomUuid)`
- 구현은 `infra/repository/impl/ApiTokenRepositoryImpl.java` 와 `infra/repository/jpa/ApiTokenJpaRepository.java`

### 3. 서비스 `apitoken/application`

- `service/ApiTokenService.java`
  - `CreatedApiTokenResponse issue(CustomUuid userUuid, CreateApiTokenRequest request)`: ACTIVE 가 5개면 `ErrorCode.API_TOKEN_LIMIT_EXCEEDED`. 원문 생성, 해시, `tokenPrefix` 는 원문 앞 12자(`fab_` 와 그 뒤 8자)
  - `List<ApiTokenResponse> list(CustomUuid userUuid)`
  - `void revoke(CustomUuid userUuid, CustomUuid tokenUuid)`: 못 찾으면 `ErrorCode.API_TOKEN_NOT_FOUND`
  - 해시 함수는 phase 02 필터도 쓰므로 `public static String hash(String rawToken)` 으로 둔다 (SHA-256, 소문자 hex)
- `dto/CreateApiTokenRequest.java`: `@NotBlank @Size(max = 50) String name`
- `dto/ApiTokenResponse.java`: `uuid`, `name`, `tokenPrefix`, `lastUsedAt`, `createdAt`
- `dto/CreatedApiTokenResponse.java`: 위 필드와 `token`(원문)
- `backend/src/main/java/com/bifos/accountbook/shared/exception/ErrorCode.java` 에 추가: `API_TOKEN_NOT_FOUND(HttpStatus.NOT_FOUND, "AT001", "연동 토큰을 찾을 수 없습니다")`, `API_TOKEN_LIMIT_EXCEEDED(HttpStatus.BAD_REQUEST, "AT002", "연동 토큰은 5개까지 만들 수 있습니다")`

### 4. 컨트롤러 `apitoken/presentation/controller/ApiTokenController.java`

`@RequestMapping("/api/v1/users/me/api-tokens")`, `@SecurityRequirement(name = "bearerAuth")`.

- `POST` → 201, `ApiSuccessResponse.of("연동 토큰을 발급했습니다", CreatedApiTokenResponse)`
- `GET` → 200, `ApiSuccessResponse.of("연동 토큰 목록을 조회했습니다", List<ApiTokenResponse>)`
- `DELETE /{tokenUuid}` → 200, `ApiSuccessResponse.of("연동 토큰을 폐기했습니다")`

### 5. 테스트 `backend/src/test/java/com/bifos/accountbook/apitoken/presentation/controller/ApiTokenControllerTest.java` (신규)

`AbstractControllerTest` 를 상속한다. `fixtures.users.getDefaultUser()` 가 SecurityContext 를 기본 사용자로 설정한다(`backend/src/test/java/com/bifos/accountbook/shared/fixtures/UserFixtures.java`).

- 발급: 201, 응답 `token` 이 `fab_` 로 시작하고 길이 47, `tokenPrefix` 가 `token` 앞 12자다. DB 의 `token_hash` 가 `ApiTokenService.hash(token)` 과 같고 원문은 어느 칸에도 없다
- 목록: 두 개 발급 뒤 GET 이 두 개를 돌려주고 `token` 필드가 없다
- 폐기: DELETE 뒤 목록에서 빠지고 DB 상태가 `REVOKED`, `revoked_at` 이 채워진다
- 남의 토큰 폐기: `fixtures.users.getOtherUser()` 로 만든 사용자(SecurityContext 를 바꾸지 않는다)의 토큰을 `ApiTokenService.issue` 로 직접 만들고, 기본 사용자로 그 uuid 를 DELETE 하면 404 `AT001` 이고 그 토큰은 ACTIVE 로 남는다
- 한도: 5개 발급 뒤 6번째는 400 `AT002`
- 이름 검증: 빈 이름과 51자 이름은 400

## 검증

```bash
cd backend
./gradlew checkstyleMain checkstyleTest test --tests 'com.bifos.accountbook.apitoken.*'
./gradlew checkstyleMain checkstyleTest test
```

기대: 새 테스트가 모두 통과하고 전체 테스트가 통과한다. `gradle-wrapper.jar` 가 없으면 먼저 `mise exec gradle@9.8.0 -- gradle wrapper --gradle-version 9.8.0` 을 `backend` 에서 실행한다.

## 변경 파일

| 파일 | 변경 |
|---|---|
| `backend/src/main/resources/db/migration/V15__create_api_tokens_table.sql` | 신규 |
| `backend/src/main/java/com/bifos/accountbook/apitoken/domain/value/ApiTokenStatus.java` | 신규 |
| `backend/src/main/java/com/bifos/accountbook/apitoken/domain/converter/ApiTokenStatusConverter.java` | 신규 |
| `backend/src/main/java/com/bifos/accountbook/apitoken/domain/entity/ApiToken.java` | 신규 |
| `backend/src/main/java/com/bifos/accountbook/apitoken/domain/repository/ApiTokenRepository.java` | 신규 |
| `backend/src/main/java/com/bifos/accountbook/apitoken/infra/repository/impl/ApiTokenRepositoryImpl.java` | 신규 |
| `backend/src/main/java/com/bifos/accountbook/apitoken/infra/repository/jpa/ApiTokenJpaRepository.java` | 신규 |
| `backend/src/main/java/com/bifos/accountbook/apitoken/application/service/ApiTokenService.java` | 신규 |
| `backend/src/main/java/com/bifos/accountbook/apitoken/application/dto/CreateApiTokenRequest.java` | 신규 |
| `backend/src/main/java/com/bifos/accountbook/apitoken/application/dto/ApiTokenResponse.java` | 신규 |
| `backend/src/main/java/com/bifos/accountbook/apitoken/application/dto/CreatedApiTokenResponse.java` | 신규 |
| `backend/src/main/java/com/bifos/accountbook/apitoken/presentation/controller/ApiTokenController.java` | 신규 |
| `backend/src/main/java/com/bifos/accountbook/shared/exception/ErrorCode.java` | 수정 |
| `backend/src/test/java/com/bifos/accountbook/apitoken/presentation/controller/ApiTokenControllerTest.java` | 신규 |
