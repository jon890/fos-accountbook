# Code Architecture — fos-accountbook-backend

> 상세 코딩 컨벤션·테스트 패턴·명령어는 `CLAUDE.md` 참고. 이 문서는 계층 구조와 설계 철학만 다룬다.

---

## 패키지 구조

```
com.bifos.accountbook
├── presentation/    Controller, Request/Response DTO
├── application/     Service, 애플리케이션 DTO, AOP, Event, Scheduler
├── domain/          Entity, Repository 인터페이스, Value Object
├── infra/           Repository 구현체 (JPA/QueryDSL), Filter, Security 설정
└── config/          Spring 설정 (캐시, 보안 등)
```

**의존성 방향**: `presentation → application → domain ← infra`
상위 레이어는 하위를 직접 참조하지 않는다. Controller는 Repository를 직접 주입받지 않는다.

---

## 핵심 패턴

### 인증 & 소유권 검증

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
domain/repository/       인터페이스 선언만
infra/persistence/.../impl/  JPA + QueryDSL 구현체
```

### 이벤트 기반 사이드이펙트

지출 생성/수정 등의 사이드이펙트(알림)는 트랜잭션 분리를 위해 Spring ApplicationEvent 사용:

```java
// Service: 이벤트 발행
applicationEventPublisher.publishEvent(new ExpenseCreatedEvent(familyUuid, date));

// Listener: 트랜잭션 커밋 후 처리, 예외는 삼킴 (알림 실패가 지출 생성을 막으면 안 됨)
@TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
public void handle(ExpenseCreatedEvent event) { ... }
```

### 스케줄러 패턴 (v2 — 반복 지출)

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

전체 결정 이력: `docs/adr.md`

---

## 새 도메인 추가 체크리스트

1. `domain/` — Entity (`@Entity` + `@Builder`), Repository 인터페이스
2. `infra/persistence/` — Repository 구현체 (JPA + QueryDSL)
3. `application/` — Service (`@Transactional(readOnly=true)` 기본) + DTO
4. `presentation/` — Controller + Request/Response DTO
5. `db/migration/` — Flyway SQL (`V{N}__{description}.sql`)
6. `docs/data-schema.md` — 스키마 + API 엔드포인트 업데이트
