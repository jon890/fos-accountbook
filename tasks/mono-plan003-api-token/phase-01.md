# Phase 01. 백엔드 연동 토큰 저장과 발급, 목록, 폐기 API

**Execution profile**: deep

## 목표

사용자가 자기 연동 토큰을 발급, 조회, 폐기할 수 있게 `api_tokens` 테이블과 `/api/v1/users/me/api-tokens` API 를 만든다.
토큰 원문은 DB 와 로그 어디에도 남지 않아야 한다.

**범위 외**: 토큰으로 인증하는 필터와 허용 목록은 phase 02 가 맡는다. 이 phase 가 끝나도 토큰으로 인증되지는 않는다. 프론트는 phase 03, 04 다.

## 컨텍스트

- 새 도메인 패키지 `com.bifos.accountbook.apitoken` 을 ADR-B16 배치(`presentation`, `application`, `domain`, `infra`)로 만든다. 요청과 응답 DTO 는 `expense` 도메인처럼 `application/dto/` 에 둔다(`expense/application/dto/CreateExpenseRequest.java` 선례).
- 엔티티, 상태 enum, 변환기, 저장소 선례는 `backend/src/main/java/com/bifos/accountbook/recurring/` 다.
  - 엔티티: `recurring/domain/entity/RecurringExpense.java` (`@EntityListeners(AuditingEntityListener.class)`, `CustomUuid uuid`, `@PrePersist` 로 uuid 생성, `@CreatedDate`, `@LastModifiedDate`)
  - 상태 enum 과 변환기: `recurring/domain/value/RecurringExpenseStatus.java` (`implements com.bifos.accountbook.shared.value.CodeEnum`), `recurring/domain/converter/RecurringExpenseStatusConverter.java` (`extends com.bifos.accountbook.shared.converter.AbstractCodeEnumConverter`, `@Converter(autoApply = true)`)
  - 저장소: 도메인 인터페이스 `recurring/domain/repository/RecurringExpenseRepository.java`, 구현 `recurring/infra/repository/impl/RecurringExpenseRepositoryImpl.java`, JPA `recurring/infra/repository/jpa/RecurringExpenseJpaRepository.java`
- 컨트롤러 선례: `user/presentation/controller/UserProfileController.java` (`@LoginUser LoginUserDto user`, `user.userUuid()` 는 `CustomUuid`, 응답은 `ApiSuccessResponse.of(message, data)`)
- 시각은 `config/ClockConfig.java` 의 `Clock` 빈으로 얻는다. 오류는 `shared/exception/BusinessException` 과 `shared/exception/ErrorCode` 로 던진다.
- prod 와 local 은 `ddl-auto: validate` 라 엔티티 매핑과 DDL 타입이 어긋나면 기동이 실패한다. 테스트는 H2 `create-drop` 에 Flyway 를 끄고 돌아 이 불일치를 잡지 못한다. 그래서 검증 절에서 로컬 MySQL 로 한 번 기동한다.
- `backend/src/main/java/com/bifos/accountbook/shared/filter/RequestResponseLoggingFilter.java` 는 모든 요청의 Authorization 헤더(앞 10자와 끝 10자)와 요청, 응답 본문을 INFO 로 남긴다. prod 도 `com.bifos.accountbook` 가 INFO 다.

**근거 문서**: `backend/docs/data-schema.md` 의 「[apitoken] api_tokens」 와 「API 엔드포인트 전체 목록」, `backend/docs/flow.md` 의 「7. 연동 토큰으로 부르기」, `backend/docs/adr.md` 의 ADR-B18, ADR-B03, ADR-B15, ADR-B16

## 의도 메모

- 원문은 저장하지 않는다. SHA-256 소문자 hex 64자만 저장하고 고유 인덱스로 찾는다. bcrypt 를 쓰지 않는 이유는 ADR-B18 에 있다.
- `token_hash` 는 `VARCHAR(64)` 다. `CHAR` 는 Hibernate validate 가 `String` 과 같은 타입으로 보지 않아 기동이 실패한다.
- 폐기는 `status = REVOKED`, `revoked_at` 기록이다 (ADR-B03).
- 남의 토큰을 폐기하려 하면 없는 토큰과 같은 404 로 답한다. 토큰 존재 여부를 흘리지 않는다.
- 원문 생성: `java.security.SecureRandom` 32바이트를 `Base64.getUrlEncoder().withoutPadding()` 으로 인코딩하고 앞에 `fab_` 를 붙인다. 길이는 47자다.
- 사용 시각 갱신(`last_used_at`)은 phase 02 필터가 부른다. 조회한 엔티티를 `save` 하면 트랜잭션 밖이라 merge 로 모든 칸을 덮어써, 그 사이 폐기된 상태를 ACTIVE 로 되돌릴 수 있다. 그래서 조건부 UPDATE 쿼리로만 갱신한다.

## 작업 항목

### 1. 마이그레이션 `backend/src/main/resources/db/migration/V15__create_api_tokens_table.sql`

ADR-B15 에 따라 V15 부터 백틱을 쓴다. 아래 SQL 을 그대로 쓴다.

```sql
CREATE TABLE `api_tokens` (
    `id`           BIGINT      NOT NULL AUTO_INCREMENT,
    `uuid`         VARCHAR(36) NOT NULL,
    `user_uuid`    VARCHAR(36) NOT NULL,
    `name`         VARCHAR(50) NOT NULL,
    `token_hash`   VARCHAR(64) NOT NULL,
    `token_prefix` VARCHAR(12) NOT NULL,
    `status`       VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    `last_used_at` DATETIME(3) NULL,
    `revoked_at`   DATETIME(3) NULL,
    `created_at`   DATETIME(3) NOT NULL,
    `updated_at`   DATETIME(3) NOT NULL,
    PRIMARY KEY (`id`),
    UNIQUE KEY `uq_api_tokens_uuid` (`uuid`),
    UNIQUE KEY `uq_api_tokens_token_hash` (`token_hash`),
    CONSTRAINT `fk_api_tokens_user` FOREIGN KEY (`user_uuid`) REFERENCES `users` (`uuid`),
    INDEX `idx_api_tokens_user_uuid` (`user_uuid`)
);
```

### 2. 도메인 `apitoken/domain`

- `value/ApiTokenStatus.java`: `ACTIVE`, `REVOKED` (코드 문자열 동일)
- `converter/ApiTokenStatusConverter.java`
- `entity/ApiToken.java`: `@Table(name = "api_tokens")`. 칸은 SQL 과 같다. `uuid` 와 `userUuid` 는 `CustomUuid`, `tokenHash` 는 `@Column(name = "token_hash", nullable = false, unique = true, length = 64)`, `status` 기본값 `ACTIVE`.
  - `revoke(LocalDateTime now)`: `status = REVOKED`, `revokedAt = now`
  - `boolean needsUsageUpdate(LocalDateTime now)`: `lastUsedAt` 이 null 이거나 `now` 보다 5분 넘게 앞서면 true
- `repository/ApiTokenRepository.java`: `save`, `findActiveByTokenHash(String)`, `findActiveByUuidAndUserUuid(CustomUuid uuid, CustomUuid userUuid)`, `findAllActiveByUserUuid(CustomUuid)`(최근 발급 순), `countActiveByUserUuid(CustomUuid)`, `int updateLastUsedAt(Long id, LocalDateTime now)`
- 구현: `infra/repository/impl/ApiTokenRepositoryImpl.java`, `infra/repository/jpa/ApiTokenJpaRepository.java`. `updateLastUsedAt` 은 JPA 쪽에 `@Modifying @Query("UPDATE ApiToken t SET t.lastUsedAt = :now WHERE t.id = :id AND t.status = com.bifos.accountbook.apitoken.domain.value.ApiTokenStatus.ACTIVE")` 로 둔다.

### 3. 서비스와 오류 코드

- `apitoken/application/service/ApiTokenService.java` (`@Transactional(readOnly = true)` 클래스, 쓰기 메서드만 `@Transactional`)
  - `CreatedApiTokenResponse issue(CustomUuid userUuid, CreateApiTokenRequest request)`: ACTIVE 가 5개면 `ErrorCode.API_TOKEN_LIMIT_EXCEEDED`. `tokenPrefix` 는 원문 앞 12자(`fab_` 와 그 뒤 8자)
  - `List<ApiTokenResponse> list(CustomUuid userUuid)`
  - `void revoke(CustomUuid userUuid, CustomUuid tokenUuid)`: 못 찾으면 `ErrorCode.API_TOKEN_NOT_FOUND`
  - `Optional<ApiToken> findActive(String rawToken)`: `findActiveByTokenHash(hash(rawToken))`
  - `@Transactional void recordUsage(ApiToken token, LocalDateTime now)`: `token.needsUsageUpdate(now)` 일 때만 `updateLastUsedAt(token.getId(), now)`
  - `public static String hash(String rawToken)`: SHA-256, 소문자 hex
- DTO: `application/dto/CreateApiTokenRequest.java`(`@NotBlank @Size(max = 50) String name`), `application/dto/ApiTokenResponse.java`(`uuid`, `name`, `tokenPrefix`, `lastUsedAt`, `createdAt`), `application/dto/CreatedApiTokenResponse.java`(위 필드와 `token`)
- `backend/src/main/java/com/bifos/accountbook/shared/exception/ErrorCode.java` 에 추가: `API_TOKEN_NOT_FOUND(HttpStatus.NOT_FOUND, "AT001", "연동 토큰을 찾을 수 없습니다")`, `API_TOKEN_LIMIT_EXCEEDED(HttpStatus.BAD_REQUEST, "AT002", "연동 토큰은 5개까지 만들 수 있습니다")`

### 4. 컨트롤러와 로그 가림

- `apitoken/presentation/controller/ApiTokenController.java`: `@RequestMapping("/api/v1/users/me/api-tokens")`, `@SecurityRequirement(name = "bearerAuth")`
  - `POST` → 201, `ApiSuccessResponse.of("연동 토큰을 발급했습니다", CreatedApiTokenResponse)`
  - `GET` → 200, `ApiSuccessResponse.of("연동 토큰 목록을 조회했습니다", List<ApiTokenResponse>)`
  - `DELETE /{tokenUuid}` → 200, `ApiSuccessResponse.of("연동 토큰을 폐기했습니다")`
- `backend/src/main/java/com/bifos/accountbook/shared/filter/RequestResponseLoggingFilter.java`
  - `logResponse`: 요청이 `POST /api/v1/users/me/api-tokens` 면 본문 대신 ` | Body: (연동 토큰 원문이 담겨 생략)` 을 남긴다
  - `maskToken` 을 부르는 Authorization 처리: 값이 `Bearer fab_` 로 시작하면 앞 19자(`Bearer ` 와 토큰 앞 12자)에 `***` 만 붙이고 끝부분을 남기지 않는다. 그 밖의 값은 지금 동작을 유지한다

### 5. 테스트 (신규 두 파일)

`backend/src/test/java/com/bifos/accountbook/apitoken/presentation/controller/ApiTokenControllerTest.java`: `AbstractControllerTest` 를 상속한다. `fixtures.users.getDefaultUser()` 가 SecurityContext 를 기본 사용자로 설정한다(`backend/src/test/java/com/bifos/accountbook/shared/fixtures/UserFixtures.java`).

- 발급: 201, 응답 `token` 이 `fab_` 로 시작하고 길이 47, `tokenPrefix` 가 `token` 앞 12자다. DB 의 `tokenHash` 가 `ApiTokenService.hash(token)` 과 같다
- 목록: 두 개 발급 뒤 GET 이 두 개를 돌려주고 응답에 `token` 필드가 없다
- 폐기: DELETE 뒤 목록에서 빠지고 DB 상태가 `REVOKED`, `revokedAt` 이 채워진다
- 남의 토큰 폐기: `fixtures.users.getOtherUser()` 로 만든 사용자(SecurityContext 를 바꾸지 않는다)의 토큰을 `ApiTokenService.issue` 로 직접 만들고, 기본 사용자로 그 uuid 를 DELETE 하면 404 `AT001` 이고 그 토큰은 ACTIVE 로 남는다
- 한도: 5개 발급 뒤 6번째는 400 `AT002`
- 이름 검증: 빈 이름과 51자 이름은 400
- 로그: `@ExtendWith(org.springframework.boot.test.system.OutputCaptureExtension.class)` 로 발급 요청의 출력(`CapturedOutput`)에 응답의 `token` 원문이 없다

`backend/src/test/java/com/bifos/accountbook/apitoken/application/service/ApiTokenServiceTest.java`: `@FosSpringBootTest` 통합 테스트.

- `recordUsage`: 처음 호출하면 `lastUsedAt` 이 채워지고, 4분 뒤 시각으로 다시 부르면 바뀌지 않고, 6분 뒤 시각이면 바뀐다
- `recordUsage` 는 폐기를 되돌리지 않는다: `findActive` 로 받은 엔티티를 쥔 채 `revoke` 한 뒤 그 엔티티로 `recordUsage` 를 불러도 DB 상태는 `REVOKED` 다

## Blocked 조건

- 검증 절의 로컬 MySQL 기동에 쓸 Docker 가 없으면 `PHASE_BLOCKED: Docker 없음, V15 와 validate 를 실제 MySQL 에서 확인하지 못함` 을 보고한다.

## 검증

```bash
# cwd: backend
./gradlew checkstyleMain checkstyleTest test --tests 'com.bifos.accountbook.apitoken.*'
./gradlew checkstyleMain checkstyleTest test
```

로컬 MySQL 에서 V15 적용과 `ddl-auto: validate` 통과를 확인한다.

```bash
# cwd: backend
docker compose -f docker/compose.yml up -d --wait mysql
./gradlew bootRun --args='--spring.profiles.active=local' > /tmp/api-token-bootrun.log 2>&1 &
BOOT_PID=$!
until grep -qE "Started AccountBookApplication|APPLICATION FAILED|Error creating bean" /tmp/api-token-bootrun.log; do sleep 2; done
grep -E "Migrating schema .* to version \"15|Started AccountBookApplication|APPLICATION FAILED" /tmp/api-token-bootrun.log
kill $BOOT_PID; pkill -f AccountBookApplication || true
```

기대: 테스트가 모두 통과한다. 기동 로그에 V15 적용(또는 이미 적용됨)과 `Started AccountBookApplication` 이 있고 `APPLICATION FAILED` 가 없다.
`gradle-wrapper.jar` 가 없으면 먼저 `mise exec gradle@9.8.0 -- gradle wrapper --gradle-version 9.8.0` 을 `backend` 에서 실행한다.

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
| `backend/src/main/java/com/bifos/accountbook/shared/filter/RequestResponseLoggingFilter.java` | 수정 |
| `backend/src/test/java/com/bifos/accountbook/apitoken/presentation/controller/ApiTokenControllerTest.java` | 신규 |
| `backend/src/test/java/com/bifos/accountbook/apitoken/application/service/ApiTokenServiceTest.java` | 신규 |
