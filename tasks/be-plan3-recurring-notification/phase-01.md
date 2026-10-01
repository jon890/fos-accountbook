# Phase 01. 템플릿 하나를 트랜잭션 하나로 처리하고 실패를 격리한다

**Execution profile**: standard

## 목표

반복 지출 템플릿 하나의 생성이 원자적으로 묶이게 하고, 한 템플릿에서 예외가 나도 나머지 템플릿은 계속 생성되게 한다.

**범위 외**: 알림 생성은 phase 02 다. cron 시각과 타임존, 예산 알림 연동은 이 plan 밖이다.

## 컨텍스트

모든 경로는 저장소 root 기준이다. 명령은 `backend/` 에서 돌린다.

**근거 문서**: `backend/docs/flow.md` 의 「3. 반복 지출 자동 생성」 절, `backend/docs/adr/ADR-B12-recurring-expense-scheduler.md` 의 멱등성 항목.

코드에서 확인한 사실:

- `backend/src/main/java/com/bifos/accountbook/recurring/application/service/RecurringExpenseScheduler.java`
  - `@Scheduled(cron = "0 0 1 * * ?")` 인 `generateRecurringExpenses()` 가 반복문에서 같은 클래스의 `@Transactional public void processTemplate(...)` 을 직접 부른다.
    같은 빈 안의 호출이라 프록시를 거치지 않아 `@Transactional` 이 적용되지 않는다. `backend/CLAUDE.md` 가 금지한 자기 호출이다.
  - 반복문 안에 catch 가 없어 템플릿 하나에서 예외가 나면 남은 템플릿을 모두 건너뛴다.
  - 생성 수를 `Map<String, Integer> familyCountMap` 으로 모은 뒤, 반복문이 끝나면 가족마다 `RecurringExpenseCreatedEvent(familyUuid, "반복 지출", count)` 를 발행한다.
  - `Clock` 을 주입받아 `LocalDate.now(clock)` 으로 오늘을 정한다.
- 테스트: `backend/src/test/java/com/bifos/accountbook/recurring/application/service/RecurringExpenseSchedulerTest.java`
  - `TestFixturesSupport` 를 상속하고, `@RecordApplicationEvents` 와 고정 `Clock`(2025-03-15)을 쓴다. 테스트 메서드는 트랜잭션으로 감싸지 않고 각 테스트 뒤 DB 를 정리한다.
  - TC-01~TC-06 이 생성, 날짜 불일치, 멱등성, ENDED 제외, 삭제된 가족 skip, 이벤트 발행을 확인한다.

## 의도 메모

- 처리 로직을 새 빈으로 옮겨 프록시를 거치게 한다. `TransactionTemplate` 을 스케줄러에 주입하는 방식도 되지만, 같은 도메인의 다른 서비스와 같은 선언적 트랜잭션을 쓰려고 빈 분리를 고른다.
- 이벤트 발행 위치와 방식은 바꾸지 않는다. 리스너 쪽은 phase 02 가 고친다.
- 실패한 템플릿은 `log.warn` 으로 템플릿 uuid 와 예외 메시지를 남기고 넘어간다. 스택은 남기지 않는다(ADR-B12 의 「log.warn 후 skip」).

## 작업 항목

### 1. 신규 `RecurringExpenseGenerator` 로 템플릿 처리 옮기기

- 경로: `backend/src/main/java/com/bifos/accountbook/recurring/application/service/RecurringExpenseGenerator.java`, `@Component`.
- `@Transactional` 메서드 하나가 템플릿 하나를 처리한다. 지금 `processTemplate` 의 본문(중복 확인, 가족 조회, Expense 저장)을 그대로 옮긴다.
- 생성했으면 true, 이미 있거나 가족이 없어 건너뛰었으면 false 를 돌려준다. `familyCountMap` 은 넘기지 않는다.

### 2. `RecurringExpenseScheduler` 가 생성기를 부르고 실패를 격리하기

- `processTemplate` 을 지우고, 반복문에서 생성기를 부른다. true 면 가족별 수를 더한다.
- 반복문 안에서 예외를 잡아 warn 로그를 남기고 다음 템플릿으로 간다.

### 3. 이 phase 를 검증하는 테스트

- `RecurringExpenseSchedulerTest` 의 TC-01~TC-06 은 그대로 통과한다.
- 신규 케이스: 같은 날 템플릿 두 개 중 하나의 처리가 예외를 내면 다른 하나의 Expense 는 생성되고, 이벤트의 count 는 1 이다.
  예외는 `@MockitoSpyBean`(Spring Boot 4 에서 쓰는 이름은 코드베이스의 기존 사용처를 `git grep -n "SpyBean\|MockitoBean" backend/src/test` 로 확인)으로 생성기의 한 호출만 실패시키거나, 해당 템플릿의 카테고리 같은 데이터를 깨뜨려 만든다.
- 신규 케이스: 생성기 호출 안에서 Expense 저장 뒤 예외가 나면 그 Expense 가 남지 않는다(트랜잭션 롤백). 생성기를 직접 부르는 테스트로 확인한다.

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
| `backend/src/main/java/com/bifos/accountbook/recurring/application/service/RecurringExpenseGenerator.java` | 신규 |
| `backend/src/main/java/com/bifos/accountbook/recurring/application/service/RecurringExpenseScheduler.java` | 수정 |
| `backend/src/test/java/com/bifos/accountbook/recurring/application/service/RecurringExpenseSchedulerTest.java` | 수정 |
