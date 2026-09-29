# Phase 3: 컨트롤러 추가 테스트

## 목적

기존 `RecurringExpenseControllerTest`에 누락된 엣지 케이스를 보강한다.

## 작업

### 3.1 존재하지 않는 리소스 수정/삭제

- `updateRecurringExpense_FailsWhenNotFound`: 랜덤 UUID로 PUT → 404
- `deleteRecurringExpense_FailsWhenNotFound`: 랜덤 UUID로 DELETE → 404

### 3.2 dayOfMonth 하한값 검증

- `createRecurringExpense_FailsWhenDayOfMonthIsZero`: dayOfMonth=0 → 400
- `createRecurringExpense_FailsWhenDayOfMonthIsNegative`: dayOfMonth=-1 → 400

### 3.3 monthlyTotal 엔드포인트

- `getMonthlyTotal_Success`: 반복 지출 2건 등록 후 합계 검증
- `getMonthlyTotal_EmptyWhenNoRecurringExpenses`: 등록 없을 때 0 반환 검증

### 3.4 삭제 후 스케줄러 제외 확인 (optional, Phase 2와 겹칠 수 있음)

- 삭제(ENDED) 상태의 반복 지출이 목록에서 제외되는지 재확인

## 완료 조건

- [ ] 최소 6개 추가 테스트 작성
- [ ] `./gradlew test --tests "*.RecurringExpenseControllerTest"` 전체 통과
- [ ] 기존 6개 테스트도 깨지지 않음
