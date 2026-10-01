# Phase 02. 반복 지출 알림을 구성원마다 실제로 만든다

**Execution profile**: deep

## 목표

반복 지출이 자동 생성되면 가족의 ACTIVE 구성원 각자의 알림 목록에 `RECURRING_EXPENSE_CREATED` 알림이 보이게 한다. 지금은 운영에서 하나도 만들어지지 않는다.

**범위 외**: 스케줄러 트랜잭션과 실패 격리는 phase 01 이 끝냈다. 예산 알림, 알림 정리, 알림 화면은 바꾸지 않는다.

## 컨텍스트

모든 경로는 저장소 root 기준이다. 명령은 `backend/` 에서 돌린다.

**근거 문서**: `backend/docs/flow.md` 의 「3. 반복 지출 자동 생성」 절과 `backend/docs/adr/ADR-B08-event-budget-notifications.md` 의 구성원별 중복 방지 정책을 따른다.

코드에서 확인한 사실:

- `backend/src/main/java/com/bifos/accountbook/notification/application/event/RecurringExpenseEventListener.java`
  - `@TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)` 이다. 스케줄러는 트랜잭션 밖에서 이벤트를 발행하고, 이 애너테이션은 `fallbackExecution` 기본값이 false 라 그 이벤트를 버린다. 그래서 운영에서 이 리스너가 실행되지 않는다.
  - 실행되더라도 `userUuid(null)` 로 알림 하나만 만든다. `LocalDate.now()` 로 연월을 정한다.
- 알림 조회 `backend/src/main/java/com/bifos/accountbook/notification/infra/repository/jpa/NotificationJpaRepository.java` 의 `findAllByFamilyUuidAndUserUuidOrderByCreatedAtDesc` 는 `n.userUuid = :userUuid` 로 거른다. null 인 알림은 아무에게도 보이지 않는다.
  읽음 처리(`NotificationService` 의 markAsRead 경로)도 `userUuid` 가 null 이면 `ACCESS_DENIED` 를 낸다.
- 구성원마다 알림을 만드는 기존 패턴: `backend/src/main/java/com/bifos/accountbook/notification/application/service/BudgetAlertService.java` 의 `createAlertIfNotExists` 가 `familyMemberRepository.findAllByFamilyUuid(family.getUuid())` 로 활성 구성원을 받아 구성원마다 저장한다.
- `Clock` 빈은 `backend/src/main/java/com/bifos/accountbook/config/ClockConfig.java` 에 있다.
- 이벤트 타입: `RecurringExpenseCreatedEvent(String familyUuid, ..., int count)`. 정확한 정의는 `git grep -n "record RecurringExpenseCreatedEvent" backend/src/main` 으로 찾는다.

## 의도 메모

- 리스너를 `@EventListener` 로 바꾸지 않고 `fallbackExecution = true` 를 준다. 다른 곳에서 트랜잭션 안에서 발행하면 커밋 뒤에 실행되는 동작을 유지한다.
- 리스너 메서드에 `@Transactional(propagation = REQUIRES_NEW)` 를 적용해 구성원 알림 저장을 한 트랜잭션으로 묶는다. try-catch 를 유지하고 실패 시 현재 트랜잭션을 rollback-only 로 표시해 부분 알림 저장과 커밋 시 UnexpectedRollbackException 전파를 막는다.
- 연월은 `LocalDate.now(clock)` 으로 정한다.

## 작업 항목

### 1. `RecurringExpenseEventListener` 를 고친다

- `@TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT, fallbackExecution = true)`.
- `FamilyMemberRepository.findAllByFamilyUuid` 로 구성원을 받아 구성원마다 `userUuid` 를 채운 알림을 만든다. 구성원이 없으면 debug 로그만 남긴다.
- `Clock` 을 주입받아 연월을 정한다.
- ADR-B08 에 따라 같은 가족, 알림 타입, 연월에 이미 알림이 있는 구성원은 건너뛴다. 구성원별 조회와 `yearMonth` 비교로 판정한다.

### 2. 이 phase 를 검증하는 테스트

- `RecurringExpenseSchedulerTest` 에 통합 케이스를 더한다: 구성원 둘인 가족의 템플릿으로 `scheduler.generateRecurringExpenses()` 를 부른 뒤, 두 구성원 각자의 알림 목록(`NotificationRepository` 나 `NotificationService` 의 사용자별 조회)에 `RECURRING_EXPENSE_CREATED` 가 하나씩 있다.
  기존 TC-06 은 이벤트 발행만 확인해 이 결함을 잡지 못했다. 이 케이스는 알림 행까지 확인한다.
- 같은 가족, 타입, 연월의 이벤트를 다시 처리해도 각 구성원의 알림은 한 건이다.
- LEFT 구성원에게는 알림이 없고, ACTIVE 구성원에게만 알림이 있다.
- 생성된 템플릿이 없으면 알림이 없다.
- `TransactionTemplate` 안에서 이벤트를 발행한 직후에는 알림이 0건이고, 커밋된 뒤에는 구성원별 1건임을 확인한다.
- 알림 저장 실패는 실제 DB 에 임시 CHECK 제약을 만들어 두 번째 구성원의 `user_uuid` 를 거부하는 방식으로 유발한다. Repository 가 반환하는 구성원 순서에서 두 번째 수신자를 고르고, 첫 구성원의 알림 저장 후 두 번째 저장이 실패하도록 만든다. `finally` 에서 제약을 제거한다. 테스트 전용 임시 제약은 운영 스키마 변경이 아니다.
- 실패 뒤 스케줄러가 예외를 내보내지 않고 Expense 와 성공 이벤트는 남으며, 두 구성원의 알림은 모두 0건임을 조회한다. 이후 제약을 제거하고 이벤트를 다시 발행하면 두 구성원의 알림은 각 1건이다.

## 검증

`backend/` 에서 실행한다. `gradle/wrapper/gradle-wrapper.jar` 가 없으면 먼저 `mise exec gradle@9.8.0 -- gradle wrapper --gradle-version 9.8.0` 을 돌린다. jar 는 커밋하지 않는다.

```bash
# cwd: backend
./gradlew test --tests "com.bifos.accountbook.recurring.application.service.RecurringExpenseSchedulerTest" --no-daemon --console=plain
./gradlew checkstyleMain checkstyleTest test --no-daemon --console=plain
```

기대값: 두 명령 모두 BUILD SUCCESSFUL.

## 변경 파일

| 파일 | 변경 |
|---|---|
| `backend/src/main/java/com/bifos/accountbook/notification/application/event/RecurringExpenseEventListener.java` | 수정 |
| `backend/src/test/java/com/bifos/accountbook/recurring/application/service/RecurringExpenseSchedulerTest.java` | 수정 |
