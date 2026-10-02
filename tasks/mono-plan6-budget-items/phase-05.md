# Phase 05. 달력 홈의 예산 요약 카드

**Execution profile**: standard

**Domain**: `app-router`

## 목표

달력 홈 위쪽에 생활비와 예산 항목별 「쓴 금액 / 한도」 카드를 보인다. 부부가 홈을 열자마자 각자 용돈과 생활비를 얼마나 썼는지 보기 위해서다.

**범위 외**: 예산 항목을 만들고 고치는 화면은 phase 06 이다. 기존 `MemberTotals` 는 바꾸지 않는다.

## 컨텍스트

모든 경로는 저장소 root 기준이다. 명령은 `frontend/` 에서 돌린다. phase 04 의 `getBudgetSummary`, `BudgetSummary`, `budgetSummaryResponseSchema` 가 있어야 한다.

**근거 문서**: `frontend/docs/flow.md` 의 「5. 달력 홈 (`/calendar`)」 절, `frontend/docs/data-schema.md` 의 「BudgetItem」 절, `frontend/docs/adr/ADR-F30-backend-monthly-aggregation.md`(합계는 백엔드 집계를 쓴다), `frontend/docs/adr/ADR-F13-oklch-color-system.md`, `frontend/docs/adr/ADR-F23-semantic-foreground-tokens.md`, `frontend/docs/adr/ADR-F35-mobile-spacing.md`.

화면 배치:

```text
‹  2026년 10월  ›
┌──────────────────────────────┐
│ 생활비      620,000 / 1,000,000 │
│ ████████████░░░░░░░░  62%      │
│ 남편 용돈   150,000 /   400,000 │
│ ███████░░░░░░░░░░░░░  38%      │
│ 아내 용돈   410,000 /   400,000 │
│ ████████████████████ 103%      │
└──────────────────────────────┘
● 남편 780,000   ● 아내 400,000        (기존 MemberTotals)
가족 지출 1,180,000  가족 수입 5,000,000
[ 달력 ]
```

코드에서 확인한 사실:

- `frontend/src/services/calendar/calendar-service.ts` 의 `getCalendarMonth(familyUuid, year, month)` 가 `Promise.all` 로 다섯 호출을 한다. 반환 타입은 `frontend/src/types/calendar.ts` 의 `CalendarMonth`(`year`, `month`, `daily`, `expenses`, `incomes`, `members`)다.
- `frontend/src/components/calendar/CalendarHome.tsx` 는 `"use client"` 이고 `MonthHeader` 다음에 `<MemberTotals daily={data.daily} colors={colors} />` 를 그린다.
- 진행 막대는 `frontend/src/components/ui/progress.tsx` 의 `Progress`(`value` 0~100), 금액 표기는 `@/lib/utils/format` 의 `formatCurrency`, 숫자 글꼴은 `num` 클래스다(`frontend/src/components/calendar/MemberTotals.tsx` 참고).
- 서비스 테스트 `frontend/src/__tests__/services/calendar/calendar-service.test.ts` 는 `serverApiGet` 을 경로로 분기해 흉내 낸다. 분기에 없는 경로는 지출 목록 모양을 돌려주므로 `budget-summary` 분기를 더해야 한다.
- 브라우저 테스트의 가짜 백엔드 `frontend/browser/fake-backend.mjs` 는 경로마다 `if` 로 응답한다. `daily-stats` 응답이 2026년 10월, 지출 16,200 이다. `frontend/browser/calendar.spec.ts` 가 `/calendar?month=2026-10&date=2026-10-01` 을 연다.
- `frontend/src/test-fixtures/calendar` 에 달력 테스트용 fixture 가 있다. `CalendarMonth` 를 만드는 테스트와 fixture 는 `budgetSummary` 가 필수가 되면 타입 오류가 난다. 2026-10-02 기준 대상은 `frontend/src/test-fixtures/calendar.ts`, `frontend/src/__tests__/components/calendar/CalendarHome.test.tsx`, `frontend/src/__tests__/actions/calendar/get-calendar-month-action.test.ts`, `frontend/src/__tests__/app/calendar/page.test.tsx` 다. `git grep -ln "CalendarMonth" frontend/src` 로 다시 확인한다.

## 의도 메모

- 예산 요약 호출이 실패하면 다른 다섯 호출과 같이 달력 전체가 오류 화면으로 간다. 요약만 따로 빈 값으로 대체하지 않는다. 홈의 핵심 숫자가 조용히 사라지는 것보다 드러나는 편이 낫다.
- 퍼센트는 `Math.round(spent / limit * 100)` 이고 실제 값을 쓴다(103%). 막대의 `value` 만 100 으로 제한한다.
- 한도가 0 이면 「쓴 금액」 만 보이고 막대와 퍼센트를 그리지 않는다.
- 넘은 줄은 금액과 퍼센트에 `text-expense` 를 쓴다. 하드코딩 색, `text-white`, `text-black` 은 쓰지 않는다.
- 카드 전체가 `/budget` 으로 가는 링크다. `next/link` 를 쓴다. 접근성 이름은 「예산 요약, 예산 화면으로 이동」 이다.
- `md` 미만에서 카드 바깥 여백을 다시 주지 않는다(ADR-F35).

## 작업 항목

### 1. `getCalendarMonth` 에 여섯째 호출

`frontend/src/services/calendar/calendar-service.ts` 의 `Promise.all` 에 `getBudgetSummary(familyUuid, year, month)` 를 더하고 반환값에 `budgetSummary` 를 담는다. `frontend/src/types/calendar.ts` 의 `CalendarMonth` 에 `budgetSummary: BudgetSummary` 를 더한다.

### 2. 컴포넌트 `frontend/src/components/calendar/BudgetSummaryCard.tsx`

- props: `summary: BudgetSummary`.
- 줄 순서: 생활비(이름 「생활비」, `summary.living`), 그다음 `summary.items` 순서 그대로.
- 생활비 줄은 `living.limit > 0` 이거나 `items.length > 0` 일 때 그린다.
- 빈 상태(`living.limit === 0` 이고 `items` 가 비었다): 「예산 항목을 만들면 여기서 볼 수 있어요」 한 줄만 그린다.
- 각 줄: 이름, `formatCurrency(spent)`, 한도가 있으면 ` / formatCurrency(limit)`, `Progress`, 퍼센트.

### 3. `CalendarHome` 에 배치

`MonthHeader` 와 `MemberTotals` 사이에 `<BudgetSummaryCard summary={data.budgetSummary} />` 를 둔다.

### 4. 가짜 백엔드 `frontend/browser/fake-backend.mjs`

`GET /api/v1/families/${FAMILY_UUID}/dashboard/budget-summary` 에 `{ year: 2026, month: 10, living: { spent: 16200, limit: family.monthlyBudget }, items: [{ budgetItemUuid: "00000000-0000-4000-8000-0000000000b1", name: "용돈", limit: 400000, spent: 150000 }] }` 를 `success: true` 로 응답한다. uuid 값이 파일의 다른 값과 겹치지 않는지 `grep -n "0000000000b1" frontend/browser/fake-backend.mjs` 로 확인한다.

### 5. 이 phase 를 검증하는 테스트

- `frontend/src/__tests__/components/calendar/BudgetSummaryCard.test.tsx`(신규):
  - 정상: 생활비 620,000 / 1,000,000 과 항목 둘을 주면 이름 셋, 「62%」, 「38%」 가 보이고 생활비가 첫 줄이다.
  - 한도 초과: `spent` 410,000, `limit` 400,000 이면 「103%」 가 보이고 그 금액 요소에 `text-expense` 클래스가 있다.
  - 한도 0: 퍼센트와 `progressbar` 역할 요소가 그 줄에 없다.
  - 빈 상태: 「예산 항목을 만들면 여기서 볼 수 있어요」 가 보이고 링크의 `href` 가 `/budget` 이다.
- `frontend/src/__tests__/services/calendar/calendar-service.test.ts`: `budget-summary` 분기를 더하고, 반환값의 `budgetSummary` 와 호출 경로(`/families/family-1/dashboard/budget-summary?year=2024&month=2` 형태, 기존 테스트의 가족과 연월 값에 맞춘다)를 단언한다. 요약 호출이 거절되면 `getCalendarMonth` 도 거절된다.
- `frontend/src/__tests__/components/calendar/CalendarHome.test.tsx`, `frontend/src/__tests__/actions/calendar/get-calendar-month-action.test.ts`, `frontend/src/__tests__/app/calendar/page.test.tsx` 와 fixture `frontend/src/test-fixtures/calendar.ts` 에 `budgetSummary` 를 채운다.
- `frontend/browser/calendar.spec.ts`: 달력을 열면 「생활비」 와 「용돈」 이 보이는 단언을 더한다.

## 검증

```bash
cd frontend && pnpm test -- src/__tests__/components/calendar/BudgetSummaryCard.test.tsx src/__tests__/components/calendar/CalendarHome.test.tsx src/__tests__/services/calendar/calendar-service.test.ts src/__tests__/actions/calendar/get-calendar-month-action.test.ts src/__tests__/app/calendar/page.test.tsx
cd frontend && pnpm tsc --noEmit && pnpm lint && pnpm lint:md && pnpm test
cd frontend && pnpm test:browser -- calendar.spec.ts
```

모두 종료 코드 0 이어야 한다. `pnpm test:browser` 가 브라우저 설치 문제로 시작하지 못하면 `pnpm exec playwright install chromium` 뒤 다시 돌린다.

## 변경 파일

| 파일 | 변경 |
|---|---|
| `frontend/src/services/calendar/calendar-service.ts` | 수정 |
| `frontend/src/types/calendar.ts` | 수정 |
| `frontend/src/components/calendar/BudgetSummaryCard.tsx` | 신규 |
| `frontend/src/components/calendar/CalendarHome.tsx` | 수정 |
| `frontend/browser/fake-backend.mjs` | 수정 |
| `frontend/browser/calendar.spec.ts` | 수정 |
| `frontend/src/__tests__/components/calendar/BudgetSummaryCard.test.tsx` | 신규 |
| `frontend/src/__tests__/services/calendar/calendar-service.test.ts` | 수정 |
| `frontend/src/__tests__/components/calendar/CalendarHome.test.tsx` | 수정 |
| `frontend/src/__tests__/actions/calendar/get-calendar-month-action.test.ts` | 수정 |
| `frontend/src/__tests__/app/calendar/page.test.tsx` | 수정 |
| `frontend/src/test-fixtures/calendar.ts` | 수정 |
