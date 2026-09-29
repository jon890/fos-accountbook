# Phase 4: 애플리케이션 레이어 — Service + Scheduler + Event

## 컨텍스트

`fos-accountbook-backend` Spring Boot 백엔드. 반복 지출 기능 구현 중.
Phase 3에서 Repository 구현체가 완료된 상태다.

이 phase의 핵심:

1. 반복 지출 CRUD + 월 합계 Service
2. 매일 새벽 1시 자동 생성 Scheduler
3. 자동 생성 후 가족 알림 Event

반드시 먼저 읽을 문서:

- `CLAUDE.md` — Service 규칙, 이벤트 패턴, AOP 패턴
- `docs/code-architecture.md` — 이벤트 기반 사이드이펙트 패턴
- `docs/prd.md` — v2 반복 지출 기능 명세

기존 코드 참조 (패턴 파악용):

- `src/main/java/com/bifos/accountbook/application/service/ExpenseService.java` — Service 패턴
- `src/main/java/com/bifos/accountbook/application/event/` — Event/Listener 패턴
- `src/main/java/com/bifos/accountbook/application/service/NotificationService.java` — 알림 생성 패턴

## 목표

애플리케이션 레이어에 반복 지출 관련 클래스를 추가한다.

## 작업 목록

### DTO

- [ ] `src/main/java/com/bifos/accountbook/application/dto/RecurringExpenseDto.java` 생성
  - Inner classes: `Create`, `Update`, `Response`
  - `Response`에는 `generatedThisMonth: boolean` 포함
  - `@Getter @Builder @NoArgsConstructor @AllArgsConstructor`

### Service

- [ ] `src/main/java/com/bifos/accountbook/application/service/RecurringExpenseService.java` 생성
  - 클래스 레벨: `@Service @Transactional(readOnly = true) @RequiredArgsConstructor`
  - 메서드:
    - `RecurringExpenseDto.Response create(@UserUuid CustomUuid userUuid, @FamilyUuid CustomUuid familyUuid, RecurringExpenseDto.Create dto)` — `@ValidateFamilyAccess @Transactional`
    - `List<RecurringExpenseDto.Response> getAll(@UserUuid CustomUuid userUuid, @FamilyUuid CustomUuid familyUuid, String yearMonth)` — `@ValidateFamilyAccess`, generatedThisMonth 포함
    - `BigDecimal getMonthlyTotal(@UserUuid CustomUuid userUuid, @FamilyUuid CustomUuid familyUuid)` — `@ValidateFamilyAccess`
    - `RecurringExpenseDto.Response update(@UserUuid CustomUuid userUuid, @FamilyUuid CustomUuid familyUuid, CustomUuid uuid, RecurringExpenseDto.Update dto)` — `@ValidateFamilyAccess @Transactional`
    - `void delete(@UserUuid CustomUuid userUuid, @FamilyUuid CustomUuid familyUuid, CustomUuid uuid)` — `@ValidateFamilyAccess @Transactional`, status를 ENDED로 변경
  - `dayOfMonth` 유효성 검사: 1~28 범위 초과 시 `BusinessException(ErrorCode.INVALID_DAY_OF_MONTH)` (ErrorCode 추가 필요)

### Event

- [ ] `src/main/java/com/bifos/accountbook/application/event/RecurringExpenseCreatedEvent.java` 생성
  - 필드: `String familyUuid`, `String recurringExpenseName`, `int count` (생성된 지출 수)

### Scheduler

- [ ] `src/main/java/com/bifos/accountbook/application/service/RecurringExpenseScheduler.java` 생성
  - `@Component @RequiredArgsConstructor @Slf4j`
  - `@Scheduled(cron = "0 0 1 * * ?")` — 매일 새벽 1시
  - 로직:
    1. 오늘 `dayOfMonth`인 ACTIVE 템플릿 전체 조회
    2. 각 템플릿 → `yearMonth` 계산 (현재 월 YYYY-MM)
    3. `existsByRecurringExpenseUuidAndYearMonth` 확인 → 이미 존재하면 `log.warn("...")` 후 skip
    4. Expense 생성 (recurringExpenseUuid, yearMonth 설정, excludeFromBudget=false)
    5. `applicationEventPublisher.publishEvent(new RecurringExpenseCreatedEvent(...))`

### 알림 연동

- [ ] 기존 Notification Listener에 `RecurringExpenseCreatedEvent` 핸들러 추가 또는 신규 Listener 생성
  - `@TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)`
  - type: `"RECURRING_EXPENSE_CREATED"` (notifications 테이블 type 컬럼, VARCHAR)
  - 가족 전체 알림 (user_uuid = NULL)
  - 예외 삼킴 — 알림 실패가 지출 생성을 막으면 안 됨

### @EnableScheduling

- [ ] 메인 애플리케이션 클래스 또는 Config 클래스에 `@EnableScheduling` 추가 여부 확인. 이미 있으면 스킵.

## 성공 기준

- `./gradlew build -x test -x checkstyleMain -x checkstyleTest --no-daemon` 성공

## 주의사항

- Scheduler는 트랜잭션 내에서 반복 처리: 각 템플릿마다 개별 트랜잭션 (`@Transactional` 메서드로 위임)
- 알림 실패는 예외를 삼켜야 함 — 기존 BudgetAlert 패턴 참조
- `dayOfMonth` 1~28 제한은 Service 레이어에서 검증 (DB constraint 아님)
- `ErrorCode.INVALID_DAY_OF_MONTH` 추가 시 HTTP 상태코드: 400 BAD_REQUEST
