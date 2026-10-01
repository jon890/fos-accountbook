# Phase 02. 반복 지출 알림을 구성원마다 실제로 만든다

**Execution profile**: standard

## 목표

반복 지출이 자동 생성되면 가족의 ACTIVE 구성원 각자의 알림 목록에 `RECURRING_EXPENSE_CREATED` 알림이 보이게 한다. 지금은 운영에서 하나도 만들어지지 않는다.

**범위 외**: 스케줄러 트랜잭션과 실패 격리는 phase 01 이 끝냈다. 예산 알림, 알림 정리, 알림 화면은 바꾸지 않는다.

## 컨텍스트

모든 경로는 저장소 root 기준이다. 명령은 `backend/` 에서 돌린다.

**근거 문서**: `backend/docs/flow.md` 의 「3. 반복 지출 자동 생성」 절과 그 아래 설명 두 줄.

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
- 리스너 안의 저장은 스케줄러 트랜잭션 밖이다. 구성원 알림 저장을 한 트랜잭션으로 묶을지 정한다. 묶는다면 `@Transactional(propagation = REQUIRES_NEW)` 를 리스너 메서드에 주거나 저장을 서비스 메서드로 옮긴다. 리스너의 try-catch 는 유지해 알림 실패가 스케줄러를 멈추지 않게 한다.
- 연월은 `LocalDate.now(clock)` 으로 정한다.

## 작업 항목

### 1. `RecurringExpenseEventListener` 를 고친다

- `@TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT, fallbackExecution = true)`.
- `FamilyMemberRepository.findAllByFamilyUuid` 로 구성원을 받아 구성원마다 `userUuid` 를 채운 알림을 만든다. 구성원이 없으면 debug 로그만 남긴다.
- `Clock` 을 주입받아 연월을 정한다.

### 2. 이 phase 를 검증하는 테스트

- `RecurringExpenseSchedulerTest` 에 통합 케이스를 더한다: 구성원 둘인 가족의 템플릿으로 `scheduler.generateRecurringExpenses()` 를 부른 뒤, 두 구성원 각자의 알림 목록(`NotificationRepository` 나 `NotificationService` 의 사용자별 조회)에 `RECURRING_EXPENSE_CREATED` 가 하나씩 있다.
  기존 TC-06 은 이벤트 발행만 확인해 이 결함을 잡지 못했다. 이 케이스는 알림 행까지 확인한다.
- 생성된 템플릿이 없으면 알림이 없다.

## 검증

`backend/` 에서 실행한다. `gradle/wrapper/gradle-wrapper.jar` 가 없으면 먼저 `mise exec gradle@9.8.0 -- gradle wrapper --gradle-version 9.8.0` 을 돌린다. jar 는 커밋하지 않는다.

```bash
./gradlew test --tests "com.bifos.accountbook.recurring.application.service.RecurringExpenseSchedulerTest"
./gradlew checkstyleMain checkstyleTest test
```

기대값: 두 명령 모두 BUILD SUCCESSFUL.

## 변경 파일

| 파일 | 변경 |
|---|---|
| `backend/src/main/java/com/bifos/accountbook/notification/application/event/RecurringExpenseEventListener.java` | 수정 |
| `backend/src/test/java/com/bifos/accountbook/recurring/application/service/RecurringExpenseSchedulerTest.java` | 수정 |
