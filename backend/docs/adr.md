# ADR — fos-accountbook-backend

> 백엔드(Spring Boot) 전용 기술 결정 기록.
> 프론트엔드 결정은 `fos-accountbook/docs/adr.md` 참고.

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

---

## ADR-B04: JWT 인증 (HS512, 15분/7일)

**결정**: Stateless JWT 인증, Access 15분 / Refresh 7일

**이유**:

- 세션 서버 불필요 → 수평 확장 용이
- Subject: `user.uuid` (내부 BIGINT id 미노출)
- HS512: 대칭키 방식, 단일 서버 환경에서 충분한 보안

**보안 고려**: Refresh Token 탈취 시 7일 유효 → 향후 Refresh Token Rotation 검토

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

**핵심 결정 사항**:

| 항목 | 결정 | 이유 |
|------|------|------|
| 트리거 | `opened` + `/review` 수동 | `synchronize` 제거 — 매 push마다 토큰 소비 방지 |
| Review Event | 🔴 → `REQUEST_CHANGES`, 없으면 `APPROVE` | PR 머지 안전망 역할 |
| 일반 코멘트 | 제거 — Review body로 통합 | Review API의 body 필드가 요약 역할. 별도 코멘트는 중복 |
| 코멘트 정리 | minimize (OUTDATED) | delete보다 이력 보존에 유리. 인라인 리뷰 코멘트도 포함 |
| 모델 | orchestrator=sonnet, specialist=haiku | 토큰 비용 최적화. haiku로 충분한 단일 관점 분석 |
| allowed_bots | 필요한 봇만 명시 | `"*"` 와일드카드 보안 위험. 봇 추가 시 명시적 업데이트 |
| diff 필터 | `gradle/`, `gradlew*`, `*.lock` 제외. SQL은 포함 | 빌드 도구 노이즈 제거, SQL 마이그레이션은 리뷰 대상 |
| Job timeout | 15분 | agent hang 시 불필요한 비용 방지 |
| 프롬프트 관리 | yml 인라인 유지 | 4개 agent 규모에서 파일 분리는 오버엔지니어링. 단일 파일에서 전체 흐름 파악 가능 |
| 소규모 PR 스킵 | 안 함 | 추후 재논의. 현재는 모든 PR 동일 리뷰 |

**트레이드오프**:
- `/review` 수동 트리거는 리뷰를 잊을 수 있음 → `opened` 시 자동 1회 실행으로 보완
- `REQUEST_CHANGES`는 머지를 차단할 수 있음 → 의도적 안전망으로 수용
- minimize된 코멘트가 쌓이면 PR 스레드가 길어질 수 있음 → OUTDATED 라벨로 접힌 상태이므로 가독성 영향 최소

---

## ADR-B15: Flyway SQL 백틱 컨벤션 (2026-04-05)

**결정**: Flyway 마이그레이션 SQL에서 모든 컬럼명·테이블명에 백틱(`` ` ``)을 사용한다.

**이유**:

- H2 `MODE=MySQL`은 실제 MySQL 예약어를 검증하지 못함 → `year_month`(MySQL 예약어) 이슈가 프로덕션 배포 시점에야 발견됨
- 백틱을 일관 사용하면 예약어 충돌을 원천 차단
- 가장 가벼운 방어 수단. 문제가 반복되면 단계적으로 강화:
  1. **(현재)** 백틱 컨벤션
  2. Testcontainers로 CI에서 실제 MySQL 마이그레이션 검증
  3. local Flyway validate 사전 실행

**적용 범위**: V15부터 적용. 이미 적용된 마이그레이션(V1~V14)은 체크섬 불일치 방지를 위해 수정하지 않음
