# Phase 02. 등록 화면의 예산 제외 표시와 지출별 스위치

**Execution profile**: standard
**Domain**: color-token

## 목표

등록과 수정 화면에서 예산 제외 카테고리가 드러나고, 지출마다 「예산에서 제외」 를 켜고 끌 수 있다. 카테고리가 제외면 스위치는 켜진 채 잠긴다.

**범위 외**: 목록 배지와 카테고리 관리 화면 글자는 phase 03 이다. 백엔드는 이미 `excludeFromBudget` 을 받고 돌려준다.

## 컨텍스트

모든 경로는 저장소 root 기준이다. 명령은 `frontend/` 에서 돌린다.

**근거 문서**: `frontend/docs/prd.md` 의 「예산 제외」 행, `frontend/docs/data-schema.md` 의 `Expense`, `CreateExpenseRequest`.

코드에서 확인한 사실:

- 백엔드: `backend/src/main/java/com/bifos/accountbook/expense/application/dto/CreateExpenseRequest.java`, `UpdateExpenseRequest.java` 에 `Boolean excludeFromBudget`, `ExpenseResponse` 에 `boolean excludeFromBudget`. 예산 집계는 지출 플래그나 카테고리 플래그 중 하나라도 켜져 있으면 뺀다(`DashboardRepositoryImpl`).
- 프론트 타입 `frontend/src/types/expense.ts` 의 `Expense`, `CreateExpenseRequest`, `UpdateExpenseRequest` 에 `excludeFromBudget` 이 없다.
- 액션: `frontend/src/actions/expense/create-expense-action.ts`(`createExpenseSchema`, `formData.get(...)`), `update-expense-action.ts`(`updateExpenseSchema`). 테스트는 `frontend/src/__tests__/actions/expense/create-expense-action.test.ts`, `update-expense-action.test.ts`.
- 폼: `frontend/src/components/transactions/forms/TransactionFormFields.tsx` 가 등록과 수정, 세 종류(`expense`, `income`, `recurring`)를 그린다. 카테고리는 `frontend/src/components/expenses/forms/CategoryGrid.tsx`(`role="radiogroup"`, 타일 `role="radio"`, 이름 `text-[11px] truncate`).
- 카테고리 타입 `frontend/src/types/category.ts` 의 `CategoryResponse.excludeFromBudget?: boolean`.
- `frontend/src/components/ui/` 에 Switch 가 없다. `@radix-ui/react-switch` 도 의존성에 없다.

## 의도 메모

- 공용 Switch 는 새 의존성 없이 `button role="switch" aria-checked` 로 만든다. 높이는 터치 영역 44px.
- 카테고리 타일: 제외 카테고리는 우상단에 작은 배지(아이콘 14px, 예: `EyeOff`)를 달고 접근 이름에 「예산 제외」 를 붙인다. 11px 글자를 더 얹지 않는다.
- 스위치 위치: 카테고리 줄 바로 아래, 지출일 때만 한 행(왼쪽에 라벨 「예산에서 제외」, 오른쪽에 스위치). 수입과 고정지출에는 보이지 않는다.
- 잠금: 고른 카테고리가 제외면 스위치는 켜진 채 `disabled` 이고 아래에 「이 카테고리는 예산에서 제외돼요」 한 줄. 이때 폼은 `excludeFromBudget` 을 보내지 않거나 `false` 로 보낸다(카테고리 플래그가 이미 제외한다). 카테고리를 바꾸면 잠금이 풀리고 사용자가 고른 값으로 돌아간다.
- 폼 전송: 체크박스 값이 아니라 숨은 입력(`name="excludeFromBudget" value="true|false"`)으로 보내고, 액션은 `"true"` 를 `true` 로 바꾼다.
- 수정 시트는 기존 지출의 `excludeFromBudget` 을 초기값으로 쓴다.

## 작업 항목

### 1. 공용 Switch `frontend/src/components/ui/switch.tsx`

### 2. 타입과 액션에 `excludeFromBudget`

- `frontend/src/types/expense.ts`, `create-expense-action.ts`, `update-expense-action.ts`, 지출 서비스가 백엔드로 넘기는 요청(`frontend/src/services/expense/expense-service.ts`).

### 3. `CategoryGrid` 의 제외 배지

### 4. `TransactionFormFields` 의 스위치 행과 잠금

### 5. 이 phase 를 검증하는 테스트

- Jest `frontend/src/__tests__/actions/expense/create-expense-action.test.ts`, `update-expense-action.test.ts`: `excludeFromBudget=true` 가 서비스 요청에 실린다. 없으면 보내지 않는다.
- Jest `frontend/src/__tests__/components/expenses/CategoryGrid.test.tsx`: 제외 카테고리 타일의 접근 이름에 「예산 제외」 가 있다.
- Jest `frontend/src/__tests__/components/transactions/TransactionFormFields.test.tsx`(없으면 신규): 지출일 때만 스위치가 있다. 제외 카테고리를 고르면 스위치가 켜진 채 잠기고 안내 문구가 보인다. 다른 카테고리로 바꾸면 이전 값으로 돌아간다. 수입에는 스위치가 없다.

## 검증

`frontend/` 에서 실행한다.

```bash
pnpm install --frozen-lockfile
pnpm tsc --noEmit && pnpm lint && pnpm lint:md
pnpm test -- src/__tests__/actions/expense/create-expense-action.test.ts src/__tests__/actions/expense/update-expense-action.test.ts src/__tests__/components/expenses/CategoryGrid.test.tsx src/__tests__/components/transactions/TransactionFormFields.test.tsx
pnpm test
```

기대값: 모든 명령이 성공한다.

## 변경 파일

| 파일 | 변경 |
|---|---|
| `frontend/src/components/ui/switch.tsx` | 신규 |
| `frontend/src/types/expense.ts` | 수정 |
| `frontend/src/actions/expense/create-expense-action.ts` | 수정 |
| `frontend/src/actions/expense/update-expense-action.ts` | 수정 |
| `frontend/src/services/expense/expense-service.ts` | 수정 |
| `frontend/src/components/expenses/forms/CategoryGrid.tsx` | 수정 |
| `frontend/src/components/transactions/forms/TransactionFormFields.tsx` | 수정 |
| `frontend/src/components/transactions/dialogs/AddTransactionDialog.tsx` | 수정 |
| `frontend/src/components/transactions/dialogs/EditTransactionDialog.tsx` | 수정 |
| `frontend/src/__tests__/actions/expense/create-expense-action.test.ts` | 수정 |
| `frontend/src/__tests__/actions/expense/update-expense-action.test.ts` | 수정 |
| `frontend/src/__tests__/components/expenses/CategoryGrid.test.tsx` | 수정 |
| `frontend/src/__tests__/components/transactions/TransactionFormFields.test.tsx` | 신규 |
