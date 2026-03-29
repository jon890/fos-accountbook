# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# 빌드
./gradlew build -x test -x checkstyleMain -x checkstyleTest --no-daemon

# 전체 테스트
./gradlew test --no-daemon

# 단일 테스트 클래스 실행
./gradlew test --tests "*NotificationControllerTest*" --no-daemon

# 코드 스타일 검사
./gradlew checkstyleMain --no-daemon

# 로컬 MySQL 실행 (Docker)
docker compose -f docker/compose.yml up -d
```

## Architecture

`presentation → application → domain → infra` 단방향 의존성 구조. 패키지 경로: `com.bifos.accountbook`.

```
presentation/    # Controller, Request/Response DTO
application/     # Service, application-level DTO, AOP, Event
domain/          # Entity, Repository 인터페이스, Value Object
infra/           # Repository 구현체(JPA/QueryDSL), Filter, Config, Security
config/          # Spring 설정 (캐시, 보안 등)
```

**레이어 의존성 규칙**: 상위 레이어는 하위 레이어를 직접 참조하지 않는다. Controller는 Repository를 직접 주입받지 않는다.

## Key Patterns

### 인증 & 소유권 검증

```java
// Controller: @LoginUser로 인증 사용자 주입
public ResponseEntity<?> someEndpoint(@LoginUser LoginUserDto loginUser, ...) { }

// Service: @ValidateFamilyAccess AOP로 가족 멤버십 자동 검증
@ValidateFamilyAccess
@Transactional
public SomeResponse doSomething(@UserUuid CustomUuid userUuid, @FamilyUuid CustomUuid familyUuid, ...) { }
```

모든 가족 리소스(지출, 카테고리, 알림 등)는 반드시 `familyUuid`를 URL에 포함하여 소유권 검증을 가능하게 한다:
```
GET    /families/{familyUuid}/categories
POST   /families/{familyUuid}/categories
PUT    /families/{familyUuid}/categories/{categoryUuid}
DELETE /families/{familyUuid}/categories/{categoryUuid}
```

### Repository 패턴

`domain/repository/`에 인터페이스 선언 → `infra/persistence/repository/impl/`에 JPA/QueryDSL 구현체.

```java
// domain - 인터페이스만
public interface CategoryRepository {
    Optional<Category> findActiveByUuid(CustomUuid uuid);
}

// infra - JPA + QueryDSL 구현
@Repository
@RequiredArgsConstructor
public class CategoryRepositoryImpl implements CategoryRepository { ... }
```

### CustomUuid

모든 도메인 식별자는 `CustomUuid` 값 객체 사용. `@PathVariable CustomUuid familyUuid`로 컨트롤러에서 자동 변환됨.

### 공통 응답

```java
return ResponseEntity.ok(ApiSuccessResponse.of(data));
return ResponseEntity.ok(ApiSuccessResponse.of("메시지", data));
```

### 에러 처리

`BusinessException(ErrorCode.XXX)` 사용. `ErrorCode`에 HTTP 상태코드 정의됨:
- `ACCESS_DENIED` (403), `NOT_FAMILY_MEMBER` (403), `CATEGORY_NOT_FOUND` (404) 등

### 이벤트 기반 사이드이펙트

지출 생성/수정은 Spring Application Event로 사이드이펙트(예산 알림)를 트리거한다:

```java
// Service: 이벤트 발행
applicationEventPublisher.publishEvent(new ExpenseCreatedEvent(familyUuid, date));

// Listener: 트랜잭션 커밋 후 처리 (AFTER_COMMIT)
@TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
public void handleExpenseCreated(ExpenseCreatedEvent event) {
    budgetAlertService.checkAndCreateBudgetAlert(...);
    // 예외는 삼킴 — 알림 실패가 지출 생성을 막으면 안 됨
}
```

`Notification` 엔티티: 예산 경고(80%)/초과(100%) 발생 시 생성됨. `is_read`, `alert_month` 컬럼으로 중복 방지.

### 캐시 무효화

같은 클래스 내에서 `@CacheEvict` 메서드를 자기 호출하면 AOP 프록시를 우회하므로 `CacheManager`를 직접 사용한다. `createCategory()`처럼 외부에서 호출되는 메서드는 `@CacheEvict` 어노테이션 사용 가능.

## Code Conventions

### Entity 규칙
- `@Entity` + `@Getter` + `@Builder` + `@NoArgsConstructor` + `@AllArgsConstructor`
- **`@Data` 사용 금지** (equals/hashCode 연관관계 무한루프 위험)
- PK: `Long id` (auto_increment), 관계: UUID 기반
- Soft Delete: `deleted_at DATETIME` 컬럼 또는 `status` Enum (`ACTIVE`, `DELETED`)

### DTO 규칙
- `@Getter` + `@Builder` + `@NoArgsConstructor` + `@AllArgsConstructor` (Setter 없음)
- Response DTO는 `static from(Entity entity)` 정적 팩토리 메서드로 변환

### Service 규칙
- 클래스 레벨에 `@Transactional(readOnly = true)` 기본 적용
- 쓰기 작업 메서드에만 `@Transactional` 추가

### 코드 스타일 (Google Java Style + Naver Convention)
- 들여쓰기: 2 spaces, 연속 들여쓰기: 4 spaces
- 메서드 체이닝: `.`은 새 줄의 시작에 위치
- `import java.util.*` 같은 와일드카드 import 금지 (static import 제외)
- 한국어 발음 표기 식별자 금지 (`jibun` ❌, `address` ✅)
- Checkstyle: `config/checkstyle/google_checks.xml` 기준 빌드 시 자동 검사

## Testing

### Controller 통합 테스트

`AbstractControllerTest`를 상속받아 작성:

```java
@DisplayName("Some API 통합 테스트")
class SomeControllerTest extends AbstractControllerTest {

    @Test
    void someTest() throws Exception {
        // fixtures: Fluent API로 테스트 데이터 생성
        User user = fixtures.getDefaultUser();
        Family family = fixtures.getDefaultFamily();
        Category category = fixtures.categories.category(family).name("식비").build();

        mockMvc.perform(get("/api/v1/families/{familyUuid}/categories", family.getUuid().getValue())
                   .header("X-User-UUID", user.getUuid().getValue()))
               .andExpect(status().isOk())
               .andExpect(jsonPath("$.success").value(true));
    }
}
```

`AbstractControllerTest` 제공: `mockMvc`, `objectMapper`, `fixtures`, DB 자동 정리

### Service 통합 테스트

`TestFixturesSupport`를 상속:

```java
class SomeServiceTest extends TestFixturesSupport {
    @Autowired private SomeService someService;
}
```

### 핵심 테스트 원칙

- **`@Transactional` 테스트 사용 금지** — 실제 커밋 여부 검증을 위해
- **Service/Repository 모킹 금지** — 외부 API만 모킹
- DB: H2 in-memory (`test` 프로파일)
- DB 정리: `DatabaseCleanupListener` 또는 `DatabaseCleanupExtension` 사용

## Database

- Flyway 마이그레이션: `src/main/resources/db/migration/V{version}__{description}.sql`
- 테이블/컬럼명: `snake_case`, PK: `id BIGINT AUTO_INCREMENT`
- UUID 컬럼: `VARCHAR(36)` + UNIQUE 인덱스
- **스키마 변경은 반드시 Flyway 마이그레이션으로만**

**주요 도메인 개념**:
- `expenses.exclude_from_budget` / `categories.exclude_from_budget`: 예산 집계에서 제외하는 플래그 (예: 보험, 저축)
- `categories.is_default`: 가족당 하나의 기본 카테고리("미분류") 존재 — 카테고리 삭제 시 해당 지출이 이 카테고리로 이동. 기본 카테고리는 삭제 불가

## Spring Profiles

| Profile | DB | Swagger UI | API Docs (`/v3/api-docs`) |
|---------|-----|------------|--------------------------|
| `local` | Docker MySQL | ✅ | ✅ |
| `prod`  | MySQL | ❌ | ✅ (의도적 공개) |
| `test`  | H2 in-memory | ❌ | ❌ |

> **스펙**: `prod`에서 `/v3/api-docs` JSON 스펙은 항상 공개합니다. 프론트엔드가 언제든 API 스키마를 조회할 수 있도록 하기 위함입니다. Swagger UI(`/swagger-ui`)는 비활성화 상태를 유지합니다.

## Git & PR Workflow

- **1 이슈 = 1 PR = 1 브랜치**: 여러 이슈를 하나의 PR로 묶지 않는다.
- **모든 브랜치는 `main`에서 분기**: 다른 feature/fix 브랜치에서 새 브랜치를 파생하지 않는다.
  ```bash
  git checkout main && git pull
  git checkout -b fix/issue-description
  ```
- 병렬 에이전트로 여러 이슈를 처리할 때도 각 에이전트는 정확히 하나의 이슈 + 하나의 PR만 담당한다.
