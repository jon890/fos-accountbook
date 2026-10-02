# Phase 02. 지출, 수입, 달력, 고정지출 응답 스키마

**Execution profile**: standard
**Domain**: server-action

## 목표

지출, 수입, 달력, 고정지출 서비스의 응답이 스키마로 검증된다.

**범위 외**: 분석과 대시보드는 phase 03, 나머지 도메인은 phase 04 다.

## 컨텍스트

모든 경로는 저장소 root 기준이다. 명령은 `frontend/` 에서 돌린다.

**근거 문서**: `frontend/docs/adr/ADR-F42-service-response-validation.md`, `frontend/docs/data-schema.md`(응답 형태), phase 01 이 만든 `frontend/src/lib/schemas/responses/common.ts`.

코드에서 확인한 사실:

- `frontend/src/services/expense/expense-service.ts` 53행 `serverApiGet<GetExpensesResponse>`(`frontend/src/types/expense.ts` 104행). 목록 항목에 `category` 가 없고 `categoryUuid` 만 있다.
- `frontend/src/services/income/income-service.ts` 48행 `serverApiGet<GetIncomesResponse>`(`frontend/src/types/income.ts` 78행).
- `frontend/src/services/calendar/calendar-service.ts` 43, 46, 49행. 지역 타입 `ApiDailyStats`(14행), `ApiTransaction`(27행)은 `amount: string | number` 를 `Number()` 로 바꾼다.
- `frontend/src/services/recurring-expense/recurring-expense-service.ts` 19행 `GetRecurringExpensesResponse`, 27행 `number`, 36, 47행 `RecurringExpense`.

## 의도 메모

- 스키마는 `z.object` 기본(모르는 필드는 버림)으로 쓴다. `.strict()` 를 쓰지 않는다.
- null 이 올 수 있는 필드는 실제 백엔드 DTO(`backend/src/main/java/**/dto/*Response*.java`, `*Item.java`)를 읽어 `.nullable()` 이나 `.optional()` 을 정한다. 기억으로 정하지 않는다. 백엔드는 null 필드를 JSON 에서 생략하므로 null 가능 필드는 `.nullish()` 로 둔다.
- `src/types/**` 의 기존 타입은 지우지 않는다. 스키마 파일에 `const _check: z.ZodType<기존타입> = 스키마;` 같은 컴파일 시점 대조를 둬 어긋나면 `tsc` 가 실패하게 한다. 서비스 안에만 있던 지역 타입은 `z.infer` 로 바꾼다.
- 서비스 호출에 `{ schema }` 를 넘긴다. 반환 타입은 바꾸지 않는다.
- 달력의 금액은 `z.coerce.number()` 로 받아 `Number()` 정규화를 대신한다.

## 작업 항목

### 1. `frontend/src/lib/schemas/responses/transaction.ts`(신규): 지출, 수입 항목과 목록

### 2. `frontend/src/lib/schemas/responses/calendar.ts`(신규), `frontend/src/lib/schemas/responses/recurring-expense.ts`(신규)

### 3. 네 서비스에 `schema` 연결

### 4. 테스트

- `frontend/src/__tests__/services/expense/expense-service.test.ts`(수정), `frontend/src/__tests__/services/calendar/calendar-service.test.ts`(수정): 필드가 빠진 응답이면 `ResponseValidationError`.
- `frontend/src/__tests__/lib/schemas/responses/transaction.test.ts`(신규): 백엔드가 생략하는 null 필드가 없어도 통과한다.

## 검증

`frontend/` 에서 실행한다.

```bash
pnpm tsc --noEmit && pnpm lint && pnpm lint:md && pnpm test
pnpm test src/__tests__/services/expense/expense-service.test.ts src/__tests__/services/calendar/calendar-service.test.ts src/__tests__/lib/schemas/responses/transaction.test.ts
pnpm test:browser
```

기대값: 모든 명령이 성공한다. 브라우저 테스트의 가짜 백엔드 응답이 스키마에 걸리면, 가짜 응답이 실제 DTO 와 다른 것인지 먼저 확인하고 가짜 응답을 실제에 맞춘다(`frontend/browser/fake-backend.mjs`).

## 변경 파일

| 파일 | 변경 |
|---|---|
| `frontend/src/lib/schemas/responses/transaction.ts` | 신규 |
| `frontend/src/lib/schemas/responses/calendar.ts` | 신규 |
| `frontend/src/lib/schemas/responses/recurring-expense.ts` | 신규 |
| `frontend/src/services/expense/expense-service.ts` | 수정 |
| `frontend/src/services/income/income-service.ts` | 수정 |
| `frontend/src/services/calendar/calendar-service.ts` | 수정 |
| `frontend/src/services/recurring-expense/recurring-expense-service.ts` | 수정 |
| `frontend/src/__tests__/services/expense/expense-service.test.ts` | 수정 |
| `frontend/src/__tests__/services/calendar/calendar-service.test.ts` | 수정 |
| `frontend/src/__tests__/lib/schemas/responses/transaction.test.ts` | 신규 |
| `frontend/browser/fake-backend.mjs` | 수정 |
