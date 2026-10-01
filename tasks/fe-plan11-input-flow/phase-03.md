# Phase 03. 날짜 칩과 결제일 0 버그

**Execution profile**: fast
**Domain**: app-router

## 목표

지출과 수입의 날짜 칸 아래 「오늘」, 「어제」 칩으로 날짜를 한 번에 고른다. 고정지출 결제일을 지우면 0 이 아니라 빈 칸으로 남는다.

**범위 외**: 금액과 저장 안내는 phase 01, 02 다.

## 컨텍스트

모든 경로는 저장소 root 기준이다. 명령은 `frontend/` 에서 돌린다.

**근거 문서**: `frontend/docs/adr/ADR-F40-in-sheet-amount-keypad.md`, `frontend/docs/flow.md` 의 등록 흐름 절(「AddTransactionDialog (responsive ...)」 도식)과 `/categories` 절, `frontend/docs/adr/ADR-F21-transaction-dialog-unification.md`.

코드에서 확인한 사실:

- `frontend/src/components/transactions/forms/TransactionFormFields.tsx` 170-180행 날짜는 `<Input type="date">` 하나다. 등록 창의 기본 날짜는 `frontend/src/lib/utils/format.ts` 116행 `toLocalDateInput()`(기기 시간대 기준 `YYYY-MM-DD`)이다.
- 같은 파일 144-165행 결제일: `value={dayOfMonth ?? ""}`, `onChange={(e) => onDayOfMonthChange?.(Number(e.target.value))}`. 칸을 비우면 `Number("")` 가 0 이 되고 `??` 는 0 을 비우지 않아 화면에 0 이 뜬다. 이후 `required` 가 빈 칸을 잡지 못한다.
- `frontend/src/components/transactions/dialogs/AddTransactionDialog.tsx` 56-76행 고정지출 래퍼가 `Number(fd.get("dayOfMonth"))` 로 읽어 빈 값도 0 이 된다. 수정 창(`EditTransactionDialog.tsx` 86-105행 부근)도 같은 방식이다.
- `frontend/src/lib/schemas/recurring-expense.ts` 7행 `dayOfMonth: z.number().int().min(1).max(28, "1~28일만 선택 가능합니다")` 의 `min(1)` 에는 문구가 없다.

## 의도 메모

- 칩은 날짜 칸 아래 `min-h-11` 버튼 둘이다. 「오늘」 은 `toLocalDateInput()`, 「어제」 는 하루 전의 `toLocalDateInput` 값을 넣는다. 지금 날짜와 같은 칩은 `aria-pressed="true"` 와 선택 스타일을 준다.
- 결제일 `onChange` 는 빈 문자열이면 `undefined` 를 넘긴다. 래퍼는 빈 값이면 `NaN` 대신 검증 오류(「결제일을 1~28 중에서 입력해 주세요」)가 나게 한다. 스키마의 `min(1)` 에 같은 문구를 단다.

## 작업 항목

### 1. 날짜 칩

### 2. 결제일 빈 값 처리와 스키마 문구

### 3. 테스트

- `frontend/src/__tests__/components/transactions/TransactionFormFields.test.tsx`(수정): 「어제」 를 누르면 `onDateChange` 가 하루 전 날짜로 불린다. 결제일 칸을 비우면 `onDayOfMonthChange(undefined)` 이고 칸이 빈다.
- `frontend/src/__tests__/lib/schemas/recurring-expense.test.ts`(신규): 결제일 0 과 29 가 각각 정한 문구로 실패한다.

## 검증

`frontend/` 에서 실행한다.

```bash
pnpm tsc --noEmit && pnpm lint && pnpm lint:md && pnpm test
pnpm test src/__tests__/components/transactions/TransactionFormFields.test.tsx src/__tests__/lib/schemas/recurring-expense.test.ts
```

기대값: 모든 명령이 성공한다.

## 변경 파일

| 파일 | 변경 |
|---|---|
| `frontend/src/components/transactions/forms/TransactionFormFields.tsx` | 수정 |
| `frontend/src/components/transactions/dialogs/AddTransactionDialog.tsx` | 수정 |
| `frontend/src/components/transactions/dialogs/EditTransactionDialog.tsx` | 수정 |
| `frontend/src/lib/schemas/recurring-expense.ts` | 수정 |
| `frontend/src/__tests__/components/transactions/TransactionFormFields.test.tsx` | 수정 |
| `frontend/src/__tests__/lib/schemas/recurring-expense.test.ts` | 신규 |
