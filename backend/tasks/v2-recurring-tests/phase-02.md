# Phase 2: 스케줄러 통합 테스트

## 목적

반복 지출 자동 생성은 매일 cron으로 실행되는 핵심 비즈니스 로직이다.
버그 시 전체 사용자의 지출 데이터가 오염되므로, 통합 테스트로 안전망을 확보한다.

## 작업

### 2.1 테스트 클래스 생성

- 파일: `src/test/java/com/bifos/accountbook/application/service/RecurringExpenseSchedulerTest.java`
- `@SpringBootTest` + `@Autowired RecurringExpenseScheduler`
- 테스트용 `Clock` Bean을 `@TestConfiguration`으로 오버라이드 (고정 날짜)

### 2.2 필수 테스트 시나리오

#### TC-01: 정상 생성

- Given: ACTIVE 반복 지출 (dayOfMonth=15), Clock 날짜=15일
- When: `generateRecurringExpenses()` 호출
- Then: `expenses` 테이블에 1건 생성, `recurring_expense_uuid`와 `year_month` 일치

#### TC-02: dayOfMonth 불일치 시 생성 안 함

- Given: ACTIVE 반복 지출 (dayOfMonth=15), Clock 날짜=20일
- When: `generateRecurringExpenses()` 호출
- Then: `expenses` 테이블에 신규 생성 없음

#### TC-03: 멱등성 — 같은 달 2회 실행

- Given: ACTIVE 반복 지출 (dayOfMonth=15), Clock 날짜=15일
- When: `generateRecurringExpenses()` 2회 호출
- Then: `expenses` 테이블에 1건만 존재 (중복 없음)

#### TC-04: ENDED 상태 제외

- Given: ENDED 상태 반복 지출 (dayOfMonth=15), Clock 날짜=15일
- When: `generateRecurringExpenses()` 호출
- Then: `expenses` 테이블에 신규 생성 없음

#### TC-05: 삭제된 가족 skip

- Given: ACTIVE 반복 지출, 해당 가족이 삭제됨
- When: `generateRecurringExpenses()` 호출
- Then: 에러 없이 skip (경고 로그만)

### 2.3 이벤트 발행 검증

- `generateRecurringExpenses()` 호출 후 `RecurringExpenseCreatedEvent`가 발행되었는지 확인
- `@RecordApplicationEvents` 또는 `ApplicationEventPublisher` mock 활용

## 완료 조건

- [ ] 5개 테스트 시나리오 전부 통과
- [ ] `./gradlew test --tests "*.RecurringExpenseSchedulerTest"` 성공
- [ ] 이벤트 발행 검증 포함
