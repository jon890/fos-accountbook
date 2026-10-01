# Phase 03. 목록과 카테고리 관리 화면의 예산 제외 표시

**Execution profile**: fast
**Domain**: color-token

## 목표

내역과 달력 목록의 지출 행에 예산 제외가 보이고, 카테고리 관리 화면의 모바일에서도 「예산 제외」 글자가 보인다.

**범위 외**: 등록 화면은 phase 02 가 끝냈다.

## 컨텍스트

모든 경로는 저장소 root 기준이다. 명령은 `frontend/` 에서 돌린다.

**근거 문서**: `frontend/docs/prd.md` 의 「예산 제외」 행, `frontend/docs/adr/ADR-F37-single-transaction-row.md`.

코드에서 확인한 사실:

- 공용 행 `frontend/src/components/transactions/TransactionRow.tsx`: props 에 `kind`, `metadata`, `trailing?: ReactNode` 가 있다. 지출 행은 내역(`frontend/src/components/expenses/list/ExpenseListClient.tsx`)과 달력(`frontend/src/components/calendar/DayTransactionList.tsx`)이 그린다.
- 지출의 `category` 는 `{ uuid, name, color, icon }` 이라 카테고리 제외 플래그가 없다. 카테고리 목록(`CategoryResponse.excludeFromBudget`)으로 판정해야 한다. 내역은 카테고리 목록을 이미 받는다. 달력은 `frontend/src/components/calendar/CalendarHome.tsx` 가 받는 월 데이터에 카테고리가 있는지 확인한다.
- 카테고리 관리 `frontend/src/app/(authenticated)/categories/_components/CategoryItem.tsx`: 제외 배지 글자가 `hidden md:inline` 이라 모바일은 아이콘만 보인다.

## 의도 메모

- 행 표시: 보조 줄에 「예산 제외」 를 한 항목으로 더한다(`카테고리 · 작성자 · 시각 · 예산 제외`). 새 열을 만들지 않는다. 판정은 지출의 `excludeFromBudget` 이 켜져 있거나 그 카테고리의 `excludeFromBudget` 이 켜져 있을 때다.
- 달력에 카테고리 제외 정보가 없으면 지출 플래그만으로 표시하고 완료 보고에 남긴다. 이 phase 에서 백엔드를 바꾸지 않는다.

## 작업 항목

### 1. `TransactionRow` 가 예산 제외 항목을 보조 줄에 보여 준다

### 2. 내역과 달력이 판정값을 넘긴다

### 3. `CategoryItem` 의 모바일 「예산 제외」 글자

### 4. 이 phase 를 검증하는 테스트

- Jest `frontend/src/__tests__/components/transactions/TransactionRow.test.tsx`: 예산 제외 지출의 보조 줄에 「예산 제외」 가 있고 일반 지출에는 없다.
- 브라우저 `frontend/browser/transactions.spec.ts`: 가짜 백엔드의 지출 하나를 `excludeFromBudget: true` 로 두고, 390px 에서 그 행에 「예산 제외」 가 보인다. `frontend/browser/categories.spec.ts`: 390px 에서 제외 카테고리 카드에 「예산 제외」 글자가 보인다.

## 검증

`frontend/` 에서 실행한다.

```bash
pnpm install --frozen-lockfile
pnpm exec playwright install chromium
pnpm tsc --noEmit && pnpm lint && pnpm lint:md
pnpm test -- src/__tests__/components/transactions/TransactionRow.test.tsx
pnpm test
pnpm test:browser browser/transactions.spec.ts browser/categories.spec.ts
pnpm test:browser
```

기대값: 모든 명령이 성공한다.

## 변경 파일

| 파일 | 변경 |
|---|---|
| `frontend/src/components/transactions/TransactionRow.tsx` | 수정 |
| `frontend/src/components/expenses/list/ExpenseListClient.tsx` | 수정 |
| `frontend/src/components/calendar/DayTransactionList.tsx` | 수정 |
| `frontend/src/components/calendar/CalendarHome.tsx` | 수정 |
| `frontend/src/app/(authenticated)/categories/_components/CategoryItem.tsx` | 수정 |
| `frontend/src/__tests__/components/transactions/TransactionRow.test.tsx` | 수정 |
| `frontend/browser/fake-backend.mjs` | 수정 |
| `frontend/browser/transactions.spec.ts` | 수정 |
| `frontend/browser/categories.spec.ts` | 수정 |
