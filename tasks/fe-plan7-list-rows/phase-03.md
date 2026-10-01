# Phase 03. 반복 지출 목록과 추가 버튼 정리

**Execution profile**: standard
**Domain**: color-token, app-router

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

- 반복 지출의 「종료」는 기존 `deleteRecurringExpenseAction`을 쓴다. 백엔드는 `entity.end()`로 상태를 ENDED로 바꾸므로 문구는 「종료」로 고정한다. 확인창에서 기존 지출이 유지됨을 알린다. 실패하면 오류를 표시하고 시트와 확인창을 유지하며 다시 시도할 수 있다.
- 반복 행은 `TransactionRow`에 이름을 description, 기존 category와 amount를 넘긴다. 날짜를 만들지 않고 phase 01의 `metadata`에 `매월 N일`을 넘긴다. `trailing`에는 반영된 경우 「이번 달 반영됨」 배지를 둔다.
- 반영 상태는 행 오른쪽에 글자 배지(「이번 달 반영됨」)로도 보인다.
- 빈 상태는 `EmptyState`를 cta 없이 쓰고 설명에서 하단 가운데 `+` 버튼으로 추가할 수 있음을 안내한다.

## 작업 항목

### 1. `RecurringExpenseItem` 을 공용 행으로 바꾸고 `RecurringExpenseList` 정리

### 2. `EditTransactionDialog` 에 반복 지출 종료와 확인창

### 3. 탭 줄의 「+ 지출 추가」, 반복 목록 아래와 `RecurringTabContent` 의 추가 버튼 제거

- `TransactionsPageClient`의 추가 전용 `ExpenseTabContent`, `IncomeTabContent`, `RecurringTabContent` 렌더링을 모두 제거한다. 다른 사용처가 없는 컴포넌트 파일은 삭제한다. 수입 탭의 「수입 추가」도 제거한다. 빈 목록은 하단 가운데 추가 버튼을 안내하고 그 버튼은 계속 동작해야 한다. 달력의 선택 날짜 추가 버튼은 이번 범위 밖이다.
- `TransactionsPageClient`의 `familyUuid` prop 선언과 구조 분해를 삭제하고, `transactions/page.tsx`에서 해당 prop 전달만 제거한다. 페이지 내부의 목록 조회용 `familyUuid`는 유지한다.

### 4. 이 phase 를 검증하는 테스트

- Jest: 기존 `frontend/src/__tests__/components/transactions/dialogs/EditTransactionDialog.test.tsx`에 반복 지출 종료 확인, 취소, 성공, 실패 후 재시도 케이스를 보완한다.
- 브라우저: `frontend/browser/transactions.spec.ts` 에 반복 탭 케이스. 가짜 백엔드에 반복 지출 목록 경로를 더한다. 반복 행을 누르면 「고정지출 수정」 시트가 열린다. 화면에 「+ 지출 추가」, 「고정지출 추가」 버튼이 없다.
- 지출, 수입, 반복 탭에서 추가 버튼이 제거됐고 하단 `aria-label="지출 추가"` 버튼으로 추가 시트가 열리는지 확인한다. CODE-4부터 CODE-6까지 해당 항목을 점검한다.
- 반복 탭의 행에 「매월 N일」과 「이번 달 반영됨」이 보이는지 단언한다.
- 지출과 수입의 빈 목록도 하단 가운데 `+` 버튼을 안내하며, 가짜 백엔드의 빈 목록 응답으로 안내와 추가 시트 열기를 검증한다.

## 검증

`frontend/` 에서 실행한다.

```bash
pnpm install --frozen-lockfile
pnpm exec playwright install chromium
pnpm tsc --noEmit && pnpm lint && pnpm lint:md
pnpm test -- src/__tests__/components/transactions/dialogs/EditTransactionDialog.test.tsx
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
| `frontend/src/components/expenses/list/ExpenseList.tsx` | 수정 |
| `frontend/src/components/incomes/list/IncomeList.tsx` | 수정 |
| `frontend/src/components/transactions/dialogs/EditTransactionDialog.tsx` | 수정 |
| `frontend/src/app/(authenticated)/transactions/_components/RecurringTabContent.tsx` | 삭제 |
| `frontend/src/app/(authenticated)/transactions/_components/ExpenseTabContent.tsx` | 삭제 |
| `frontend/src/app/(authenticated)/transactions/_components/IncomeTabContent.tsx` | 삭제 |
| `frontend/src/app/(authenticated)/transactions/_components/TransactionsPageClient.tsx` | 수정 |
| `frontend/src/app/(authenticated)/transactions/page.tsx` | 수정 |
| `frontend/src/__tests__/components/transactions/dialogs/EditTransactionDialog.test.tsx` | 수정 |
| `frontend/browser/fake-backend.mjs` | 수정 |
| `frontend/browser/transactions.spec.ts` | 수정 |
