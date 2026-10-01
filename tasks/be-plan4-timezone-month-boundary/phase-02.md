# Phase 02. 업무 날짜 판정을 Asia/Seoul로 통일한다

**Execution profile**: standard

## 목표

「오늘」 과 「이번 달」 판정, 반복 지출 cron 이 KST 기준으로 돈다. JVM 기본 시간대와 저장 시각은 바꾸지 않는다.

**범위 외**: 월 경계는 phase 01 이다. 엔티티 필드 기본값(`Expense.date`, `Income.date`, `FamilyMember.joinedAt` 의 `LocalDateTime.now()`), 응답 `timestamp`, 초대 만료 비교(저장 시각끼리 비교)는 바꾸지 않는다. 프론트엔드는 바꾸지 않는다.

## 컨텍스트

모든 경로는 저장소 root 기준이다. 명령은 `backend/` 에서 돌린다.

**근거 문서**: `backend/docs/adr/ADR-B21-business-date-asia-seoul.md`.

코드에서 확인한 사실(`grep -rn "LocalDate.now()\|LocalDateTime.now()" backend/src/main` 결과에서 업무 날짜만 고름):

- `backend/src/main/java/com/bifos/accountbook/config/ClockConfig.java`: `Clock.systemDefaultZone()`(컨테이너에서 UTC).
- `backend/src/main/java/com/bifos/accountbook/recurring/application/service/RecurringExpenseScheduler.java`: `@Scheduled(cron = "0 0 1 * * ?")`, zone 없음. 오늘은 `LocalDate.now(clock)`.
- `backend/src/main/java/com/bifos/accountbook/recurring/application/service/RecurringExpenseService.java` 64, 91, 139행: `LocalDate.now()` 로 이번 달(`yyyy-MM`)을 정한다.
- `backend/src/main/java/com/bifos/accountbook/dashboard/presentation/controller/DashboardController.java` 72행: `getMonthlyStats` 의 연월 기본값을 `LocalDate.now()` 로 정한다.
- `backend/src/main/java/com/bifos/accountbook/expense/application/service/ExpenseService.java` 96행, `backend/src/main/java/com/bifos/accountbook/income/application/service/IncomeService.java` 67행: 요청에 날짜가 없으면 `LocalDateTime.now()` 로 지출, 수입 날짜를 채운다. 지출 날짜는 사용자가 보는 날짜다(프론트는 선택한 날의 00:00 을 보낸다).
- `backend/src/main/java/com/bifos/accountbook/notification/application/event/RecurringExpenseEventListener.java` 는 이미 `LocalDate.now(clock)` 을 쓴다.
- 테스트에서 Clock 을 바꾸는 패턴: `backend/src/test/java/com/bifos/accountbook/recurring/application/service/RecurringExpenseSchedulerTest.java` 의 `@TestConfiguration TestClockConfig` 가 `@Primary Clock` 을 고정값으로 준다.

## 의도 메모

- JVM 기본 시간대(`TZ`, `-Duser.timezone`)를 바꾸지 않는다. 감사 시각과 저장된 값이 섞여 틀어진다(ADR-B21 대안 기각).
- `DashboardController`에 Clock을 직접 주입하고 기본 연월 계산에 사용한다.
- 기본 Clock 빈은 `Clock.systemDefaultZone()`을 유지한다. 공통 상수 `BusinessTime.ZONE`을 Asia/Seoul로 선언하고 업무 날짜만 `clock.withZone(BusinessTime.ZONE)`으로 계산한다. 지출과 수입의 기본 날짜는 KST 벽시계 시각이다.

## 작업 항목

### 1. `ClockConfig` 와 스케줄러 cron 의 zone

- `ClockConfig`는 `Clock.systemDefaultZone()`을 유지한다. `shared/utils/BusinessTime.java`에 Asia/Seoul ZoneId 상수를 둔다.
- `@Scheduled(cron = "0 0 1 * * ?", zone = "Asia/Seoul")`.

### 2. 업무 날짜를 Clock 으로 정하기

- 위 「코드에서 확인한 사실」 의 `RecurringExpenseService` 세 곳, `DashboardController.getMonthlyStats`, `ExpenseService` 와 `IncomeService` 의 기본 날짜, `RecurringExpenseScheduler`의 오늘, `RecurringExpenseEventListener`의 알림 연월을 `clock.withZone(BusinessTime.ZONE)` 기준으로 바꾼다.

### 3. 이 phase 를 검증하는 테스트

- `backend/src/test/java/com/bifos/accountbook/config/BusinessClockIntegrationTest.java`를 추가한다. `@Primary Clock`을 UTC 2026-03-31T16:00:00Z, UTC zone으로 고정한다. 반복 지출 update의 이번 달 생성 여부와 getAll의 연월 기본값, 반복 지출 알림이 `2026-04`를 사용하는지 저장 상태와 응답으로 검증한다. create는 새 UUID에 생성 기록이 없어 항상 false를 반환하므로 정상 생성과 false를 검증하고, 날짜 분기는 코드의 Clock 사용을 확인한다.
- 같은 고정 Clock에서 날짜 없이 지출과 수입을 만들면 2026-04-01 01:00이고, 대시보드 기본 연월 조회가 4월 금액을 반환하는지 검증한다. 명시적으로 전달한 날짜와 연월은 그대로 사용하는지도 확인한다.
- `backend/src/test/java/com/bifos/accountbook/config/ClockConfigTest.java`에서 production Clock의 zone이 JVM 기본 시간대인지 단언한다.
- 같은 UTC 고정 Clock에서 API 토큰의 last_used_at과 revoked_at이 2026-03-31 16:00으로 저장되는 회귀 테스트를 추가한다. 토큰 서비스와 인증 필터 코드는 바꾸지 않는다.
- 스케줄러 cron zone 은 애너테이션 값이라 리플렉션으로 `zone` 이 `Asia/Seoul` 인지 단언하는 단위 테스트를 둔다.

## 검증

`backend/` 에서 실행한다. `gradle/wrapper/gradle-wrapper.jar` 가 없으면 먼저 `mise exec gradle@9.8.0 -- gradle wrapper --gradle-version 9.8.0` 을 돌린다. jar 는 커밋하지 않는다.

```bash
./gradlew test --tests "com.bifos.accountbook.recurring.*" --tests "com.bifos.accountbook.expense.*" --tests "com.bifos.accountbook.dashboard.*" --tests "com.bifos.accountbook.config.*" --tests "com.bifos.accountbook.income.*" --no-daemon
./gradlew checkstyleMain checkstyleTest test --no-daemon
```

기대값: 두 명령 모두 BUILD SUCCESSFUL.

## 변경 파일

| 파일 | 변경 |
|---|---|
| `backend/src/main/java/com/bifos/accountbook/config/ClockConfig.java` | 수정 |
| `backend/src/main/java/com/bifos/accountbook/recurring/application/service/RecurringExpenseScheduler.java` | 수정 |
| `backend/src/main/java/com/bifos/accountbook/recurring/application/service/RecurringExpenseService.java` | 수정 |
| `backend/src/main/java/com/bifos/accountbook/dashboard/presentation/controller/DashboardController.java` | 수정 |
| `backend/src/main/java/com/bifos/accountbook/expense/application/service/ExpenseService.java` | 수정 |
| `backend/src/main/java/com/bifos/accountbook/income/application/service/IncomeService.java` | 수정 |
| `backend/src/test/java/com/bifos/accountbook/config/BusinessClockIntegrationTest.java` | 신규 |
| `backend/src/test/java/com/bifos/accountbook/config/ClockConfigTest.java` | 신규 |
| `backend/src/test/java/com/bifos/accountbook/recurring/application/service/RecurringExpenseSchedulerTest.java` | 수정 |
| `backend/src/main/java/com/bifos/accountbook/shared/utils/BusinessTime.java` | 신규 |
| `backend/src/main/java/com/bifos/accountbook/notification/application/event/RecurringExpenseEventListener.java` | 수정 |
