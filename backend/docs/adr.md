# ADR — fos-accountbook-backend

> 백엔드(Spring Boot) 전용 기술 결정 기록.
> 프론트엔드 결정은 `fos-accountbook/docs/adr.md` 참고.

## Index

**기반 기술**
- [ADR-B01](#adr-b01-java-21--spring-boot-3--mysql-84-lts) — Java 21 + Spring Boot + MySQL 8.4 LTS
- [ADR-B02](#adr-b02-uuid-이중-키-전략) — UUID 이중 키 전략

**도메인 정책**
- [ADR-B03](#adr-b03-soft-delete-전략) — Soft Delete 전략
- [ADR-B07](#adr-b07-bigdecimal-금액-처리) — BigDecimal 금액 처리
- [ADR-B08](#adr-b08-이벤트-기반-예산-알림) — 이벤트 기반 예산 알림
- [ADR-B09](#adr-b09-familymember-역할-기반-권한) — FamilyMember 역할 기반 권한
- [ADR-B12](#adr-b12-반복-지출-스케줄러--spring-scheduled) — 반복 지출 스케줄러
- [ADR-B13](#adr-b13-반복-지출-수정-전략--즉시-전체-반영) — 반복 지출 수정 전략

**인프라 / 성능**
- [ADR-B04](#adr-b04-jwt-인증-hs512-15분7일) — JWT 인증
- [ADR-B17](#adr-b17-소셜-로그인은-프론트엔드-서버-서명을-요구한다-2026-09-30) — 소셜 로그인 서명
- [ADR-B18](#adr-b18-외부-에이전트는-사용자별-연동-토큰으로-기록-경로만-부른다-2026-09-30) — 외부 에이전트 연동 토큰
- [ADR-B05](#adr-b05-category-연관관계-없음-캐시-전략) — Category 캐시 전략
- [ADR-B06](#adr-b06-caffeine-로컬-캐시) — Caffeine 로컬 캐시
- [ADR-B10](#adr-b10-querydsl-동적-쿼리) — QueryDSL 동적 쿼리

**아키텍처 / 운영**
- [ADR-B11](#adr-b11-api-버전-관리-전략) — API 버전 관리 전략
- [ADR-B14](#adr-b14-ci-코드-리뷰-워크플로-설계-2026-04-04) — CI 코드 리뷰 워크플로 (대체됨)
- [ADR-B15](#adr-b15-flyway-sql-백틱-컨벤션-2026-04-05) — Flyway SQL 백틱 컨벤션
- [ADR-B16](#adr-b16-도메인-기반-패키지-리팩토링-2026-04-05) — 도메인 기반 패키지 리팩토링

---

## ADR-B01: Java 21 + Spring Boot 3 + MySQL 8.4 LTS

**결정**: Java 21 (LTS), Spring Boot 3.x, MySQL 8.4 LTS

**이유**:

- Java 21: Virtual Threads (Project Loom), 향후 성능 개선 기반
- Spring Boot 3: Jakarta EE 10, GraalVM Native 지원
- MySQL 8.4 LTS: 안정성 우선, 널리 사용되는 LTS 버전 채택
- 최신 LTS → 장기 유지보수 가능

---

## ADR-B02: UUID 이중 키 전략

**결정**: 내부 PK는 `BIGINT` auto-increment, 외부 노출 ID는 `VARCHAR(36)` uuid

**이유**:

- BIGINT PK: JOIN 성능 최적화, 인덱스 크기 최소화
- UUID 외부 ID: 순차 예측 불가 → 보안 강화, `GET /expenses/1` 같은 열거 공격 방지
- 외부 API는 uuid만 노출

---

## ADR-B03: Soft Delete 전략

**결정**: 물리 삭제 대신 `status` 컬럼 Enum 관리 (ACTIVE | DELETED)

**이유**:

- 가계부 데이터는 감사 추적이 중요 → 삭제 후에도 통계 정합성 유지 필요
- 실수 삭제 복구 가능성 확보
- `deletedAt` 컬럼 방식에서 마이그레이션(V7) 진행 → Enum이 쿼리 조건 명확

**적용 엔티티**: User, Family, FamilyMember, Category, Expense, Income, Invitation

**cascade 정책**:

- `@OneToMany` 관계에 `CascadeType.ALL` + `orphanRemoval = true` 사용 금지
  - orphanRemoval은 컬렉션에서 제거된 자식을 물리 삭제하여 Soft Delete 정책과 충돌한다.
- 허용 cascade: `{CascadeType.PERSIST, CascadeType.MERGE}`
- 부모 삭제 시 자식은 Service 계층에서 명시적으로 soft delete 처리한다.
  - FamilyMember: `status = LEFT`
  - Expense/Income: `status = DELETED`

---

## ADR-B04: JWT 인증 (HS512, 15분/7일)

**결정**: Stateless JWT 인증, Access 15분 / Refresh 7일

**이유**:

- 세션 서버 불필요 → 수평 확장 용이
- Subject: `user.uuid` (내부 BIGINT id 미노출)
- HS512: 대칭키 방식, 단일 서버 환경에서 충분한 보안

**보안 고려**: Refresh Token 탈취 시 7일 유효 → 향후 Refresh Token Rotation 검토

**참고**: `application-local.yml`에서 access token을 24시간으로 오버라이드함 (개발 편의).
prod 프로파일은 15분 유지.

---

## ADR-B05: Category 연관관계 없음 (캐시 전략)

**결정**: Expense/Income 엔티티에서 Category를 ORM 연관관계로 잇지 않고 UUID만 저장

**이유**:

- Category는 변경 빈도가 낮고 가족 단위로 공유 → 캐시 적합
- ORM 연관관계 시 Expense 조회마다 Category JOIN 발생 → N+1 문제
- Caffeine Cache에서 `familyUuid → List<Category>` 조회로 대체

**트레이드오프**: DB 수준 FK 없음 → 데이터 정합성은 애플리케이션이 보장

---

## ADR-B06: Caffeine 로컬 캐시

**결정**: Redis 없이 Caffeine 인메모리 캐시

**이유**:

- 단일 서버 환경 → 분산 캐시 불필요
- Category 목록은 가족 단위, 변경 빈도 낮음 → TTL 10분으로 충분
- Redis 운영 비용 없음

**적용 대상**: CategoryService (`familyUuid → List<Category>`)
**캐시 무효화**: 카테고리 생성·수정·삭제 시 evict

---

## ADR-B07: BigDecimal 금액 처리

**결정**: 금액 필드 전체 `DECIMAL(12, 2)` + BigDecimal

**이유**:

- double/float: 부동소수점 오차 → 금액 계산 신뢰 불가
- BigDecimal: 정밀한 십진수 연산 보장
- API 응답에서 문자열로 직렬화 → 프론트에서 parseFloat 후 Number 처리

---

## ADR-B08: 이벤트 기반 예산 알림

**결정**: 지출 생성·수정 시 Spring ApplicationEvent 발행 → BudgetAlertService 구독

**이유**:

- 지출 저장 로직과 알림 생성 로직 분리 → 단일 책임 원칙
- 트랜잭션 커밋 후 알림 처리 가능 (`@TransactionalEventListener`)
- 향후 비동기 처리(`@Async`) 전환 용이

**알림 타입**: `BUDGET_50_EXCEEDED` (50% 초과) | `BUDGET_80_EXCEEDED` (80% 초과) | `BUDGET_100_EXCEEDED` (100% 초과) | `RECURRING_EXPENSE_CREATED` (반복 지출 자동 생성)

**중복 방지**: `familyUuid + type + yearMonth` 기준으로 알림 중복 체크. 가족의 모든 활성 구성원에게 각각 알림 생성

---

## ADR-B09: FamilyMember 역할 기반 권한

**결정**: OWNER / MEMBER 2단계 역할

**이유**:

- 가족 가계부 특성상 복잡한 RBAC 불필요
- OWNER: 가족 수정·삭제, 초대장 관리
- MEMBER: 지출·수입 등록 (가족 내 모든 데이터 조회 가능)

**구현**: `@ValidateFamilyAccess` AOP 어노테이션으로 메서드 레벨 검증

---

## ADR-B10: QueryDSL 동적 쿼리

**결정**: 동적 필터링(카테고리, 날짜 범위)은 QueryDSL 사용

**이유**:

- JPA Criteria API: 코드 장황, 타입 불안전
- QueryDSL: 컴파일 타임 타입 체크, IDE 자동완성, 가독성 높은 쿼리
- Optional 파라미터의 `WHERE` 조건을 `BooleanBuilder`로 동적 구성

---

## ADR-B11: API 버전 관리 전략

**결정**: URL 경로 버전(`/api/v1/`, `/api/v2/`)으로 관리. Breaking Change 시 신규 버전 신설.

**이유**:

- 프론트엔드와 백엔드 배포 사이클 독립 — 한쪽이 먼저 배포되어도 안정적
- URL 버전은 가장 명시적이고 캐싱·라우팅에서 오해 없음
- 현재 단일 팀(솔로) 환경에서 헤더 버전보다 관리 단순

**Breaking Change 정의**:

- 응답 필드 제거 또는 타입 변경
- 요청 필수 파라미터 추가
- 엔드포인트 경로 변경

**Non-Breaking (v1 유지 가능)**:

- 응답 필드 추가 (프론트는 무시하면 됨)
- 선택적 쿼리 파라미터 추가
- 성능 개선, 버그 수정

**프로세스**:

1. Breaking Change → `/api/v2/` 엔드포인트 신설
2. 프론트엔드 `/api/v2/` 전환 완료 후 `/api/v1/` deprecation 공지
3. 최소 1 스프린트 병행 운영 후 v1 제거

---

## ADR-B12: 반복 지출 스케줄러 — Spring @Scheduled

**결정**: Quartz 미사용, Spring `@Scheduled(cron = "0 0 1 * * ?")` 사용

**이유**:

- 단일 서버 환경 → 분산 스케줄링 불필요
- Quartz: 별도 DB 테이블(11개), 복잡한 설정 → 오버엔지니어링
- 실패 허용 정책 (서버 다운 시 해당일 누락 허용, 복구 로직 없음) → 고가용성 보장 불필요
- 멱등성: `(recurring_expense_uuid, year_month)` DB UNIQUE constraint → 재실행 시 중복 생성 방지, `log.warn` 후 skip

**트레이드오프**: 서버 재시작이 1시~처리 완료 사이에 발생하면 해당일 누락. MVP에서 허용.

---

## ADR-B13: 반복 지출 수정 전략 — 즉시 전체 반영

**결정**: 템플릿 수정 시 즉시 전체 반영. "이번만 수정" 없음.

**이유**:

- "이번만 수정": 별도 override 테이블 + 조회 시 머지 로직 필요 → 복잡도 급증
- 가계부 맥락에서 월세·관리비 등 고정비 변경은 다음 달부터 전체 반영이 자연스러운 워크플로
- MVP 단순성 우선

**트레이드오프**: 이번 달만 임시 변경하려면 자동 생성된 Expense를 수동으로 직접 편집해야 함. 이 워크어라운드를 UI 안내 문구로 명시.

---

## ADR-B14: CI 코드 리뷰 워크플로 설계 (2026-04-04)

**결정**: Claude Code Action 기반 자동 코드 리뷰 워크플로를 아래 방침으로 운영

**status**: superseded

**대체된 부분**: 리뷰 워크플로가 모노레포 하나로 합쳐져 결정 전체를 [ADR-F11](../../frontend/docs/adr.md#adr-f11) 이 소유한다.

**핵심 결정 사항**:

| 항목 | 결정 | 이유 |
| --- | --- | --- |
| 트리거 | `opened` + `/review` 수동 | `synchronize` 제거 — 매 push마다 토큰 소비 방지 |
| 트리거 권한 | PR 은 이 저장소 브랜치에서 연 것만. `/review` 는 댓글 전체가 `/review` 이거나 뒤에 공백·탭·개행이 오고, 작성자가 `OWNER`·`MEMBER`·`COLLABORATOR` 일 때만 | 공개 저장소라 누구나 PR 과 댓글을 남길 수 있음. 포크 PR 에는 secret 이 없어 실패만 하고, 남이 댓글로 우리 토큰을 쓰게 두지 않음. `/reviewer` 같은 다른 명령은 부르지 않음 |
| 체크아웃 | `refs/pull/N/head`. 위험 라벨 스크립트는 `main` 의 것을 실행 | `/review` 댓글 트리거는 기본 체크아웃이 main 이라 PR 파일을 읽지 못함. PR 이 고친 스크립트가 자기 라벨을 정하지 못하게 함 |
| Review Event | 항상 `COMMENT` | 리뷰가 머지를 차단하지 않도록 함 |
| 요약 게시 | Review body 로 통합 — 인라인과 같은 리뷰 1회 등록 | 요약과 인라인이 PR 대화에서 흩어지지 않고 리뷰 단위로 접힘 |
| 코멘트 정리 | 일반·인라인 댓글은 delete, 리뷰 본문은 minimize. 목록 조회는 `--paginate` 와 `per_page=100` | 접힌 블록 누적 회피. 제출된 `COMMENT` 리뷰는 REST 로 삭제 불가라 리뷰만 예외. 기본 페이지 크기 30 을 넘는 오래된 항목도 정리 |
| 등급 | 🔴 P1 치명 ~ ⚪ P5 참고 다섯 단계. P4·P5 는 리뷰당 합쳐 3개까지 | 🔴/🟡 두 단계로는 꼭 고칠 것과 참고할 것 사이가 비어 있음. 머지는 P1 이 남으면 막고 P2 는 고치거나 까닭을 남김 |
| 위험 라벨 | 저장소의 경로 규칙 스크립트가 바뀐 경로로 라벨을 달고 프롬프트가 라벨별 관점을 한 번 더 봄 | LLM 이 매기는 위험 점수는 같은 PR 에서도 실행마다 달라져 기준으로 쓸 수 없음. 처음에는 라벨만 달고 머지 규칙은 바꾸지 않음 |
| 모델 | 리뷰는 Opus 한 agent 가 하고, 지적을 거르는 판정만 서브 에이전트에 맡김. `--model opus` 별칭 지정 | 여러 관점을 한 agent 가 함께 보며 교차 판단. 지적을 만든 쪽이 스스로 거르면 통과시키는 쪽으로 기움. 고정 태그는 모델 교체마다 워크플로 수정이 필요하고, 미인식 태그면 리뷰가 통째로 실패 |
| action 버전 | `anthropics/claude-code-action@v1` major 태그. 실제 모델 ID 는 실행 기록에서 읽어 Job Summary 에 남김 | 릴리스마다 다시 고정하지 않음. 별칭이라 실제 모델을 따로 기록해야 확인 가능 |
| allowed_bots | `"*"` | 봇이 연 PR 도 리뷰 대상. 봇 추가 때마다 워크플로를 고치지 않기 위함 |
| diff 필터 | `gradle-wrapper.jar`, `*.lock`, `build/`, `*.class` 제외. SQL은 포함 | 빌드 산출물 노이즈 제거, SQL 마이그레이션은 리뷰 대상 |
| Job timeout | 15분 | agent hang 시 불필요한 비용 방지 |
| 프롬프트 관리 | 워크플로 옆 텍스트 파일로 분리하고 `envsubst` 로 필요한 변수만 치환 | 등급 표, 위험 라벨 표, 거르기 절차가 더해져 YAML 안에 두면 읽기 어려움. 치환할 변수를 명시해 프롬프트 안의 다른 `$` 를 건드리지 않음 |
| 소규모 PR 스킵 | 안 함 | 추후 재논의. 현재는 모든 PR 동일 리뷰 |

**트레이드오프**:

- `/review` 수동 트리거는 리뷰를 잊을 수 있음 → `opened` 시 자동 1회 실행으로 보완
- `COMMENT` 이벤트는 머지를 막지 못함 → P1 판정의 강제력은 사람 리뷰에 맡김
- 포크에서 연 PR 은 자동 리뷰를 받지 못함 → 필요하면 협업자가 브랜치를 이 저장소로 옮겨 다시 연다
- 접힌 리뷰 본문이 쌓이면 PR 스레드가 길어질 수 있음 → 실행당 한 개이고 OUTDATED 로 접혀 가독성 영향 최소

---

## ADR-B15: Flyway SQL 백틱 컨벤션 (2026-04-05)

**결정**: Flyway SQL과 JPA `@Column` 매핑에서 예약어 가능성이 있는 컬럼명·테이블명에 백틱(`` ` ``)을 사용한다.

**이유**:

- H2 `MODE=MySQL`은 실제 MySQL 예약어를 검증하지 못함 → `year_month`(MySQL 예약어) 이슈가 프로덕션 배포 시점에야 발견됨
- Flyway SQL만 백틱 처리 후에도 JPA `@Column(name = "year_month")`에서 동일 문제 재발 → Hibernate INSERT SQL도 예약어 이스케이프 필요
- 백틱을 일관 사용하면 예약어 충돌을 원천 차단
- 가장 가벼운 방어 수단. 문제가 반복되면 단계적으로 강화:
  1. **(현재)** 백틱 컨벤션
  2. Testcontainers로 CI에서 실제 MySQL 마이그레이션 검증
  3. local Flyway validate 사전 실행

**적용 범위**:

- **Flyway SQL**: V15부터 적용. 이미 적용된 마이그레이션(V1~V14)은 체크섬 불일치 방지를 위해 수정하지 않음
- **JPA `@Column`**: 예약어 가능성이 있는 컬럼명은 `@Column(name = "`column_name`")`으로 작성. Hibernate가 dialect에 맞게 자동 이스케이프

---

## ADR-B16: 도메인 기반 패키지 리팩토링 (2026-04-05)

**결정**: 레이어 중심 패키지 구조(`presentation/application/domain/infra`)를 도메인 중심 구조(`expense/`, `category/` 등)로 전환한다. 각 도메인 패키지 내에 레이어 구조를 유지한다.

**이유**:

- 도메인이 10개로 증가하면서 하나의 기능을 수정하려면 4개 레이어 패키지를 넘나들어야 함 → 코드 탐색 비용 증가
- 도메인별 응집도를 높여 "이 패키지만 보면 전체 흐름을 파악할 수 있는" 구조 지향
- 향후 MSA 전환 시 도메인 패키지를 그대로 독립 모듈로 추출 가능한 구조적 기반 마련

**구조**:

```
com.bifos.accountbook
├── shared/       공통 (CustomUuid, ErrorCode, Auth, AOP, 공통 DTO)
├── expense/      지출 (presentation/application/domain/infra)
├── income/       수입
├── category/     카테고리
├── family/       가족, 멤버십
├── recurring/    반복 지출, 스케줄러
├── invitation/   초대
├── notification/ 알림, 예산 알림
├── dashboard/    대시보드 (read model)
├── user/         사용자, 인증, 프로필
└── config/       Spring 설정 (최상위 유지)
```

**핵심 배치 규칙**:

| 구성 요소               | 배치                        |
| ----------------------- | --------------------------- |
| Status enum + Converter | 해당 도메인의 `domain/`     |
| 이벤트 클래스           | 발행자 도메인               |
| 이벤트 리스너           | 구독자 도메인               |
| CategoryInfo DTO        | `category/application/dto/` |
| FamilyValidationService | `shared/aop/`               |
| CodeEnum, CustomUuid    | `shared/value/`             |

**전략**: Big Bang (1 PR). import 경로만 변경, 로직 변경 없음. 테스트도 동일 구조로 이동.

**범위 제한 (Option A)**:

- ✅ 패키지 구조 변경
- ❌ JPA 연관관계 제거 (Expense↔Family 등) — 향후 별도 이니셔티브
- ❌ 동기 호출 → 이벤트 전환 — 향후 별도 이니셔티브
- ❌ Gradle 멀티모듈 분리

**트레이드오프**:

- JPA `@ManyToOne` 관계가 유지되므로 진정한 MSA 독립 배포는 불가 → 이 단계에서는 코드 응집도 개선에 집중
- Big Bang PR은 diff가 크지만 로직 변경 없이 import만 바뀌므로 과도기 상태(old/new 혼재)보다 안전

---

## ADR-B17: 소셜 로그인은 프론트엔드 서버 서명을 요구한다 (2026-09-30)

**맥락**: 소셜 로그인 API 는 인증 없이 열려 있고 본문의 provider 와 providerId 를 그대로 믿었다.
OAuth 확인은 프론트엔드 서버(NextAuth)가 하고 백엔드는 그 결과만 받는다.
백엔드는 외부 도메인에 노출되지 않지만, 같은 Docker 네트워크의 컨테이너는 providerId 만 알면 아무 사용자의 토큰을 받을 수 있었다.

**결정**: 프론트엔드 서버가 OAuth 로그인을 마친 신원(`provider:providerId`, email)에 서명한 짧은 수명의 HS256 JWT 를 헤더로 보내고, 백엔드는 이것이 맞을 때만 토큰을 발급한다.

- 백엔드는 서명, 수신자, 5분 이하 수명, 본문과 같은 신원인지 검사한다. 하나라도 틀리면 401 이다
- 키는 두 서비스가 이미 공유하는 AUTH_SECRET 으로 용도 문자열을 HMAC 한 파생 키다
  - 비밀값 길이와 상관없이 access token 키와 달라, 로그인 서명과 access token 이 서로의 검증을 통과하지 못한다
  - 수신자가 있는 토큰을 access, refresh token 으로 받지 않는 검사를 한 겹 더 둔다

**대안 기각**:

| 대안 | 기각 이유 |
| --- | --- |
| 백엔드가 Google, Naver ID token 을 직접 검증한다 | 제공자마다 검증 방식과 설정이 늘어난다. Naver 는 OIDC ID token 을 주지 않는다 |
| 내부 전용 비밀값을 헤더에 그대로 싣는다 | 비밀값 원문이 요청마다 네트워크와 로그에 남는다 |
| 새 비밀값을 발급한다 | 두 서비스와 인프라 설정을 함께 바꿔야 한다. 이미 같은 AUTH_SECRET 을 공유한다 |
| AUTH_SECRET 원문을 그대로 키로 쓴다 | 64바이트 이상이면 access token 키와 바이트가 같아져 수신자 검사 하나에만 기대게 된다 |

**결과**:

- 얻는 것: 프론트엔드 서버만 로그인을 요청할 수 있다. 인프라 설정은 바뀌지 않는다
- 감당할 것:
  - 프론트엔드 AUTH_SECRET 과 백엔드 `jwt.secret` 이 달라지면 새 로그인이 모두 401 이다. 이미 로그인한 세션은 refresh 경로를 써서 영향이 없다
  - 백엔드가 먼저 배포되면 프론트엔드가 뜨기 전까지 새 로그인이 실패한다
  - 로컬 개발은 프론트엔드 `.env.local` 의 AUTH_SECRET 을 백엔드 local 값과 맞춰야 한다

---

## ADR-B18: 외부 에이전트는 사용자별 연동 토큰으로 기록 경로만 부른다 (2026-09-30)

- **status**: `accepted`
- **결정**: 사용자가 설정 화면에서 연동 토큰을 발급하고, 외부 에이전트(fos-assistant)는 그 토큰으로 가계부 API 를 부른다.
  토큰은 발급한 사용자로 인증되고, 가족 목록, 카테고리 조회, 지출과 수입의 조회, 등록, 수정, 삭제 경로만 통과한다.
  만료는 없고 사용자가 언제든 폐기한다.
- **맥락**: fos-assistant 가 대화로 가계부를 기록하려면 누구의 기록인지 가계부가 알아야 한다.
  가계부의 가족 권한 검증(ADR-B09)은 서비스 안에서 로그인 사용자의 `userUuid` 로 한다. 그래서 호출자가 사용자를 바르게 정하면 권한 경계가 그대로 지켜진다.
  호출자는 fos-assistant 의 가계부 전용 Hermes profile 에서 도는 fos-agents 가계부 스킬이다. 사용자별 토큰은 그 profile 의 환경 변수로 들어간다.
  Hermes 는 가계부 백엔드와 내부 네트워크를 공유하지 않고 외부 공인 경로로 부른다. 내부 네트워크를 늘리지 않는 대신 백엔드 API 가 인터넷에서 닿으므로, 공개 경로(Swagger, actuator)를 운영에서 닫는다.
- **대안 기각**:

  | 대안 | 기각 이유 |
  | --- | --- |
  | 서비스 공유 토큰 하나와 대리 사용자 지정 | 비밀값 하나로 모든 사용자를 대리할 수 있다. 사용자 매핑을 fos-assistant 가 따로 관리해야 한다 |
  | 사용자 JWT 를 에이전트에 넘긴다 | 수명이 짧아 계속 갱신해야 하고, 모든 API 를 열게 된다 |
  | 토큰에 만료를 둔다 | 만료될 때마다 fos-assistant 에 토큰을 다시 넣어야 연동이 이어진다. 마지막 사용 시각 표시와 폐기로 대신한다 |
  | 해시를 bcrypt 로 한다 | 원문이 무작위 32바이트라 추측 공격을 막으려는 느린 해시가 필요 없다. 요청마다 조회해야 해 SHA-256 고유 인덱스로 찾는다 |

- **결과**:
  - 얻는 것: 에이전트가 사용자 권한 안에서만 가계부를 기록한다. 토큰이 새도 가족 삭제, 초대, 토큰 발급 같은 경로에는 닿지 못한다
  - 감당할 것:
    - 허용 목록은 경로 문자열로 판정한다. 기록 경로를 새로 만들거나 경로를 바꾸면 허용 목록도 함께 고친다
    - 토큰 원문은 발급 응답에만 실린다. 잃어버리면 폐기하고 새로 발급한다
    - 에이전트가 수정과 삭제까지 할 수 있어, 모델이 잘못 판단하면 기존 기록이 바뀔 수 있다. 삭제는 soft delete(ADR-B03)라 복구할 수 있다
    - 5개 한도는 잠금 없이 센다. 동시에 발급하면 잠깐 5개를 넘을 수 있고, 사용자가 폐기해 정리한다
    - 폐기는 다음 요청부터 적용된다. 폐기 직전에 인증을 통과한 요청은 끝까지 처리된다
    - 사용 시각 기록이 실패해도 요청은 처리한다. 기록은 부가 정보다
