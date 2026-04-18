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

도메인 기반 패키지 구조 (ADR-B16). 패키지 경로: `com.bifos.accountbook`.

```
com.bifos.accountbook/
├── shared/                 공통 (auth, aop, dto, exception, filter, utils, value)
├── user/ family/ category/ expense/ income/ recurring/
├── invitation/ notification/ dashboard/
│                           각 도메인 내부 presentation/ application/ domain/ infra/
└── config/                 Spring 설정 (캐시, 보안, CORS, Security)
```

각 도메인 내부는 `presentation → application → domain → infra` 단방향 의존성. 상위 레이어는 하위 레이어를 직접 참조하지 않으며, Controller는 Repository를 직접 주입받지 않는다.

상세 구조·레이어 책임은 `docs/code-architecture.md` 참조.

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

`Notification` 엔티티: 예산 50%/80%/100% 초과 시 생성됨 (`BUDGET_50_EXCEEDED`, `BUDGET_80_EXCEEDED`, `BUDGET_100_EXCEEDED`). `is_read`, `year_month` 컬럼으로 중복 방지.

### 캐시 무효화

같은 클래스 내에서 `@CacheEvict` 메서드를 자기 호출하면 AOP 프록시를 우회하므로 `CacheManager`를 직접 사용한다. `createCategory()`처럼 외부에서 호출되는 메서드는 `@CacheEvict` 어노테이션 사용 가능.

## Code Conventions

### Entity 규칙

- `@Entity` + `@Getter` + `@Builder` + `@NoArgsConstructor` + `@AllArgsConstructor`
- **`@Data` 사용 금지** (equals/hashCode 연관관계 무한루프 위험)
- PK: `Long id` (auto_increment), 관계: UUID 기반
- Soft Delete: `status` Enum (`ACTIVE`, `DELETED`). FamilyMember는 `ACTIVE`, `LEFT`

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

## Documentation

> **원칙**: 기술적 의사결정과 전략적 가이드라인은 `docs/`가 source of truth. CLAUDE.md와 docs 내용이 다르면 **docs가 우선**한다.

| 문서                        | 역할                                                                    |
| --------------------------- | ----------------------------------------------------------------------- |
| `docs/prd.md`               | 제품 요구사항, 도메인 구조, 기능/비기능 요구사항                        |
| `docs/flow.md`              | 핵심 사용자 시나리오별 흐름, 도메인 간 이벤트 흐름                      |
| `docs/adr.md`               | 기술 의사결정 기록 (ADR-B01~B16)                                        |
| `docs/code-architecture.md` | 도메인 기반 패키지 구조, 의존성 맵, 핵심 패턴, 새 도메인 체크리스트     |
| `docs/data-schema.md`       | DB 스키마 canonical 소스 (도메인별 그룹핑, 프론트엔드와 공유)           |
| `docs/testing-strategy.md`  | 테스트 피라미드, 필수 시나리오, OpenAPI 계약 검증, Spring Profiles 스펙 |

## 상황별 ADR 필수 참조

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
| CI/PR 리뷰 워크플로 변경 | ADR-B14 — CI 코드 리뷰 워크플로 설계 |
| Flyway 마이그레이션 작성 | ADR-B15 — SQL 백틱 컨벤션 (예약어 이스케이프) |
| 패키지/도메인 구조 변경 | ADR-B16 — 도메인 기반 패키지 리팩토링 |

## 토큰 효율 (Opus/Sonnet 라우팅)

- **논의·계획·docs 작성**: main 세션 (opus 허용)
- **task phase 실행**: sonnet 기본 — rename, 리팩토링, 다중 파일 수정도 sonnet
- **task phase에서 opus 사용 금지 예외**:
  - 새 아키텍처 설계가 phase 안에 있는 경우
  - 복잡 알고리즘 설계 (도메인 핵심 신규 설계)
- **기계적 작업은 opus 금지** — rename/이동/경로 수정 등은 파일 수가 많아도 sonnet으로 충분
- 빌드 검증·커밋 phase는 haiku

## 파일 읽기 효율

- **전체 파일 읽기 금지** (200줄 초과 시) — offset+limit로 필요한 섹션만
- **같은 파일 반복 읽기 금지** — 같은 세션 내에서는 기억해서 재사용
- **대형 docs 파일** (`docs/adr.md` 등)은 grep으로 필요 섹션만 찾아 offset 지정

## 조사/탐색 접근 방식

- **직접 질문에는 직접 답변부터** — 사용자가 특정 파일/영역/패턴을 명시했다면 해당 위치부터 확인. 광범위한 codebase 탐색 금지
- **사용자가 조사 경로를 제시했으면 그 경로부터** — 지시받은 영역에서 codebase 전체를 먼저 뒤지지 않는다
- **Explore agent는 최후 수단** — Grep/Glob/Read로 3번 이상 시도한 후에도 못 찾을 때만 사용
- **가정 없이 주장하지 않기** — "dead code", "미사용" 같은 판단은 실제로 참조를 grep한 후에만 제기

## Task 작업 규칙

- 각 phase는 **원자적 단일 책임** — 다른 관심사면 별도 phase로 분리. **작업 항목 5개 이하** 엄수
- **task 파일 생성 즉시 git commit** — index.json + phase 파일을 실행 전에 커밋
- task 완료 즉시 git commit (index.json 상태 갱신 포함)
- 각 phase 프롬프트는 **자기완결적** (이전 대화 없이 독립 실행 가능)
- **docs 최신화는 task 생성 전 필수** — task phase 내에서 docs 변경 금지

## Git & PR Workflow

- **1 이슈 = 1 PR = 1 브랜치**: 여러 이슈를 하나의 PR로 묶지 않는다.
- **모든 브랜치는 `main`에서 분기**: 다른 feature/fix 브랜치에서 새 브랜치를 파생하지 않는다.
  ```bash
  git checkout main && git pull
  git checkout -b fix/issue-description
  ```
- 병렬 에이전트로 여러 이슈를 처리할 때도 각 에이전트는 정확히 하나의 이슈 + 하나의 PR만 담당한다.
- **PR 제목 형식**: 반드시 `type(scope): description` 형식 준수.
  ```
  feat(expense): add recurring expense scheduler
  fix(auth): resolve JWT refresh token expiry
  docs(adr): add ADR-B17 for event-driven notifications
  chore(skills): adopt 5-skill harness
  ```
  이 형식에서 절대 벗어나지 않는다.
