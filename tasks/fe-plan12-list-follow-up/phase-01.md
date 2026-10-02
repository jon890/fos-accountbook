# Phase 01. 300건씩 받기와 「더 보기」

**Execution profile**: standard
**Domain**: app-router

## 목표

지출과 수입 탭은 선택한 기간을 300건씩 받는다. 더 있으면 목록 끝 「더 보기」 가 URL 의 `limit` 을 300 늘려 다시 받는다. 이전, 다음 쪽 넘김 버튼은 없어진다.

**범위 외**: 검색어와 금액 필터 적용은 phase 02, 필터 시트는 phase 03 이다.

## 컨텍스트

모든 경로는 저장소 root 기준이다. 명령은 `frontend/` 에서 돌린다.

**근거 문서**: `frontend/docs/adr/ADR-F41-list-client-filters-and-load-more.md`, `frontend/docs/flow.md` 의 「5-2. /transactions 페이지 구조」, `frontend/docs/adr/ADR-F39-navigation-pending-feedback.md`(화면 이동은 `useAppRouter`).

코드에서 확인한 사실:

- `frontend/src/app/(authenticated)/transactions/page.tsx` 95-96행이 `page`(기본 1), `limit`(기본 25)을 읽어 `ExpenseList`, `IncomeList` 에 넘긴다.
- `frontend/src/components/expenses/list/ExpenseList.tsx` 39-46행이 `getExpensesAction({ ..., page, limit })` 을 부르고, 92-101행이 `totalPages > 1` 이면 `ExpensePagination`(`frontend/src/components/expenses/list/ExpensePagination.tsx`, 이전과 다음 버튼)을 그린다.
- `frontend/src/components/incomes/list/IncomeList.tsx` 28, 41행과 `frontend/src/components/incomes/list/IncomeListClient.tsx` 36행이 같은 방식이다(쪽 넘김은 Client 안에 있다).
- `frontend/src/services/expense/expense-service.ts` 40행이 `limit` 을 1~1000 으로 막는다. `frontend/src/services/income/income-service.ts` 35행은 `size` 를 그대로 보낸다. 백엔드는 `size` 상한이 없고 날짜 내림차순, id 내림차순이다.
- 응답에 `totalElements` 가 있다.

## 의도 메모

- 목록 화면의 `limit` 은 300 의 배수만 받는다. 없거나 잘못된 값이면 300, 최대 3000 이다. `page` 는 늘 1 로 보낸다. 이 해석은 `frontend/src/lib/utils/list-limit.ts`(신규)의 `parseListLimit(raw)` 로 둔다.
- 서비스 상한은 3000 으로 올린다(분석 화면의 1000 호출은 그대로 통과한다).
- 「더 보기」 는 받은 건수가 `totalElements` 보다 적을 때만 보인다. 버튼 문구는 「더 보기 (N건 남음)」. `useAppRouter().replace` 로 `limit` 만 바꾸고 스크롤 위치를 유지한다(`{ scroll: false }`).
- `limit` 이 3000에 도달했고 미수신 건이 남으면 추가 요청 버튼 대신 「최대 3000건까지 불러왔어요. 조회 기간을 줄여 주세요」를 보인다. 같은 URL을 다시 요청하지 않는다. 버튼 테스트와 브라우저 테스트에서 3000건 상한을 검증한다.
- `ExpensePagination` 과 `IncomeListClient` 안의 쪽 넘김은 지운다. `page` URL 값은 더 이상 쓰지 않는다. 필터를 바꾸는 곳들이 `page=1` 을 넣던 코드는 `limit` 을 지우는 것으로 바꾼다(필터가 바뀌면 다시 300건부터).

## 작업 항목

### 1. `list-limit.ts`(신규)와 단위 테스트 `frontend/src/__tests__/lib/utils/list-limit.test.ts`(신규)

### 2. `page.tsx`, `ExpenseList.tsx`, `IncomeList.tsx`, 서비스 상한

### 3. 「더 보기」 컴포넌트 `frontend/src/components/transactions/LoadMoreButton.tsx`(신규)와 쪽 넘김 제거

`ExpensePagination.tsx` 는 삭제한다. 쓰던 테스트 `frontend/src/__tests__/components/expenses/ExpensePagination.test.tsx` 도 삭제한다.

### 4. 필터를 바꾸는 곳의 `page=1` 을 `limit` 삭제로

`FilterChips.tsx`, `AmountRangeFilter.tsx`, `SearchBar.tsx`, `TransactionsTabs.tsx`(모두 `frontend/src/app/(authenticated)/transactions/_components/`), `frontend/src/components/expenses/summary/CategoryExpenseSummary.tsx`.

### 5. 테스트

- `frontend/src/__tests__/components/transactions/LoadMoreButton.test.tsx`(신규): 남은 건이 있을 때만 보이고, 누르면 `limit` 이 300 늘어난 주소로 replace 한다.
- `frontend/browser/transactions.spec.ts`(수정): 가짜 백엔드가 `totalElements` 를 실제 수보다 크게 내면 「더 보기」 가 보이고, 누르면 요청의 `size` 가 600 이다. 쪽 넘김 버튼이 없다.

## 검증

`frontend/` 에서 실행한다.

```bash
pnpm install --frozen-lockfile
pnpm tsc --noEmit && pnpm lint && pnpm lint:md && pnpm test
pnpm test src/__tests__/lib/utils/list-limit.test.ts src/__tests__/components/transactions/LoadMoreButton.test.tsx
pnpm test:browser browser/transactions.spec.ts
```

기대값: 모든 명령이 성공한다.

## 변경 파일

| 파일 | 변경 |
|---|---|
| `frontend/src/lib/utils/list-limit.ts` | 신규 |
| `frontend/src/__tests__/lib/utils/list-limit.test.ts` | 신규 |
| `frontend/src/app/(authenticated)/transactions/page.tsx` | 수정 |
| `frontend/src/components/expenses/list/ExpenseList.tsx` | 수정 |
| `frontend/src/components/incomes/list/IncomeList.tsx` | 수정 |
| `frontend/src/components/incomes/list/IncomeListClient.tsx` | 수정 |
| `frontend/src/services/expense/expense-service.ts` | 수정 |
| `frontend/src/services/income/income-service.ts` | 수정 |
| `frontend/src/components/transactions/LoadMoreButton.tsx` | 신규 |
| `frontend/src/__tests__/components/transactions/LoadMoreButton.test.tsx` | 신규 |
| `frontend/src/components/expenses/list/ExpensePagination.tsx` | 삭제 |
| `frontend/src/__tests__/components/expenses/ExpensePagination.test.tsx` | 삭제 |
| `frontend/src/app/(authenticated)/transactions/_components/FilterChips.tsx` | 수정 |
| `frontend/src/app/(authenticated)/transactions/_components/AmountRangeFilter.tsx` | 수정 |
| `frontend/src/app/(authenticated)/transactions/_components/SearchBar.tsx` | 수정 |
| `frontend/src/app/(authenticated)/transactions/_components/TransactionsTabs.tsx` | 수정 |
| `frontend/src/components/expenses/summary/CategoryExpenseSummary.tsx` | 수정 |
| `frontend/browser/transactions.spec.ts` | 수정 |
| `frontend/browser/fake-backend.mjs` | 수정 |
