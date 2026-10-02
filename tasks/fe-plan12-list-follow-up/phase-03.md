# Phase 03. 모바일 필터 하단 시트

**Execution profile**: standard
**Domain**: app-router

## 목표

768px 미만에서 기간, 카테고리, 금액 필터가 「필터」 버튼 하나로 모인다. 버튼에는 적용 중인 필터 수가 배지로 뜨고, 누르면 하단 시트가 열린다. 768px 이상은 지금 배치를 유지한다.

**범위 외**: 검색 칸은 지금처럼 따로 둔다.

## 컨텍스트

모든 경로는 저장소 root 기준이다. 명령은 `frontend/` 에서 돌린다.

**근거 문서**: `frontend/docs/adr/ADR-F41-list-client-filters-and-load-more.md`, `frontend/docs/flow.md` 의 「5-2. /transactions 페이지 구조」, `frontend/docs/adr/ADR-F39-navigation-pending-feedback.md`(화면 이동은 `useAppRouter`).

코드에서 확인한 사실:

- `frontend/src/app/(authenticated)/transactions/_components/FilterChips.tsx`: 기간 칩(이번달, 3개월, 1년, 직접 입력 패널), 카테고리 `Select`, 그 안에 `AmountRangeFilter`(Popover) 를 한 줄 가로 스크롤로 그린다. `navigate()`(68-77행)가 URL 을 바꾼다.
- `frontend/src/app/(authenticated)/transactions/_components/TransactionsPageClient.tsx` 가 `FilterChips` 와 `SearchBar` 를 배치한다. 반복지출 탭에서는 숨긴다.
- 반응형 시트 선례: `frontend/src/components/settings/BudgetEditDialog.tsx`, `frontend/src/app/(authenticated)/categories/_components/CategoryFormShell.tsx`.

## 의도 메모

- `frontend/src/app/(authenticated)/transactions/_components/FilterSheet.tsx`(신규): 시트 안에 기간(칩과 직접 입력), 카테고리(지출 탭은 EXPENSE, 수입 탭은 INCOME 목록), 금액 범위(최소, 최대)를 세로로 놓는다. 하단에 「초기화」, 「적용」. 적용할 때 한 번만 URL 을 바꾼다(`useAppRouter().replace`, `limit` 삭제).
- 「필터」 버튼 배지는 기본값과 다른 항목 수(기간이 이번 달이 아님, 카테고리 있음, 금액 있음)다.
- 데스크톱의 `FilterChips` 는 그대로 쓴다. 기간 계산과 검증 로직을 시트와 함께 쓰도록 `frontend/src/app/(authenticated)/transactions/_components/filter-state.ts`(신규)로 뺀다.

## 작업 항목

### 1. `filter-state.ts`(신규)와 단위 테스트 `frontend/src/__tests__/app/transactions/filter-state.test.ts`(신규)

URL 값에서 필터 상태 읽기, 배지 수, 적용할 URL 만들기.

### 2. `FilterSheet.tsx`(신규)

### 3. `TransactionsPageClient.tsx` 에서 폭에 따라 버튼과 칩 배치 선택, `FilterChips.tsx` 가 `filter-state.ts` 를 쓰게

### 4. 테스트

- `frontend/src/__tests__/components/transactions/FilterSheet.test.tsx`(신규): 「적용」 이 한 번만 replace 하고, 「초기화」 가 기간 외 값을 지운다.
- `frontend/browser/transactions.spec.ts`(수정): 390px 에서 「필터」 를 눌러 시트가 화면 아래에 붙어 열리고, 금액 하한을 넣고 적용하면 배지가 1 이 된다. 1280px 에서는 「필터」 버튼이 없고 칩이 보인다.

## 검증

`frontend/` 에서 실행한다.

```bash
pnpm tsc --noEmit && pnpm lint && pnpm lint:md && pnpm test
pnpm test src/__tests__/app/transactions/filter-state.test.ts src/__tests__/components/transactions/FilterSheet.test.tsx
pnpm test:browser browser/transactions.spec.ts
```

기대값: 모든 명령이 성공한다.

## 변경 파일

| 파일 | 변경 |
|---|---|
| `frontend/src/app/(authenticated)/transactions/_components/filter-state.ts` | 신규 |
| `frontend/src/__tests__/app/transactions/filter-state.test.ts` | 신규 |
| `frontend/src/app/(authenticated)/transactions/_components/FilterSheet.tsx` | 신규 |
| `frontend/src/__tests__/components/transactions/FilterSheet.test.tsx` | 신규 |
| `frontend/src/app/(authenticated)/transactions/_components/TransactionsPageClient.tsx` | 수정 |
| `frontend/src/app/(authenticated)/transactions/_components/FilterChips.tsx` | 수정 |
| `frontend/browser/transactions.spec.ts` | 수정 |
