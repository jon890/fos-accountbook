# CLAUDE.md — fos-accountbook-backend

Claude Code가 항상 따라야 할 규칙과 참조 문서 포인터.

## 핵심 워크플로우 스킬

| 시점 | 스킬 | 트리거 |
|---|---|---|
| 새 기능/변경 설계 | `/planning` | "/planning", "계획 세워보자", "설계해보자" |
| plan 실행 (자동 하네스) | `/plan-and-build` | "plan{N} 실행", "구현해줘" — 코드 구현은 항상 이 스킬 |
| plan 실행 (Agent Teams) | `/build-with-teams` | 가시적 협업, 4~5명 에이전트 파이프라인 |
| docs 정리 | `/docs-check` | docs/ 검증, plan 완료 후 주기적 |
| 프론트 API 계약 통합 | `/integrate-api-contract` | 프론트엔드 PR/브랜치와 API 계약 정합성 검토 |
| PR 리뷰 반영 | `/review-fix` | "리뷰 댓글 반영" |

`/planning` → docs 갱신 → task 생성 → `/plan-and-build` 또는 `/build-with-teams` 실행 흐름이 표준.

---

## 팀 소통

- **백엔드 ↔ 프론트엔드 협의는 GitHub Issues** — Slack/Dooray/구두 합의 금지. 추적 가능성 + 컨텍스트 보존 목적.
- **백엔드 레포**: `jon890/fos-accountbook-backend`
- **프론트엔드 레포**: `jon890/fos-accountbook-frontend`
- **API 계약 변경 시**: `/integrate-api-contract` 스킬로 프론트 영향 사전 검토 → GitHub Issue 로 협의 → 머지

---

## 컨텍스트 문서

> **원칙**: 기술적 의사결정과 전략적 가이드라인은 `docs/`가 source of truth. CLAUDE.md와 docs 내용이 다르면 **docs가 우선**.

| 문서 | 역할 | 언제 읽을까 |
|---|---|---|
| [`docs/prd.md`](docs/prd.md) | 제품 요구사항, 도메인 구조, 기능/비기능 요구사항 | 새 기능 추가 전 |
| [`docs/flow.md`](docs/flow.md) | 핵심 사용자 시나리오별 흐름, 도메인 간 이벤트 흐름 | 도메인 간 흐름 변경 시 |
| [`docs/adr.md`](docs/adr.md) | 기술 의사결정 기록 (ADR-B01~B16) | 기술 결정 시, 아키텍처 질문 시 |
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
| CI/PR 리뷰 워크플로 변경 | ADR-B14 — CI 코드 리뷰 워크플로 설계 |
| Flyway 마이그레이션 작성 | ADR-B15 — SQL 백틱 컨벤션 (예약어 이스케이프) |
| 패키지/도메인 구조 변경 | ADR-B16 — 도메인 기반 패키지 리팩토링 |

---

## 기술 스택

- **Language**: Java 21
- **Framework**: Spring Boot 4.0.6
- **Build**: Gradle 9.2 (Kotlin DSL + Version Catalog `libs.versions.toml`)
- **DB**: MySQL 8.4 (prod/local), H2 in-memory (test)
- **ORM**: Spring Data JPA + QueryDSL 5.1
- **Security**: Spring Security + JWT (jjwt 0.13)
- **Migration**: Flyway
- **Docs**: SpringDoc OpenAPI 3.0.3 (Swagger UI)

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
./gradlew checkstyleMain checkstyleTest test build -x integrationTest --no-daemon

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
├── shared/                 공통 (auth, aop, dto, exception, filter, utils, value)
├── user/ family/ category/ expense/ income/ recurring/
├── invitation/ notification/ dashboard/
│                           각 도메인 내부 presentation/ application/ domain/ infra/
└── config/                 Spring 설정 (캐시, 보안, CORS, Security)
```

각 도메인 내부는 `presentation → application → domain → infra` 단방향 의존성. 상위 레이어는 하위 레이어를 직접 참조하지 않으며, Controller는 Repository를 직접 주입받지 않는다.

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

모든 도메인 식별자는 `CustomUuid` 값 객체 사용. `@PathVariable CustomUuid familyUuid` 로 컨트롤러에서 자동 변환됨.

### 공통 응답

```java
return ResponseEntity.ok(ApiSuccessResponse.of(data));
return ResponseEntity.ok(ApiSuccessResponse.of("메시지", data));
```

### 에러 처리

`BusinessException(ErrorCode.XXX)` 사용. `ErrorCode`에 HTTP 상태코드 정의됨:

- `ACCESS_DENIED` (403), `NOT_FAMILY_MEMBER` (403), `CATEGORY_NOT_FOUND` (404) 등

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

`Notification` 엔티티: 예산 50%/80%/100% 초과 시 생성됨 (`BUDGET_50_EXCEEDED`, `BUDGET_80_EXCEEDED`, `BUDGET_100_EXCEEDED`). `is_read`, `year_month` 컬럼으로 중복 방지.

### 캐시 무효화

같은 클래스 내에서 `@CacheEvict` 메서드를 자기 호출하면 AOP 프록시를 우회하므로 `CacheManager` 를 직접 사용한다. `createCategory()` 처럼 외부에서 호출되는 메서드는 `@CacheEvict` 어노테이션 사용 가능.

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

- 들여쓰기: 2 spaces, 연속 들여쓰기: 4 spaces
- 메서드 체이닝: `.` 은 새 줄의 시작에 위치
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
- DB 정리: `DatabaseCleanupListener` 또는 `DatabaseCleanupExtension`

---

## Database

- Flyway 마이그레이션: `src/main/resources/db/migration/V{version}__{description}.sql`
- 테이블/컬럼명: `snake_case`, PK: `id BIGINT AUTO_INCREMENT`
- UUID 컬럼: `VARCHAR(36)` + UNIQUE 인덱스
- **스키마 변경은 반드시 Flyway 마이그레이션으로만**
- **기존 적용 마이그레이션 수정 절대 금지** (checksum 충돌)
- 새 V 파일은 타임스탬프 기반 (`V20260418_1200__...`) — 사전식 정렬이 기존 적용분보다 항상 뒤

**주요 도메인 개념**:

- `expenses.exclude_from_budget` / `categories.exclude_from_budget`: 예산 집계에서 제외하는 플래그 (예: 보험, 저축)
- `categories.is_default`: 가족당 하나의 기본 카테고리("미분류") 존재 — 카테고리 삭제 시 해당 지출이 이 카테고리로 이동. 기본 카테고리는 삭제 불가

---

## 금지사항

- `System.out.println` 프로덕션 코드에 남기지 않기 — `Logger` (Slf4j) 사용
- `@Data` 어노테이션 금지 — Entity 연관관계 무한루프 위험
- Service/Repository 모킹 금지 — 외부 API 만 모킹
- 와일드카드 import 금지 (`import java.util.*` 등, static import 제외)
- 한국어 발음 표기 식별자 금지 (`jibun`, `gajok` 등)
- `@Transactional` 테스트 사용 금지 — 실제 커밋 여부 검증 못 함
- Controller 에서 `@Entity` 직접 반환 금지 — Response DTO + `static from(Entity)` 강제
- 같은 클래스 내 `@CacheEvict`/`@Transactional` 자기 호출 금지 — AOP 프록시 우회됨. `CacheManager` 직접 사용

---

## 토큰 효율 (Opus/Sonnet 라우팅)

- **논의·계획·docs 작성**: main 세션 (opus 허용)
- **task phase 실행**: sonnet 기본 — rename, 리팩토링, 다중 파일 수정도 sonnet
- **task phase에서 opus 사용 금지 예외**:
  - 새 아키텍처 설계가 phase 안에 있는 경우
  - 복잡 알고리즘 설계 (도메인 핵심 신규 설계)
- **기계적 작업은 opus 금지** — rename/이동/경로 수정 등은 파일 수가 많아도 sonnet 으로 충분
- 빌드 검증·커밋 phase 는 haiku

---

## 파일 읽기 효율

- **전체 파일 읽기 금지** (200줄 초과 시) — offset+limit 로 필요한 섹션만
- **같은 파일 반복 읽기 금지** — 같은 세션 내에서는 기억해서 재사용
- **대형 docs 파일** (`docs/adr.md` 등) 은 grep 으로 필요 섹션만 찾아 offset 지정

---

## 조사/탐색 접근 방식

- **직접 질문에는 직접 답변부터** — 사용자가 특정 파일/영역/패턴을 명시했다면 해당 위치부터 확인. 광범위한 codebase 탐색 금지
- **사용자가 조사 경로를 제시했으면 그 경로부터** — 지시받은 영역에서 codebase 전체를 먼저 뒤지지 않는다
- **Explore agent 는 최후 수단** — Grep/Glob/Read 로 3번 이상 시도한 후에도 못 찾을 때만 사용
- **가정 없이 주장하지 않기** — "dead code", "미사용" 같은 판단은 실제로 참조를 grep 한 후에만 제기

---

## Task 작업 규칙

- 각 phase 는 **원자적 단일 책임** — 다른 관심사면 별도 phase 로 분리. **작업 항목 5개 이하** 엄수
- **task 파일 생성 즉시 git commit** — index.json + phase 파일을 실행 전에 커밋
- task 완료 즉시 git commit (index.json 상태 갱신 포함)
- 각 phase 프롬프트는 **자기완결적** (이전 대화 없이 독립 실행 가능)
- **docs 최신화는 task 생성 전 필수** — task phase 내에서 docs 변경 금지

"5개 이하" 근거: 작업 항목이 많으면 AI 에이전트가 뒤쪽을 누락하는 경향.

---

## 문서 작성 원칙

- **AI 에이전트 컨텍스트 효율** — docs 는 AI 에이전트를 위한 것. 컨텍스트를 낭비하지 않도록 간결하게
- **반복·중복 제거** — 같은 내용을 두 문서에 쓰지 않는다
- **의사결정 의도 보존** — "왜 이렇게 했는가" 반드시 기록
- **구현 세부사항은 코드에, docs 에는 "무엇을·왜" 만** — ADR 에 코드 스니펫/파일 경로 나열 금지
- **가독성 + 토큰 효율 6가지 패턴**: 아래 "docs / ADR 작성 형식" 섹션 참조

## 한국어 표현 정책

docs / skill / task 파일을 한국어로 작성할 때 **한국인이 자연스럽게 읽히는 표현을 우선** 한다. 영어 단어를 한자/한글 음차한 표현은 사용 금지.

| 금지 | 권장 대체 |
| --- | --- |
| 매트릭스 (matrix) | **표** / **영향 표** / **분류 표** / **변경-docs 매핑 표** |
| 트리아지 (triage) | **분류** / **우선순위 분류** |
| 베이스라인 (baseline) | **기준선** / **기준값** |
| 스파이크 (spike) | **사전 조사** / **API 검증** |
| 게이트 (gate) | **점검** / **사전 점검** / **통과 조건** |
| 사전 소진 | **사전 해소** ("소진" 은 자원 고갈 비유 — 직관 어려움) |
| 단일 진실원 | **단일 소스** ("진실원" 은 truth-source 직역, 한국어 자연어 아님) |
| 변질 의심 | **변질 우려** ("의심" 보다 "우려" 가 더 자연) |
| 패턴 답습 | **동일 패턴 적용** / **그대로 적용** ("답습" 은 부정 뉘앙스) |

기술 용어 그대로 쓰는 게 표준인 경우 (`rebase`, `merge`, `commit`, `endpoint`, `payload`, `@Transactional`, `JPA` 등) 는 그대로 유지.

## docs / ADR 작성 형식 (가독성 + 토큰 효율)

대상: `docs/*.md` / `CLAUDE.md` / `tasks/**/*.md` / `README.md` / `.claude/skills/*/SKILL.md`.

목표: 작성자가 읽기 쉬울 것 (가독성) + LLM 컨텍스트 비용을 늘리지 않을 것. 충돌 시 가독성 우선.

### 1. semantic line break (문장당 1줄)

한 단락 안의 문장은 줄바꿈으로 분리. markdown 렌더링 결과는 동일하지만 소스 가독성 ↑ + git diff 정밀 + 토큰 동일.

**금지**: 한 단락에 2 문장 이상 같은 줄에 이어쓰기.

### 2. enumerated inline 금지

`① ... ② ... ③ ...` / `1) ... 2) ... 3) ...` / 슬래시 나열 (`A / B / C` 3개 이상) 형식은 markdown bullet list 로 변환한다.

### 3. 괄호 중첩 2겹 이상 금지

`(... (...) ...)` 같은 중첩이 발생하면 단락 분리 또는 bullet 분리로 평탄화한다.

### 4. `=` / `→` 동치·인과 압축은 한 단락 1회만

여러 동치 / 인과 관계를 한 문장에 압축하지 않는다. 각 관계마다 별 문장 + 줄바꿈으로 분리.

### 5. 한 문장이 길면 의미 단위 분할

한 문장이 약 80자 초과 + 백틱 3개 이상 또는 괄호 다수면 의미 단위로 나눈다. "한국어 문장 + 영어 약어 + 코드 inline" 혼재는 가독성 손실의 주범.

### 6. 한 bullet 에 다중 속성 압축 금지 — sub-bullet 으로 분리

한 bullet 안에 **무엇 / 어떻게 / 예외 / 조건 / 근거** 중 2개 이상의 독립 속성을 다음 연결로 이어 압축하지 않는다. 각 속성은 sub-bullet 으로 분리.

- 마침표 (`. ... .`) — 여러 문장
- 콤마 (`A, B, C`) — 병렬 항목
- 더하기 (`A + B + C`) — 변경 사항·구성 요소 나열
- 슬래시 (`A / B / C` 3개 이상) — 패턴 2 와 중첩

---

## Git & PR Conventions

- **main 직접 push 차단** — branch protection. 모든 변경은 작업 브랜치 + PR (task 파일/docs 도 동일)
- **1 이슈 = 1 PR = 1 브랜치** — 여러 이슈를 하나의 PR 로 묶지 않는다
- **모든 브랜치는 `main` 에서 분기** — 다른 feature/fix 브랜치에서 새 브랜치를 파생하지 않는다
  ```bash
  git checkout main && git pull
  git checkout -b fix/issue-description
  ```
- **commit 전 로컬 검증 필수** — `./gradlew checkstyleMain checkstyleTest test build -x integrationTest --no-daemon` 통과 후에만 commit/push. CI 왕복 비용 회피 목적
- **PR 제목**: 반드시 `type(scope): description` 형식
  - `feat(expense): add recurring expense scheduler`
  - `fix(auth): resolve JWT refresh token expiry`
  - `docs(adr): add ADR-B17 for event-driven notifications`
  - `chore(skills): adopt 5-skill harness`

### 브랜치 명명

| 단계 | 브랜치 | 내용 |
|---|---|---|
| 계획 | `plan/{N}-{slug}` | `tasks/plan{N}-{slug}/` task 파일 + docs 갱신 (→ main 머지) |
| 구현 | `feat/plan{N}-{slug}` | task 의 phase 별 코드 commit (→ main 머지) |
| 기타 | `chore/...` · `fix/...` · `refactor/...` · `docs/...` | 일반 작업 |

plan 의 계획/구현 분리는 머지 이력에서 즉시 식별 + 검토 부담 분산이 목적.

### Commit & Push 절차

1. **Safety precheck** — `git status --porcelain`, `git diff`, `git diff --staged` 로 변경 확인. `.env`, `*.pem`, `id_rsa`, `credentials.*`, `secrets.*` 같은 위험 파일 포함 여부 확인. 의심되면 즉시 멈추고 확인
2. **로컬 검증** — Checkstyle + test 실행 (문서만 변경이면 생략 가능)
3. **Staging 계획** — 작은 단일 목적 commit 선호 (concern 별 분리: feature/test/docs/config)
4. **사용자 명시 승인** — staged 파일 + commit 메시지 + 실행 명령을 한 번에 보여주고 승인 받은 후에만 실행
5. **Commit + Push** — `-u origin <branch>` (tracking 없으면)
6. **PR 생성** — 별도 결정 필요한 경우만 (작업 브랜치라면 자동, main/master 직접 push 는 차단)

**Hard rules**:
- 사용자 명시 승인 없이 commit/push 금지
- `--force` / `--force-with-lease` 는 명시 요청 시만
- `--no-verify` (hook skip) 는 명시 요청 시만
- 시크릿 / 빌드 산출물 commit 금지

---

## PR 체크리스트

1. Entity 에 `@Data` 어노테이션 없는가?
2. Controller 가 `@Entity` 를 직접 반환하지 않는가? (Response DTO + `static from` 사용)
3. Service 의 쓰기 메서드에 `@Transactional` 명시했는가?
4. 가족 리소스 엔드포인트에 `familyUuid` 가 URL 에 포함되어 있는가? (소유권 검증)
5. 같은 클래스 내 AOP 자기 호출 (`@CacheEvict`/`@Transactional`) 우회 없는가?
6. 새 Flyway 마이그레이션의 버전이 기존 적용분보다 사전식 정렬상 뒤인가?
7. Checkstyle 통과 (`./gradlew checkstyleMain checkstyleTest`)?
8. 와일드카드 import / 한국어 발음 표기 식별자 없는가?
9. PR 제목이 `type(scope): description` 형식인가?

---

## 한 줄 요약 — 매번 작업 시작 전 확인

> **권한 검증 (ADR-B09 AOP), 트랜잭션 경계 (Service write 메서드), Entity 직접 노출 금지 (DTO 변환), Flyway 새 파일 타임스탬프** — 이 4가지가 backend 의 단골 함정.
