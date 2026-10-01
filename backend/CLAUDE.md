# CLAUDE.md — fos-accountbook-backend

Claude Code가 항상 따라야 할 규칙과 참조 문서 포인터.

## 컨텍스트 문서

> **원칙**: 기술적 의사결정과 전략적 가이드라인은 `docs/`가 source of truth. CLAUDE.md와 docs 내용이 다르면 **docs가 우선**.

| 문서 | 역할 | 언제 읽을까 |
|---|---|---|
| [`docs/prd.md`](docs/prd.md) | 제품 요구사항, 도메인 구조, 기능/비기능 요구사항 | 새 기능 추가 전 |
| [`docs/flow.md`](docs/flow.md) | 핵심 사용자 시나리오별 흐름, 도메인 간 이벤트 흐름 | 도메인 간 흐름 변경 시 |
| [`docs/adr/INDEX.md`](docs/adr/INDEX.md) | 기술 의사결정 기록 (ADR-B, 목록은 INDEX) | 기술 결정 시, 아키텍처 질문 시 |
| [`docs/code-architecture.md`](docs/code-architecture.md) | 도메인 기반 패키지 구조, 의존성 맵, 핵심 패턴 | 새 도메인 추가, 레이어 경계 검토 |
| [`docs/data-schema.md`](docs/data-schema.md) | DB 스키마 canonical (도메인별 그룹핑, 프론트와 공유) | 스키마 변경, API 응답 설계 |
| [`docs/testing-strategy.md`](docs/testing-strategy.md) | 테스트 피라미드, OpenAPI 계약 검증, Spring Profiles | 테스트 추가/삭제 |

### 상황별 ADR 필수 참조

아래 작업을 할 때는 해당 ADR을 반드시 먼저 읽는다 — 라이브러리 고유 함정·실험 결과·정책 근거가 담겨 있어 모르고 진행하면 버그 재발 위험.

| 상황 | 필수 확인 ADR |
|---|---|
| UUID 식별자 설계 (신규 테이블) | ADR-B02 — UUID 이중 키 전략 (`id BIGINT` + `uuid VARCHAR(36)`) |
| Soft Delete 적용 | ADR-B03 — `status` Enum 기반 (`ACTIVE`/`DELETED`) |
| JWT/인증 관련 변경 | ADR-B04 — HS512, access 15분/refresh 7일 |
| `@CacheEvict`/`@Cacheable`, Caffeine 조정 | ADR-B05, ADR-B06 — Category 캐시 전략, Caffeine 로컬 캐시 |
| 금액(Money) 계산 | ADR-B07 — BigDecimal 금액 처리 (double/float 금지) |
| Application Event 발행 (AFTER_COMMIT 등) | ADR-B08 — 이벤트 기반 예산 알림 (알림 실패가 본 작업 막지 않도록 예외 삼킴) |
| Family/FamilyMember 권한 검사 | ADR-B09 — 역할 기반 권한 (`@ValidateFamilyAccess` AOP) |
| QueryDSL 동적 쿼리 추가 | ADR-B10 — 동적 쿼리 패턴 |
| 새 엔드포인트 경로 설계 | ADR-B11 — API 버전 관리 전략 |
| 반복 지출 스케줄/수정 | ADR-B12, ADR-B13 — `@Scheduled`, 즉시 전체 반영 정책 |
| Flyway 마이그레이션 작성 | ADR-B15 — SQL 백틱 컨벤션 (예약어 이스케이프) |
| 패키지/도메인 구조 변경 | ADR-B16 — 도메인 기반 패키지 리팩토링 |
| 소셜 로그인 서명 검증 | ADR-B17 — 프론트엔드 서버 서명 필수 |
| 외부 에이전트 연동 토큰 | ADR-B18 — 사용자별 토큰과 허용 경로 |
| JWT 발급과 검증 | ADR-B19 — access 와 refresh 를 `typ` 클레임으로 구분, `typ` 없는 토큰 거부 |
| 요청 응답 로깅, 예외 로그 | ADR-B20 — INFO 에 본문을 남기지 않고 인증 경로 본문은 DEBUG 에서도 생략 |

---

## 기술 스택

`test` 프로파일은 H2(MySQL 모드)를 사용한다.

---

## Commands

```bash
# 빌드 (테스트·체크스타일 제외)
./gradlew build -x test -x checkstyleMain -x checkstyleTest --no-daemon

# 전체 테스트
./gradlew test --no-daemon

# 단일 테스트 클래스
./gradlew test --tests "*NotificationControllerTest*" --no-daemon

# 코드 스타일 검사
./gradlew checkstyleMain checkstyleTest --no-daemon

# 통합 검증 (CI 와 동일)
./gradlew checkstyleMain checkstyleTest test build --no-daemon

# 로컬 MySQL 실행 (Docker)
docker compose -f docker/compose.yml up -d

# 앱 실행 (local 프로파일)
./gradlew bootRun --args='--spring.profiles.active=local'
```

**비대화형 함정**: `--no-daemon` 필수. 데몬 잔존 시 테스트가 상호 간섭. `--console=plain` 으로 ANSI 색상 제거 권장 (sub-agent 로그 파싱 편의).

---

## Architecture

도메인 기반 패키지 구조 (ADR-B16). 패키지 경로: `com.bifos.accountbook`.

```
com.bifos.accountbook/
├── shared/                 공통 (auth, aop, converter, dto, exception, filter, utils, value)
├── user/ family/ category/ expense/ income/ recurring/
├── invitation/ notification/ dashboard/ apitoken/
│                           각 도메인 내부 presentation/ application/ domain/ infra/
└── config/                 Spring 설정 (캐시, 보안, CORS, Security)
```

각 도메인 내부 의존성은 `presentation → application → domain ← infra` 이다.
infra 는 domain 인터페이스를 구현한다. Controller 는 Repository 를 직접 주입받지 않는다.

상세 구조·레이어 책임은 `docs/code-architecture.md` 참조.

---

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

Deprecated legacy 경로(Category, Notification 컨트롤러)와 `/users/me/api-tokens` 는 위 URL 규칙의 예외다.

### Repository 패턴

`{domain}/domain/repository/` 에 인터페이스를 선언하고 `{domain}/infra/repository/impl/` 에 JPA/QueryDSL 구현체를 둔다.
Spring Data 인터페이스는 `{domain}/infra/repository/jpa/` 에 둔다.

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

모든 도메인 식별자는 `CustomUuid` 값 객체를 사용하며, 컨트롤러의 `@PathVariable CustomUuid familyUuid` 로 자동 변환한다.

### 공통 응답

`ApiSuccessResponse.of(data)` 또는 `ApiSuccessResponse.of("메시지", data)` 로 응답한다.

### 에러 처리

`BusinessException(ErrorCode.XXX)` 를 사용하며 HTTP 상태 코드는 `ErrorCode` 가 정한다.

### 이벤트 기반 사이드이펙트

지출 생성/수정은 Spring Application Event 로 사이드이펙트(예산 알림)를 트리거한다:

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

`Notification` 은 예산 50%/80%/100% 초과 시 생성된다(`BUDGET_50_EXCEEDED`, `BUDGET_80_EXCEEDED`, `BUDGET_100_EXCEEDED`).
`(family_uuid, type, alert_month)` 기준으로 중복을 확인한다(`V9__create_notifications_table.sql`).

AFTER_COMMIT 리스너에서 DB 에 쓰려면 `@Transactional(propagation = REQUIRES_NEW)` 가 필요하다(`BudgetAlertService`).
`@TransactionalEventListener` 는 트랜잭션 밖에서 발행한 이벤트를 기본값으로 버린다. 트랜잭션 안에서 발행하거나 `fallbackExecution = true` 를 준다.

### 캐시 무효화

같은 클래스 안의 호출에는 `@Transactional`, `@Cacheable`, `@CacheEvict`, `@ValidateFamilyAccess` 가 적용되지 않는다.
로직을 별도 빈으로 옮기거나 `TransactionTemplate` 을 쓴다. 캐시 무효화는 `CacheManager` 를 직접 사용할 수도 있다.
`createCategory()` 처럼 외부에서 호출되는 메서드는 `@CacheEvict` 를 사용할 수 있다.

---

## Code Conventions

### Entity 규칙

- `@Entity` + `@Getter` + `@Builder` + `@NoArgsConstructor` + `@AllArgsConstructor`
- **`@Data` 사용 금지** (equals/hashCode 연관관계 무한루프 위험)
- PK: `Long id` (auto_increment), 관계: UUID 기반
- Soft Delete: `status` Enum (`ACTIVE`, `DELETED`). FamilyMember 는 `ACTIVE`, `LEFT`

### DTO 규칙

- `@Getter` + `@Builder` + `@NoArgsConstructor` + `@AllArgsConstructor` (Setter 없음)
- Response DTO 는 `static from(Entity entity)` 정적 팩토리 메서드로 변환

### Service 규칙

- 클래스 레벨에 `@Transactional(readOnly = true)` 기본 적용
- 쓰기 작업 메서드에만 `@Transactional` 추가

### 코드 스타일 (Google Java Style + Naver Convention)

- `import java.util.*` 같은 와일드카드 import 금지 (static import 제외)
- 한국어 발음 표기 식별자 금지 (`jibun` ❌, `address` ✅)
- Checkstyle: `config/checkstyle/google_checks.xml` 기준 빌드 시 자동 검사

---

## Testing

### Controller 통합 테스트

`AbstractControllerTest` 를 상속:

```java
@DisplayName("Some API 통합 테스트")
class SomeControllerTest extends AbstractControllerTest {

    @Test
    void someTest() throws Exception {
        fixtures.getDefaultUser();
        Family family = fixtures.getDefaultFamily();
        fixtures.categories.category(family).name("식비").build();

        mockMvc.perform(
                get("/api/v1/families/{familyUuid}/categories", family.getUuid().getValue()))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.success").value(true));
    }
}
```

`fixtures.getDefaultUser()` 가 SecurityContext 를 설정해 그 사용자로 인증된다.

`AbstractControllerTest` 제공: `mockMvc`, `objectMapper`, `fixtures`, DB 자동 정리

### Service 통합 테스트

`TestFixturesSupport` 를 상속:

```java
class SomeServiceTest extends TestFixturesSupport {
    @Autowired private SomeService someService;
}
```

### 핵심 테스트 원칙

- **`@Transactional` 테스트 사용 금지** — 실제 커밋 여부 검증을 위해
- **Service/Repository 모킹 금지** — 외부 API만 모킹
- DB: H2 in-memory (`test` 프로파일)
- DB 정리: `@FosSpringBootTest` 가 붙이는 `DatabaseCleanupListener`

---

## Database

- Flyway 마이그레이션: `src/main/resources/db/migration/V{version}__{description}.sql`
- 테이블/컬럼명: `snake_case`, PK: `id BIGINT AUTO_INCREMENT`
- UUID 컬럼: `VARCHAR(36)` + UNIQUE 인덱스
- **스키마 변경은 반드시 Flyway 마이그레이션으로만**
- **기존 적용 마이그레이션 수정 절대 금지** (checksum 충돌)
- 새 V 파일은 타임스탬프 기반(`V20260418_1200__...`)으로 만든다. Flyway 가 버전을 숫자로 비교한다.

**주요 도메인 개념**:

- `expenses.exclude_from_budget` / `categories.exclude_from_budget`: 예산 집계에서 제외하는 플래그 (예: 보험, 저축)
- `categories.is_default`: 가족당 하나의 기본 카테고리("미분류") 존재 — 카테고리 삭제 시 해당 지출이 이 카테고리로 이동. 기본 카테고리는 삭제 불가

---

## 금지사항

- 프로덕션 코드에 `System.out.println` 을 남기지 않는다. Slf4j `Logger` 를 사용한다.
- Controller 에서 `@Entity` 를 직접 반환하지 않는다. Response DTO 의 `static from(Entity)` 로 변환한다.
