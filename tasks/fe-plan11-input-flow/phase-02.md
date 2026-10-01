# Phase 02. 모바일 시트 안 숫자패드와 종류별 금액 문구

**Execution profile**: standard
**Domain**: app-router

## 목표

768px 미만에서 금액은 시트 안 숫자패드로만 입력하고 기기 키보드가 뜨지 않는다. 768px 이상은 지금처럼 키보드로 입력한다. 금액 문구가 거래 종류에 맞는다.

**범위 외**: 저장 안내는 phase 01, 날짜는 phase 03 이다.

## 컨텍스트

모든 경로는 저장소 root 기준이다. 명령은 `frontend/` 에서 돌린다.

**근거 문서**: `frontend/docs/adr/ADR-F40-in-sheet-amount-keypad.md`, `frontend/docs/flow.md` 의 등록 흐름 절(「AddTransactionDialog (responsive ...)」 도식)과 `/categories` 절, `frontend/docs/adr/ADR-F21-transaction-dialog-unification.md`.

코드에서 확인한 사실:

- `frontend/src/components/expenses/forms/AmountInput.tsx`: 38행 문구가 종류와 무관하게 「얼마를 썼나요?」 다. 65-76행에 `sr-only` `<input type="number" inputMode="numeric">` 이 있고 표시 영역을 누르면 그 칸에 포커스해 기기 키보드가 뜬다. 13-14행 빠른 추가 칩(+1,000, +5,000, +10,000, md 이상 +50,000)은 `py-1.5` 라 44px 보다 낮다.
- `frontend/src/components/transactions/forms/TransactionFormFields.tsx` 77-78행이 `AmountInput` 을 그리고 라벨은 「금액 *」 이다. `type`(`"expense" | "income" | "recurring"`)을 이미 받는다.
- 반응형 판정은 `frontend/src/hooks/useMediaQuery.ts` 의 `useMediaQuery("(min-width: 768px)")` 를 쓴다. 서버 렌더에서 `false` 라 첫 렌더는 모바일 배치다.

## 의도 메모

- 새 `frontend/src/components/expenses/forms/AmountKeypad.tsx`: 3열 4행 격자(1~9, 00, 0, 지우기). 각 키 높이 48px 이상, `aria-label`(「1」, 「영영」, 「지우기」). 누르면 `onChange` 로 다음 값을 낸다. 최대 12자리에서 더 받지 않는다.
- `AmountInput` 은 `type` 을 받아 문구를 정한다: 지출 「얼마를 썼나요?」, 수입 「얼마를 받았나요?」, 고정지출 「매달 얼마인가요?」.
- 768px 미만에서는 숨은 입력 칸을 `readOnly`, `inputMode="none"`, `tabIndex={-1}` 로 두고 표시 영역을 눌러도 포커스하지 않는다. 숫자패드는 금액 표시 바로 아래, 빠른 추가 칩 위에 둔다. 폼 전송 값은 지금처럼 숨은 칸이나 상위 상태에서 나간다.
- 768px 이상은 지금 동작을 유지하고 숫자패드를 그리지 않는다.
- 빠른 추가 칩은 `min-h-11` 로 키운다.

## 작업 항목

### 1. `AmountKeypad.tsx`(신규)와 단위 테스트 `frontend/src/__tests__/components/expenses/AmountKeypad.test.tsx`(신규)

### 2. `AmountInput.tsx` 에 종류별 문구, 모바일 키보드 차단, 숫자패드 배치, 칩 높이

### 3. `TransactionFormFields.tsx` 가 `type` 을 `AmountInput` 에 넘긴다

### 4. 테스트

- `frontend/src/__tests__/components/expenses/AmountInput.test.tsx`(수정): 모바일에서 숫자패드로 1, 2, 00 을 누르면 1,200 이 되고 지우기로 120 이 된다. 데스크톱에서는 숫자패드가 없다. 수입 문구가 「얼마를 받았나요?」 다.
- `frontend/browser/add-transaction.spec.ts`(수정): 390px 에서 금액 표시를 눌러도 숨은 입력 칸에 포커스가 가지 않고(`document.activeElement` 확인), 숫자패드로 넣은 값이 저장 요청에 담긴다.

## 검증

`frontend/` 에서 실행한다.

```bash
pnpm tsc --noEmit && pnpm lint && pnpm lint:md && pnpm test
pnpm test src/__tests__/components/expenses/AmountKeypad.test.tsx src/__tests__/components/expenses/AmountInput.test.tsx
pnpm test:browser browser/add-transaction.spec.ts
```

기대값: 모든 명령이 성공한다.

## 변경 파일

| 파일 | 변경 |
|---|---|
| `frontend/src/components/expenses/forms/AmountKeypad.tsx` | 신규 |
| `frontend/src/__tests__/components/expenses/AmountKeypad.test.tsx` | 신규 |
| `frontend/src/components/expenses/forms/AmountInput.tsx` | 수정 |
| `frontend/src/components/transactions/forms/TransactionFormFields.tsx` | 수정 |
| `frontend/src/__tests__/components/expenses/AmountInput.test.tsx` | 수정 |
| `frontend/browser/add-transaction.spec.ts` | 수정 |
| `frontend/browser/fake-backend.mjs` | 수정 |
