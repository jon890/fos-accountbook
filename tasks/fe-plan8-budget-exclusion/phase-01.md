# Phase 01. 등록 화면의 기반 정리

**Execution profile**: fast
**Domain**: color-token

## 목표

다이얼로그와 시트가 다크 모드에서 흰 판으로 뜨지 않게 하고, 쓰이지 않는 옛 지출 폼을 지우고, 고정지출 저장 버튼의 대비를 고친다.

**범위 외**: 예산 제외는 phase 02, 03 이다. 숫자패드, 입력 흐름, 카테고리 창 시트 전환은 다음 plan 이다.

## 컨텍스트

모든 경로는 저장소 root 기준이다. 명령은 `frontend/` 에서 돌린다.

**근거 문서**: 색은 `frontend/docs/adr/ADR-F07-shadcn-tailwind-css.md`, `frontend/docs/adr/ADR-F13-oklch-color-system.md`, `frontend/docs/adr/ADR-F23-semantic-foreground-tokens.md`.

코드에서 확인한 사실:

- `frontend/src/components/ui/dialog.tsx` 63행 `DialogContent` 와 `frontend/src/components/ui/sheet.tsx` 61행 `SheetContent` 기본 클래스가 `bg-white` 다. 등록 시트는 `bg-bg-elev` 로 덮어쓰지만 카테고리 추가, 수정 다이얼로그는 덮어쓰지 않는다.
- 옛 폼: `frontend/src/components/expenses/forms/AddExpenseForm.tsx`, `ExpenseFormFields.tsx`, `ExpenseFilters.tsx` 는 자기들끼리만 import 하고 다른 곳에서 쓰지 않는다(`grep -rln "AddExpenseForm\|ExpenseFormFields\|ExpenseFilters" frontend/src`). `AmountInput.tsx`, `CategoryGrid.tsx` 는 새 폼이 쓴다.
- 고정지출 저장 버튼: `frontend/src/components/transactions/dialogs/AddTransactionDialog.tsx` 215, 267행과 `EditTransactionDialog.tsx` 249, 367행이 `gradient-budget text-brand-fg`(노란 배경에 흰 글자, 대비 약 2:1)를 쓴다.
- 하단 탭 가운데 버튼 `frontend/src/components/layout/BottomNavigation.tsx` 의 `aria-label="지출 추가"` 가 여는 시트 제목은 「거래 추가」 다.
- 데스크톱 등록 다이얼로그 제목은 `AddTransactionDialog.tsx` 102행에서 `sr-only` 이고, 수정 다이얼로그는 보인다.

## 의도 메모

- 고정지출 버튼은 `gradient-primary`(브랜드)와 그 전경 토큰을 쓴다. 지출 빨강, 수입 초록과 겹치지 않고 대비가 충분하다. 종류 토글의 고정지출 선택 색도 같은 값으로 맞춘다.
- 옛 폼을 지우면 그 테스트도 함께 지운다. 새 폼이 같은 경우를 덮는지는 `CategoryGrid.test.tsx`, `AmountInput.test.tsx` 가 남아 있으므로 그대로 둔다.

## 작업 항목

### 1. `dialog.tsx`, `sheet.tsx` 기본 배경을 `bg-bg-elev` 로

### 2. 옛 폼 세 파일과 그 테스트 삭제

### 3. 고정지출 저장 버튼과 종류 토글 색

### 4. 가운데 버튼 라벨 「거래 추가」, 데스크톱 등록 제목 보이기

### 5. 이 phase 를 검증하는 브라우저 테스트 `frontend/browser/add-transaction.spec.ts`(신규)

- 390px 에서 하단 가운데 버튼(`getByRole("button", { name: "거래 추가" })`)을 누르면 시트가 열린다.
- 다크 테마(`page.emulateMedia({ colorScheme: "dark" })` 나 앱의 `data-theme="dark"` 설정 방식)에서 시트와 `/categories` 의 카테고리 추가 다이얼로그 배경색이 흰색(`rgb(255, 255, 255)`)이 아니다.
- 가짜 백엔드가 모르는 경로를 받으면 `frontend/browser/fake-backend.mjs` 에 더한다.

## 검증

`frontend/` 에서 실행한다.

```bash
pnpm install --frozen-lockfile
pnpm exec playwright install chromium
pnpm tsc --noEmit && pnpm lint && pnpm lint:md && pnpm test
pnpm test:browser browser/add-transaction.spec.ts
```

기대값: 모든 명령이 성공한다.

## 변경 파일

| 파일 | 변경 |
|---|---|
| `frontend/src/components/ui/dialog.tsx` | 수정 |
| `frontend/src/components/ui/sheet.tsx` | 수정 |
| `frontend/src/components/expenses/forms/AddExpenseForm.tsx` | 삭제 |
| `frontend/src/components/expenses/forms/ExpenseFormFields.tsx` | 삭제 |
| `frontend/src/components/expenses/forms/ExpenseFilters.tsx` | 삭제 |
| `frontend/src/components/transactions/dialogs/AddTransactionDialog.tsx` | 수정 |
| `frontend/src/components/transactions/dialogs/EditTransactionDialog.tsx` | 수정 |
| `frontend/src/components/layout/BottomNavigation.tsx` | 수정 |
| `frontend/browser/add-transaction.spec.ts` | 신규 |
| `frontend/browser/fake-backend.mjs` | 수정 |
