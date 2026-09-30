# Phase 02. 날짜 기준 등록과 수정 다이얼로그 안 삭제, revalidatePath 정리

**Execution profile**: standard
**Domain**: server-action

## 목표

1. `AddTransactionDialog` 가 `defaultDate` 를 받아 그 날짜로 시작한다. 달력 화면(phase 03)이 선택 날짜를 넘긴다.
2. `EditTransactionDialog` 안에서 삭제까지 한다. 달력 날짜 목록(phase 03)이 항목을 누르면 이 다이얼로그를 연다.
3. 모바일 시트의 저장 버튼이 키보드와 안전 영역에 가려지지 않는다.
4. 지출·수입 변경 뒤 다시 그리는 경로를 정리한다.

**범위 외**: 달력 화면 연결은 phase 03, 하단 탭 FAB 가 선택 날짜를 넘기는 것은 phase 04 다. 고정지출 다이얼로그 동작은 바꾸지 않는다.

## 컨텍스트

- 다이얼로그: `frontend/src/components/transactions/dialogs/AddTransactionDialog.tsx`(props `open`, `onOpenChange`, `defaultType`), `EditTransactionDialog.tsx`(props `open`, `onOpenChange`, `type`, `transaction`, `familyUuid`). 둘 다 768px 미만은 `h-[100dvh]` Sheet, 이상은 Dialog 다(ADR-F21).
- 날짜 입력은 `forms/TransactionFormFields.tsx` 의 `type="date"`, 초기값은 `AddTransactionDialogBody` 의 `useState(toLocalDateInput())` 다.
- 삭제 action: `actions/expense/delete-expense-action.ts`, `actions/income/delete-income-action.ts`. 확인 창은 sonner 가 아니라 AlertDialog(ADR-F08 은 alert/confirm 대체 규칙). 기존 선례 `components/expenses/dialogs/DeleteExpenseDialog.tsx`.
- `revalidatePath` 를 부르는 지출·수입 action 여섯 개는 모두 `"/transactions"`, `"/"`, `"/analytics"` 를 다시 그린다.
- `app/(authenticated)/transactions/_components/ExpenseTabContent.tsx:34` 가 action 뒤에 `router.refresh()` 를 한 번 더 부른다. action 의 `revalidatePath` 와 겹쳐 같은 화면을 두 번 다시 받는다.

**근거 문서**: `frontend/docs/flow.md` 의 「3. 거래 등록 플로우」, 「4. 지출·수입 수정/삭제 플로우」, `frontend/docs/adr.md` 의 ADR-F21, ADR-F32

## 의도 메모

- `defaultDate` 가 오늘이 아닌 과거 날짜여도 그대로 쓴다. 미래 날짜 제한은 기존 폼 검증이 정한다.
- 다시 그릴 경로: 지출과 수입 변경은 `/calendar`, `/transactions`, `/analytics`, `/budget`. `"/"` 는 뺀다. 루트는 redirect 만 한다.
- 시트 하단 버튼 영역은 `sticky bottom-0` 에 배경을 주고 `padding-bottom: env(safe-area-inset-bottom)` 를 더한다. 입력에 포커스가 가면 `scrollIntoView({ block: "center" })` 로 키보드 위로 올린다. iOS 에서 `100dvh` 가 키보드로 줄지 않기 때문이다.

## 작업 항목

### 1. `AddTransactionDialog.tsx`: `defaultDate?: string`(`YYYY-MM-DD`)

- `AddTransactionDialogBody` 의 날짜 초기값을 `defaultDate ?? toLocalDateInput()` 로. 다이얼로그를 다시 열 때 새 `defaultDate` 가 반영되도록 `key` 에 날짜를 넣는다.
- 지출·수입·고정지출 종류를 바꿀 때 입력 날짜를 유지한다. 선택 날짜로 열기, 수입으로 전환, 다른 날짜로 재열기 모두 기존 테스트에서 확인한다.

### 2. `EditTransactionDialog.tsx`: 삭제 버튼

- 지출과 수입일 때 하단 왼쪽에 「삭제」(`text-expense`) 버튼. 누르면 AlertDialog 확인 뒤 해당 delete action 을 부르고, 성공하면 토스트와 함께 다이얼로그를 닫는다. 실패하면 토스트로 알리고 다이얼로그는 연 채로 둔다.
- 고정지출일 때는 삭제 버튼을 두지 않는다(기존 종료 흐름 유지).
- 실제 삭제 Action 인자는 `(familyUuid, transactionUuid)` 다. 가족 prop이 없으면 `transaction.familyUuid` 를 쓴다. 지출·수입 삭제, 확인 취소와 실패 후 열린 상태를 검증한다.

### 3. 두 다이얼로그의 모바일 시트 하단

- 저장, 취소, 삭제 버튼 영역을 sticky footer 로 만들고 안전 영역 여백을 준다. 안전 영역 CSS 유틸은 phase 04 가 `globals.css` 에 정의하므로 여기서는 Tailwind 임의 값 `pb-[env(safe-area-inset-bottom)]` 을 쓰고 phase 04 가 유틸로 바꾼다.
- 폼 입력 `onFocus` 에서 모바일일 때 `scrollIntoView`.
- viewport의 `viewportFit: "cover"` 설정을 이 phase에서 적용한다. 모바일 Sheet는 `visualViewport.height` 와 `offsetTop` 으로 가시 영역에 배치하며 키보드 resize·scroll 이벤트를 구독하고 닫거나 unmount하면 해제한다. 화면 안은 세로 flex이고 폼 본문만 스크롤하며 footer는 가시 영역 하단에 둔다. API가 없으면 기존 `100dvh` 를 사용한다. 테스트에서 가시 영역 resize에 따른 높이와 이벤트 정리를 확인한다. 실제 iOS 키보드 가시성은 PR의 기기 검증 목록에 남긴다.

### 4. `revalidatePath` 정리와 중복 새로고침 제거

- `actions/expense/{create,update,delete}-expense-action.ts`, `actions/income/{create,update,delete}-income-action.ts` 의 경로를 의도 메모의 네 개로 바꾼다.
- `/calendar` 화면은 phase 03 이 만든다. 경로를 먼저 다시 그려도 문제없다.
- 경로 목록을 `frontend/src/lib/server/revalidate-transaction-paths.ts` 의 `revalidateTransactionPaths()` 하나로 모아 여섯 action 이 부른다.
- `ExpenseTabContent.tsx` 의 `router.refresh()` 를 지운다.

### 5. 테스트

- `frontend/src/__tests__/components/transactions/dialogs/AddTransactionDialog.test.tsx`: `defaultDate="2026-09-14"` 로 열면 날짜 입력값이 그 날짜다.
- `frontend/src/__tests__/components/transactions/dialogs/EditTransactionDialog.test.tsx`: 지출에서 삭제 → 확인 → `deleteExpenseAction` 이 가족과 거래 uuid 로 불리고 `onOpenChange(false)`. 실패하면 다이얼로그가 열린 채 토스트. 고정지출이면 삭제 버튼이 없다.
- `frontend/src/__tests__/lib/revalidate-transaction-paths.test.ts`: `next/cache` mock 으로 네 경로가 불린다.
- 기존 지출·수입 Action 테스트의 경로 단언을 네 경로로 바꾼다. 인증·권한·입력·실패 검증은 유지한다.

## 검증

```bash
# cwd: <repo root>
cd frontend && pnpm test src/__tests__/components/transactions/dialogs/AddTransactionDialog.test.tsx src/__tests__/components/transactions/dialogs/EditTransactionDialog.test.tsx src/__tests__/lib/revalidate-transaction-paths.test.ts src/__tests__/hooks/useTransactionSheetViewport.test.ts
pnpm lint && pnpm test
pnpm exec tsc --noEmit
grep -rn 'revalidatePath("/")' src/actions/expense src/actions/income   # 결과 없음
grep -n "router.refresh" "src/app/(authenticated)/transactions/_components/ExpenseTabContent.tsx"   # 결과 없음
```

## 변경 파일

| 파일 | 변경 |
|---|---|
| `frontend/src/components/transactions/dialogs/AddTransactionDialog.tsx` | 수정 |
| `frontend/src/components/transactions/dialogs/EditTransactionDialog.tsx` | 수정 |
| `frontend/src/components/transactions/forms/TransactionFormFields.tsx` | 수정 |
| `frontend/src/lib/server/revalidate-transaction-paths.ts` | 신규 |
| `frontend/src/actions/expense/create-expense-action.ts` | 수정 |
| `frontend/src/actions/expense/update-expense-action.ts` | 수정 |
| `frontend/src/actions/expense/delete-expense-action.ts` | 수정 |
| `frontend/src/actions/income/create-income-action.ts` | 수정 |
| `frontend/src/actions/income/update-income-action.ts` | 수정 |
| `frontend/src/actions/income/delete-income-action.ts` | 수정 |
| `frontend/src/app/(authenticated)/transactions/_components/ExpenseTabContent.tsx` | 수정 |
| `frontend/src/__tests__/components/transactions/dialogs/AddTransactionDialog.test.tsx` | 수정 |
| `frontend/src/__tests__/components/transactions/dialogs/EditTransactionDialog.test.tsx` | 수정 |
| `frontend/src/__tests__/lib/revalidate-transaction-paths.test.ts` | 신규 |
| `frontend/src/app/layout.tsx` | 수정 |
| `frontend/src/hooks/useTransactionSheetViewport.ts` | 신규 |
| `frontend/src/__tests__/hooks/useTransactionSheetViewport.test.ts` | 신규 |
| `frontend/src/__tests__/actions/expense/create-expense-action.test.ts` | 수정 |
| `frontend/src/__tests__/actions/expense/update-expense-action.test.ts` | 수정 |
| `frontend/src/__tests__/actions/expense/delete-expense-action.test.ts` | 수정 |
| `frontend/src/__tests__/actions/income/update-income-action.test.ts` | 수정 |
| `frontend/src/__tests__/actions/income-actions.test.ts` | 수정 |
