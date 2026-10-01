# Phase 02. 업무 날짜 판정을 Asia/Seoul Clock 으로 통일한다

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
- 컨트롤러가 Clock 을 직접 주입받기보다 연월 기본값 계산을 서비스로 옮겨도 된다. 코드가 덜 늘어나는 쪽을 고른다.
- 지출과 수입의 기본 날짜는 `LocalDateTime.now(clock)` 이다. KST 벽시계 시각이 저장된다.

## 작업 항목

### 1. `ClockConfig` 와 스케줄러 cron 의 zone

- `Clock.system(ZoneId.of("Asia/Seoul"))`.
- `@Scheduled(cron = "0 0 1 * * ?", zone = "Asia/Seoul")`.

### 2. 업무 날짜를 Clock 으로 정하기

- 위 「코드에서 확인한 사실」 의 `RecurringExpenseService` 세 곳, `DashboardController.getMonthlyStats`, `ExpenseService` 와 `IncomeService` 의 기본 날짜를 Clock 기준으로 바꾼다.

### 3. 이 phase 를 검증하는 테스트

- `RecurringExpenseServiceTest` 나 컨트롤러 테스트 중 기존에 있는 곳에 케이스를 더한다(없으면 `backend/src/test/java/com/bifos/accountbook/recurring/application/service/RecurringExpenseServiceClockTest.java` 를 새로 만든다): `@Primary Clock` 을 UTC 2026-03-31T16:00:00Z(KST 4월 1일 01:00)로 고정했을 때 반복 지출의 「이번 달」 이 `2026-04` 다.
- 같은 고정 Clock 에서 날짜 없이 지출을 만들면 날짜가 2026-04-01 이다.
- 스케줄러 cron zone 은 애너테이션 값이라 리플렉션으로 `zone` 이 `Asia/Seoul` 인지 단언하는 단위 테스트를 둔다.

## 검증

`backend/` 에서 실행한다. `gradle/wrapper/gradle-wrapper.jar` 가 없으면 먼저 `mise exec gradle@9.8.0 -- gradle wrapper --gradle-version 9.8.0` 을 돌린다. jar 는 커밋하지 않는다.

```bash
./gradlew test --tests "com.bifos.accountbook.recurring.*" --tests "com.bifos.accountbook.expense.*" --tests "com.bifos.accountbook.dashboard.*" --no-daemon
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
| `backend/src/test/java/com/bifos/accountbook/**/*Test.java` | 수정 |
