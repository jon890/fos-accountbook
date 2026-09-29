# Code Architecture — fos-accountbook-backend

> 상세 코딩 컨벤션·테스트 패턴·명령어는 `CLAUDE.md` 참고. 이 문서는 계층 구조와 설계 철학만 다룬다.

---

## 패키지 구조 (도메인 기반, ADR-B16)

```
com.bifos.accountbook
├── shared/                  도메인 공통 — 아래 상세
├── expense/                 지출
│   ├── presentation/        Controller, Request/Response DTO
│   ├── application/         Service, DTO, Event
│   ├── domain/              Entity, Repository 인터페이스, Value Object, Converter
│   └── infra/               Repository 구현체 (JPA/QueryDSL)
├── income/                  수입 (동일 레이어 구조)
├── category/                카테고리
├── family/                  가족, 멤버십
├── recurring/               반복 지출, 스케줄러
├── invitation/              초대
├── notification/            알림, 예산 알림
├── dashboard/               대시보드 (read model)
├── user/                    사용자, 인증, 프로필
└── config/                  Spring 설정 (캐시, 보안, CORS, QueryDSL, OpenAPI)
```

### shared/ 내부 구조

```
shared/
├── auth/           LoginUser, LoginUserDto, LoginUserArgumentResolver
├── aop/            FamilyAccessAspect, @ValidateFamilyAccess, FamilyValidationService
├── dto/            ApiSuccessResponse, ApiErrorResponse, PaginationResponse
├── exception/      BusinessException, ErrorCode, GlobalExceptionHandler
├── value/          CustomUuid, CodeEnum
├── converter/      UuidConverter (CustomUuid 전용)
├── filter/         RequestResponseLoggingFilter
└── utils/          TimeUtils
```

### 도메인별 소유 원칙

| 구성 요소                      | 배치 규칙                                                   |
| ------------------------------ | ----------------------------------------------------------- |
| Status enum (ExpenseStatus 등) | 해당 도메인의 `domain/value/`                               |
| Status converter               | 해당 도메인의 `domain/converter/`                           |
| 이벤트 클래스                  | **발행자** 도메인의 `application/event/`                    |
| 이벤트 리스너                  | **구독자** 도메인의 `application/event/`                    |
| Projection (read model DTO)    | **사용하는** 도메인의 `domain/repository/projection/`       |
| CategoryInfo DTO               | `category/application/dto/` (다른 도메인이 category를 참조) |

**의존성 방향**: `presentation → application → domain ← infra`
상위 레이어는 하위를 직접 참조하지 않는다. Controller는 Repository를 직접 주입받지 않는다.

---

## 도메인 의존성 맵

```
user ◄── family ──► category
  ▲        ▲           ▲
  │        │           │
  │     invitation     ├── expense ──► notification
  │                    │       (event)
  │                    ├── income
  │                    │
  │                    └── recurring ──► notification
  │                              (event)
  └── dashboard (read model, 여러 도메인 조회)
```

### 서비스 간 의존성 상세

| 서비스                  | 의존 대상 (서비스)                                                        | 비고                                 |
| ----------------------- | ------------------------------------------------------------------------- | ------------------------------------ |
| ExpenseService          | CategoryService, UserService, FamilyValidationService                     |                                      |
| IncomeService           | CategoryService, UserService, FamilyValidationService                     |                                      |
| CategoryService         | ExpenseService, RecurringExpenseService (ObjectProvider)                  | 카테고리 삭제 시 이관                |
| FamilyService           | UserService, CategoryService, UserProfileService, FamilyValidationService | 가족 생성 시 카테고리/프로필         |
| RecurringExpenseService | CategoryService                                                           |                                      |
| InvitationService       | UserService                                                               | FamilyRepository 직접 참조           |
| NotificationService     | FamilyValidationService                                                   |                                      |
| BudgetAlertService      | —                                                                         | Repository 직접 참조 (이벤트 구독자) |
| DashboardService        | —                                                                         | Repository 직접 참조 (read model)    |
| AuthService             | UserService                                                               |                                      |

### 결합 포인트 (향후 MSA 전환 시 해소 대상)

1. **JPA `@ManyToOne` 관계**: Expense↔Family, Income↔Family, FamilyMember↔Family/User, Invitation↔Family/User
2. **동기 호출**: FamilyService→CategoryService, CategoryService→ExpenseService (ObjectProvider)
3. **FamilyValidationService**: 6개 서비스가 공유하는 AOP 관심사

이미 잘 분리된 부분:

- `RecurringExpense`: String UUID 참조 (JPA 관계 없음) — MSA-ready 패턴
- `Category`, `Notification`: CustomUuid 참조 (JPA 관계 없음)
- `Expense→Notification`: 이벤트 기반 통신

---

## 핵심 패턴

### 인증 흐름

```
프론트엔드 (NextAuth)
    │
    │  소셜 로그인 후 백엔드 /api/v1/auth/social-login 호출
    ▼
백엔드 JWT 발급 (HS512, subject: user.uuid)
    │
    │  Access Token + Refresh Token 반환
    ▼
이후 API 요청: Authorization: Bearer <AccessToken>
    │
    ├── JwtAuthenticationFilter: 토큰 검증 → SecurityContext 설정
    ├── LoginUserArgumentResolver: @LoginUser → LoginUserDto 주입
    └── FamilyAccessAspect: @ValidateFamilyAccess → 가족 멤버십 AOP 검증
```

- JWT 관련 클래스: `config/security/` (AbstractJwtTokenProvider, JwtTokenProvider, JwtAuthenticationFilter)
- 프론트엔드 인증(NextAuth)은 프론트엔드가 관리. 백엔드는 자체 JWT만 검증

### 소유권 검증

```java
// Controller: @LoginUser로 인증 사용자 주입
public ResponseEntity<?> endpoint(@LoginUser LoginUserDto loginUser, ...) { }

// Service: @ValidateFamilyAccess AOP → familyUuid 기준 멤버십 자동 검증
@ValidateFamilyAccess
@Transactional
public Response doSomething(@UserUuid CustomUuid userUuid, @FamilyUuid CustomUuid familyUuid, ...) { }
```

모든 가족 리소스는 URL에 `familyUuid` 포함: `/families/{familyUuid}/expenses`

### Repository 패턴

```
{domain}/domain/repository/          인터페이스 선언만
{domain}/infra/repository/impl/      JPA + QueryDSL 구현체
{domain}/infra/repository/jpa/       Spring Data JPA 인터페이스
```

### 이벤트 기반 사이드이펙트

지출 생성/수정 등의 사이드이펙트(알림)는 트랜잭션 분리를 위해 Spring ApplicationEvent 사용:

```java
// expense/application/event/: 이벤트 발행
applicationEventPublisher.publishEvent(new ExpenseCreatedEvent(familyUuid, date));

// notification/application/event/: 트랜잭션 커밋 후 처리, 예외는 삼킴
@TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
public void handle(ExpenseCreatedEvent event) { ... }
```

### 스케줄러 패턴 (반복 지출)

```java
@Component
@RequiredArgsConstructor
public class RecurringExpenseScheduler {

  @Scheduled(cron = "0 0 1 * * ?")  // 매일 새벽 1시
  public void generateRecurringExpenses() {
    // 1. 오늘 day_of_month인 ACTIVE 템플릿 조회
    // 2. 각 템플릿 → Expense INSERT 시도
    //    - (recurring_expense_uuid, year_month) UNIQUE 위반 시 log.warn 후 skip
    // 3. 성공 시 ApplicationEvent 발행 → RECURRING_EXPENSE_CREATED 알림
  }
}
```

멱등성: DB UNIQUE constraint로 보장. 재실행 시 중복 생성 없음.

### 테스트 가능한 시간 의존성 — Clock 주입

날짜/시간에 의존하는 로직(스케줄러 등)은 `Clock` Bean을 주입하여 테스트 가능성을 확보한다:

```java
// Config: Clock Bean 등록
@Bean
public Clock clock() {
    return Clock.systemDefaultZone();
}

// Scheduler: LocalDate.now(clock) 사용
@RequiredArgsConstructor
public class RecurringExpenseScheduler {
    private final Clock clock;

    public void generateRecurringExpenses() {
        LocalDate today = LocalDate.now(clock);
        // ...
    }
}

// Test: 고정 날짜 Clock 주입
@TestConfiguration
static class TestClockConfig {
    @Bean @Primary
    public Clock clock() {
        return Clock.fixed(Instant.parse("2026-04-15T00:00:00Z"), ZoneId.of("Asia/Seoul"));
    }
}
```

---

## 테스트 전략

상세한 테스트 피라미드, 필수 시나리오, OpenAPI 계약 검증 방식은 `docs/testing-strategy.md` 참고.

---

## 기술 결정 참조

| ADR     | 결정                                   |
| ------- | -------------------------------------- |
| ADR-B02 | UUID 이중 키 (내부 BIGINT + 외부 UUID) |
| ADR-B03 | Soft Delete — `status` Enum            |
| ADR-B05 | Category FK 없음 → Caffeine 캐시       |
| ADR-B08 | 이벤트 기반 예산 알림                  |
| ADR-B10 | QueryDSL 동적 쿼리                     |
| ADR-B12 | Spring @Scheduled 스케줄러             |
| ADR-B13 | 반복 지출 수정 즉시 전체 반영          |
| ADR-B16 | 도메인 기반 패키지 리팩토링            |

전체 결정 이력: `docs/adr.md`

---

## 새 도메인 추가 체크리스트

1. `{domain}/domain/` — Entity (`@Entity` + `@Builder`), Repository 인터페이스, Value Object
2. `{domain}/infra/` — Repository 구현체 (JPA + QueryDSL)
3. `{domain}/application/` — Service (`@Transactional(readOnly=true)` 기본) + DTO
4. `{domain}/presentation/` — Controller + Request/Response DTO
5. `db/migration/` — Flyway SQL (`V{N}__{description}.sql`)
6. `docs/data-schema.md` — 스키마 + API 엔드포인트 업데이트
7. 기존 삭제/이관 로직에 새 도메인 반영 (예: 카테고리 삭제 시 새 도메인 데이터도 기본 카테고리로 이동)
8. `docs/flow.md` — 사용자 흐름에 새 도메인 시나리오 추가
