# Phase 02. 이름 검색과 금액 필터를 받은 목록에 적용

**Execution profile**: standard
**Domain**: app-router

## 목표

검색어와 금액 범위가 실제로 목록을 거른다. 검색어는 메모와 카테고리 이름에서 찾는다. 받지 않은 건이 남아 있으면 「불러온 N건 안에서 찾았어요」 와 「더 보기」 가 함께 보인다.

**범위 외**: 필터 입력 UI 배치는 phase 03 이다.

## 컨텍스트

모든 경로는 저장소 root 기준이다. 명령은 `frontend/` 에서 돌린다.

**근거 문서**: `frontend/docs/adr/ADR-F41-list-client-filters-and-load-more.md`, `frontend/docs/flow.md` 의 「5-2. /transactions 페이지 구조」, `frontend/docs/adr/ADR-F39-navigation-pending-feedback.md`(화면 이동은 `useAppRouter`).

코드에서 확인한 사실:

- `frontend/src/services/transaction/transaction-service.ts` 14-31행 `applyClientFilters(items, { amountMin, amountMax, q })` 는 금액 절댓값과 `description` 만 본다. 테스트(`frontend/src/__tests__/services/transaction/transaction-service.test.ts`)에서만 불린다.
- `ExpenseList.tsx` 37행 `hasFilter` 는 빈 화면 판단에만 `q`, `amountMin`, `amountMax` 를 쓴다. `IncomeList.tsx` 도 같다.
- 지출 목록 응답 항목에는 `category` 가 없고 `categoryUuid` 만 있다. `frontend/src/components/expenses/list/ExpenseListClient.tsx` 27, 39행이 `categories` 로 맵을 만들어 찾는다.
- `frontend/src/app/(authenticated)/transactions/_components/SearchBar.tsx` 의 안내 문구는 「메모 검색」 이다.

## 의도 메모

- `applyClientFilters` 에 선택 인자 `categoryNameOf?: (item) => string | undefined` 를 더해, 검색어가 메모나 카테고리 이름 중 하나에 들어 있으면 남긴다. 대소문자와 앞뒤 공백을 무시한다.
- 거르기는 서버 컴포넌트(`ExpenseList`, `IncomeList`)에서 받은 직후 한다. 그래야 그룹 합계(`groupTransactionsWithTotal`)도 거른 목록 기준이 된다.
- 거른 결과가 0 건이고 필터가 있으면 「조건에 맞는 거래가 없어요」 빈 상태를 보인다(지금 빈 상태 컴포넌트 재사용).
- 받은 건수 < `totalElements` 이고 검색어나 금액 필터가 있으면 목록 위에 「불러온 N건 안에서 찾았어요」(`text-xs text-fg-muted`)를 보인다. 「더 보기」 는 phase 01 그대로 목록 끝에 있다.
- `SearchBar` 안내 문구를 「메모, 카테고리 검색」 으로 바꾼다.

## 작업 항목

### 1. `applyClientFilters` 확장과 테스트

`frontend/src/__tests__/services/transaction/transaction-service.test.ts`(수정): 카테고리 이름 일치, 공백 무시, 금액 경계값.

### 2. `ExpenseList.tsx`, `IncomeList.tsx` 에 거르기, 빈 상태, 범위 안내

### 3. `SearchBar.tsx` 문구

### 4. 브라우저 테스트

`frontend/browser/transactions.spec.ts`(수정): 「버스」 를 검색하면 「버스 요금」 행만 남고, 카테고리 이름 「식비」 로 검색해도 그 카테고리 행이 남는다. 금액 하한을 10,000 으로 두면 그보다 작은 행이 사라진다.

## 검증

`frontend/` 에서 실행한다.

```bash
pnpm tsc --noEmit && pnpm lint && pnpm lint:md && pnpm test
pnpm test src/__tests__/services/transaction/transaction-service.test.ts
pnpm test:browser browser/transactions.spec.ts
```

기대값: 모든 명령이 성공한다.

## 변경 파일

| 파일 | 변경 |
|---|---|
| `frontend/src/services/transaction/transaction-service.ts` | 수정 |
| `frontend/src/__tests__/services/transaction/transaction-service.test.ts` | 수정 |
| `frontend/src/components/expenses/list/ExpenseList.tsx` | 수정 |
| `frontend/src/components/incomes/list/IncomeList.tsx` | 수정 |
| `frontend/src/app/(authenticated)/transactions/_components/SearchBar.tsx` | 수정 |
| `frontend/browser/transactions.spec.ts` | 수정 |
