# Phase 02. 홈 카드의 예산 줄과 예산 화면의 생활비 한도 표시

**Execution profile**: standard

**Domain**: `app-router`

## 목표

달력 홈 카드에 「예산」 줄을 맨 위에 더하고, 「생활비」 줄은 계산된 한도로 보인다. 예산 화면에는 생활비 한도가 어떻게 나왔는지 한 줄로 보인다.

**범위 외**: 백엔드는 phase 01 이다. 누적 선과 카테고리 막대의 합계 기준은 바꾸지 않는다.

## 컨텍스트

모든 경로는 저장소 root 기준이다. 명령은 `frontend/` 에서 돌린다. phase 01 이 응답에 `total`, `allocationExceeded` 를 더했다.

**근거 문서**: `frontend/docs/flow.md` 의 「5. 달력 홈 (`/calendar`)」, 「14-3. /budget 페이지」 절, `frontend/docs/data-schema.md` 의 「BudgetItem」 절, `backend/docs/data-schema.md` 의 「예산 요약과 생활비 합계」 절, `frontend/docs/adr/ADR-F23-semantic-foreground-tokens.md`.

화면:

```text
┌──────────────────────────────┐
│ 예산     1,180,000 / 1,800,000 │
│ █████████████░░░░░░░  66%      │
│ 생활비      620,000 / 1,000,000 │
│ ████████████░░░░░░░░  62%      │
│ 남편 용돈   150,000 /   400,000 │
│ 아내 용돈   410,000 /   400,000 │
└──────────────────────────────┘
```

코드에서 확인한 사실:

- 타입 `frontend/src/types/budget-item.ts` 의 `BudgetSummary` 는 `year`, `month`, `living`, `items` 를 갖는다. 응답 스키마는 `frontend/src/lib/schemas/responses/budget-item.ts` 의 `budgetSummaryResponseSchema` 다.
- 카드 `frontend/src/components/calendar/BudgetSummaryCard.tsx` 는 `lines` 배열을 `{ key: "living", name: "생활비", ...summary.living }` 와 항목으로 만들고, 빈 상태는 `summary.living.limit === 0 && summary.items.length === 0` 이다. 한도 0, 초과 표시는 `BudgetSummaryLine` 이 맡는다.
- 예산 화면 `frontend/src/app/(authenticated)/budget/_components/BudgetClient.tsx` 가 `BudgetItemsSection` 에 `items`, `expenseCategories`, `failed` 를 넘긴다. `BudgetClient` 는 `budget`(월 예산)을 props 로 갖는다.
- `BudgetSummary` 를 만드는 곳: `frontend/src/test-fixtures/calendar.ts`, `frontend/src/__tests__/components/calendar/BudgetSummaryCard.test.tsx`, `frontend/src/__tests__/actions/calendar/get-calendar-month-action.test.ts`, `frontend/src/__tests__/services/calendar/calendar-service.test.ts`, `frontend/browser/fake-backend.mjs`. `git grep -ln "living" frontend/src frontend/browser` 로 다시 확인한다.
- `BudgetItemsSection` 테스트는 `frontend/src/__tests__/app/budget/BudgetItemsSection.test.tsx` 다.

## 의도 메모

- 빈 상태 조건을 `summary.total.limit === 0 && summary.items.length === 0` 으로 바꾼다.
- 줄 순서는 예산, 생활비, 항목(만든 순서)이다. 「예산」 과 「생활비」 는 월 예산이 0 이어도 항목이 있으면 그린다. 이때 한도 0 규칙대로 쓴 금액만 보인다.
- `allocationExceeded` 면 생활비 줄 아래에 「항목 한도가 예산을 넘었어요」 를 `text-expense` 로 보인다.
- 예산 화면의 생활비 한도 줄은 `BudgetItemsSection` 이 그린다. 생활비 한도는 `max(budget - Σ items.monthlyLimit, 0)` 으로 화면에서 계산한다. 예산 화면은 예산 요약 API 를 부르지 않으므로 같은 식을 쓴다. 문구는 「생활비 {한도} = 예산 {월 예산} − 항목 {항목 한도 합}」 이고 금액은 `formatCurrency` 다. 월 예산이 0 이면 그리지 않는다.
- 항목 삭제 확인 문구 「이 항목의 지출은 다시 생활비에 들어갑니다」 는 그대로 맞다.

## 작업 항목

### 1. 타입과 스키마

`BudgetSummary` 와 `budgetSummaryResponseSchema` 에 `total: { spent, limit }` 와 `allocationExceeded: boolean` 을 더한다.

### 2. 홈 카드 `frontend/src/components/calendar/BudgetSummaryCard.tsx`

의도 메모의 줄 순서, 빈 상태, 초과 문구를 반영한다.

### 3. 예산 화면

- `BudgetItemsSection` 에 `monthlyBudget: number` prop 을 더하고, 목록 위에 생활비 한도 줄을 그린다.
- `BudgetClient` 가 `budget` 을 넘긴다.

### 4. fixture 와 가짜 백엔드

`frontend/src/test-fixtures/calendar.ts` 와 `frontend/browser/fake-backend.mjs` 의 예산 요약에 `total`, `allocationExceeded` 를 채운다. 가짜 백엔드는 `total: { spent: 166200, limit: family.monthlyBudget }`, `living: { spent: 16200, limit: family.monthlyBudget - 400000 }`(0 미만이면 0), `allocationExceeded` 는 같은 식으로 둔다. `family.monthlyBudget` 값을 파일에서 읽고 맞춘다.

### 5. 이 phase 를 검증하는 테스트

- `frontend/src/__tests__/components/calendar/BudgetSummaryCard.test.tsx`:
  - 정상: 위 화면의 값을 주면 「예산」 이 첫 줄, 「생활비」 가 둘째 줄이고 「66%」, 「62%」 가 보인다.
  - 초과 배정: `allocationExceeded` true 면 「항목 한도가 예산을 넘었어요」 가 보인다.
  - 빈 상태: `total.limit` 0, 항목 없음이면 빈 상태 문구가 보인다.
- `frontend/src/__tests__/app/budget/BudgetItemsSection.test.tsx`: 월 예산 1,800,000, 항목 한도 400,000 둘이면 「생활비 1,000,000 = 예산 1,800,000 − 항목 800,000」 이 보인다(통화 표기는 `formatCurrency` 결과에 맞춘다). 월 예산 0 이면 그 줄이 없다.
- `frontend/src/__tests__/services/calendar/calendar-service.test.ts` 와 `frontend/src/__tests__/actions/calendar/get-calendar-month-action.test.ts` 의 예산 요약 값에 새 칸을 채운다.
- `frontend/browser/calendar.spec.ts`: 달력을 열면 「예산」, 「생활비」, 「용돈」 이 보인다.

## 검증

```bash
cd frontend && pnpm test -- src/__tests__/components/calendar/BudgetSummaryCard.test.tsx src/__tests__/app/budget/BudgetItemsSection.test.tsx src/__tests__/services/calendar/calendar-service.test.ts src/__tests__/actions/calendar/get-calendar-month-action.test.ts
cd frontend && pnpm tsc --noEmit && pnpm lint && pnpm lint:md && pnpm test
cd frontend && pnpm test:browser -- browser/calendar.spec.ts
```

모두 종료 코드 0 이어야 한다.

## 변경 파일

| 파일 | 변경 |
|---|---|
| `frontend/src/types/budget-item.ts` | 수정 |
| `frontend/src/lib/schemas/responses/budget-item.ts` | 수정 |
| `frontend/src/components/calendar/BudgetSummaryCard.tsx` | 수정 |
| `frontend/src/app/(authenticated)/budget/_components/BudgetItemsSection.tsx` | 수정 |
| `frontend/src/app/(authenticated)/budget/_components/BudgetClient.tsx` | 수정 |
| `frontend/src/test-fixtures/calendar.ts` | 수정 |
| `frontend/browser/fake-backend.mjs` | 수정 |
| `frontend/browser/calendar.spec.ts` | 수정 |
| `frontend/src/__tests__/components/calendar/BudgetSummaryCard.test.tsx` | 수정 |
| `frontend/src/__tests__/app/budget/BudgetItemsSection.test.tsx` | 수정 |
| `frontend/src/__tests__/services/calendar/calendar-service.test.ts` | 수정 |
| `frontend/src/__tests__/actions/calendar/get-calendar-month-action.test.ts` | 수정 |
