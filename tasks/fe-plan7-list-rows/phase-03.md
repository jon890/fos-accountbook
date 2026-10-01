# Phase 03. 반복 지출 목록과 추가 버튼 정리

**Execution profile**: standard
**Domain**: color-token

## 목표

반복 지출 목록도 공용 행을 쓰고, 행을 누르면 수정 시트가 열린다. 시트 안에서 반복 지출을 끝낼 수 있다. 내역 화면의 추가 버튼은 하단 탭 가운데 버튼 하나만 남긴다.

**범위 외**: 지출, 수입 탭은 phase 02 가 끝냈다. 하단 탭 가운데 버튼이 현재 탭에 따라 종류를 바꾸는 동작이 없으면 이 phase 에서 만들지 않고 완료 보고에 남긴다.

## 컨텍스트

모든 경로는 저장소 root 기준이다. 명령은 `frontend/` 에서 돌린다.

**근거 문서**: `frontend/docs/adr/ADR-F37-single-transaction-row.md`.

코드에서 확인한 사실:

- `frontend/src/components/recurring-expense/RecurringExpenseItem.tsx`: 행을 누르면 펼쳐 수정, 삭제 버튼을 보인다(`md:hidden`). `text-gray-400`, `text-gray-900`, `green-500` 하드코딩. 이번 달 반영 여부를 색 아이콘으로만 보인다.
- `frontend/src/components/recurring-expense/RecurringExpenseList.tsx`: `divide-gray-100` 등 하드코딩. 목록 아래 전폭 「고정지출 추가」 버튼이 있다.
- `frontend/src/app/(authenticated)/transactions/_components/RecurringTabContent.tsx` 에도 추가 버튼이 있다. `frontend/src/app/(authenticated)/transactions/_components/TransactionsPageClient.tsx` 의 탭 줄에 「+ 지출 추가」 버튼이 있다.
- 하단 탭 가운데 버튼: `frontend/src/components/layout/BottomNavigation.tsx`(`aria-label="지출 추가"`, `setDialogOpen(true)`).
- `frontend/src/components/transactions/dialogs/EditTransactionDialog.tsx`: `type !== "recurring"` 일 때만 「삭제」 버튼이 있다. 반복 지출 삭제 액션은 `deleteRecurringExpenseAction`(`frontend/src/actions/recurring-expense/index.ts`)이다.

## 의도 메모

- 반복 지출의 「종료」 는 지금 있는 `deleteRecurringExpenseAction` 을 쓴다. 백엔드의 삭제가 상태를 바꾸는지(ENDED) 지우는지 확인하고 버튼 문구를 그에 맞춘다(「종료」 또는 「삭제」). 확인창을 거친다.
- 반영 상태는 행 오른쪽에 글자 배지(「이번 달 반영됨」)로도 보인다.
- 추가 버튼을 지운 뒤 빈 상태(`EmptyState` 의 `cta`)가 추가 진입을 안내하는지 본다.

## 작업 항목

### 1. `RecurringExpenseItem` 을 공용 행으로 바꾸고 `RecurringExpenseList` 정리

### 2. `EditTransactionDialog` 에 반복 지출 종료(또는 삭제)와 확인창

### 3. 탭 줄의 「+ 지출 추가」, 반복 목록 아래와 `RecurringTabContent` 의 추가 버튼 제거

### 4. 이 phase 를 검증하는 테스트

- Jest: `frontend/src/__tests__/components/transactions/EditTransactionDialog.test.tsx`(신규)에 반복 지출 시트에서 종료 버튼을 누르면 확인창이 뜨고 확인하면 `deleteRecurringExpenseAction` 이 불리는 케이스.
- 브라우저: `frontend/browser/transactions.spec.ts` 에 반복 탭 케이스. 가짜 백엔드에 반복 지출 목록 경로를 더한다. 반복 행을 누르면 「고정지출 수정」 시트가 열린다. 화면에 「+ 지출 추가」, 「고정지출 추가」 버튼이 없다.

## 검증

`frontend/` 에서 실행한다.

```bash
pnpm install --frozen-lockfile
pnpm exec playwright install chromium
pnpm tsc --noEmit && pnpm lint && pnpm lint:md
pnpm test -- src/__tests__/components/transactions/EditTransactionDialog.test.tsx
pnpm test
pnpm test:browser browser/transactions.spec.ts
pnpm test:browser
```

기대값: 모든 명령이 성공한다.

## 변경 파일

| 파일 | 변경 |
|---|---|
| `frontend/src/components/recurring-expense/RecurringExpenseItem.tsx` | 수정 |
| `frontend/src/components/recurring-expense/RecurringExpenseList.tsx` | 수정 |
| `frontend/src/components/transactions/dialogs/EditTransactionDialog.tsx` | 수정 |
| `frontend/src/app/(authenticated)/transactions/_components/RecurringTabContent.tsx` | 수정 |
| `frontend/src/app/(authenticated)/transactions/_components/TransactionsPageClient.tsx` | 수정 |
| `frontend/src/__tests__/components/transactions/EditTransactionDialog.test.tsx` | 신규 |
| `frontend/browser/fake-backend.mjs` | 수정 |
| `frontend/browser/transactions.spec.ts` | 수정 |
