# Phase 01. 저장 안내, 저장 중 잠금, 종류 토글 의미

**Execution profile**: standard
**Domain**: app-router

## 목표

등록과 수정 시트에서 필수 값이 비면 저장 버튼이 비활성이고, 그 위에 첫 번째로 빠진 값을 한 줄로 알린다. 저장 중에는 폼 전체가 잠긴다. 지출, 수입, 고정지출 토글이 라디오 그룹으로 읽힌다.

**범위 외**: 금액 숫자패드는 phase 02, 날짜와 결제일은 phase 03, 카테고리 격자는 phase 04 다.

## 컨텍스트

모든 경로는 저장소 root 기준이다. 명령은 `frontend/` 에서 돌린다.

**근거 문서**: `frontend/docs/adr/ADR-F40-in-sheet-amount-keypad.md`, `frontend/docs/flow.md` 의 등록 흐름 절의 AddTransactionDialog 도식과 `/categories` 절, `frontend/docs/adr/ADR-F21-transaction-dialog-unification.md`.

코드에서 확인한 사실:

- `frontend/src/components/transactions/dialogs/AddTransactionDialog.tsx` 233행의 `<form action={formAction}>` 안에 종류 토글(236-276행, 일반 `button` 셋, 라디오 의미 없음)과 `TransactionFormFields` 가 있다. 310-315행 `SubmitButton` 은 `useFormStatus().pending` 일 때만 비활성이다(`frontend/src/components/ui/submit-button.tsx` 27-30행).
- `frontend/src/components/transactions/dialogs/EditTransactionDialog.tsx` 316행 `<form>`, 333-366행 종류 토글(현재 종류 외 비활성), 425행 `SubmitButton` 은 `isDeleting` 일 때도 비활성이다. `isUpdating`(250-263행)은 삭제 버튼만 막는다.
- 두 창 모두 저장 중에 입력 칸을 막지 않는다. `<fieldset>` 이 없다.
- 필수 값: 지출과 수입은 금액(0 초과), 카테고리, 날짜. 고정지출은 금액, 카테고리, 이름, 결제일(1~28).

## 의도 메모

- 빠진 값 판정은 순수 함수로 뺀다: `frontend/src/lib/client/transaction-form-readiness.ts` 의 `getMissingField({ type, amount, categoryUuid, date, name, dayOfMonth })` 가 `"amount" | "category" | "date" | "name" | "dayOfMonth" | null` 을 돌려준다. 순서는 화면 순서(금액, 카테고리, 날짜 또는 이름, 결제일)다.
- 안내 문구: 금액 「금액을 입력해 주세요」, 카테고리 「카테고리를 골라 주세요」, 날짜 「날짜를 골라 주세요」, 이름 「이름을 입력해 주세요」, 결제일 「결제일을 1~28 중에서 입력해 주세요」. 저장 버튼 바로 위에 `text-xs text-fg-muted`, `id` 를 주고 버튼에 `aria-describedby` 로 잇는다.
- 저장 중 잠금은 시트 본문을 `<fieldset disabled={pending} className="contents">` 로 감싼다. `pending` 은 지금 각 창이 쓰는 `useActionState` 의 대기 값이다.
- 종류 토글은 기존 `ui/radio-group.tsx`의 RadioGroup과 RadioGroupItem을 재사용한다. Item은 선택적으로 children을 받아 기존 Indicator 대신 표시할 수 있게 하고, 종류 문구와 아이콘을 children으로 넘긴다. 기존 기본 Indicator 동작은 유지한다. Radix의 방향키 선택, 순환 및 단일 Tab 정지점을 사용한다. 수정 창은 현재 종류만 활성화하고 그룹을 잠근다.
- 세 useActionState의 pending을 OR로 합쳐 fieldset으로 본문과 하단 버튼을 모두 잠근다. Add와 Edit 테스트에서 입력, 취소, 저장 잠금과 안내의 aria-describedby 연결을 검증한다. Add 종류 토글 방향키 선택도 검증한다.
- 기존 브라우저 spec의 종류 locator를 button에서 radio로 바꾼다. flow.md의 첫 누락 값 목록에 날짜를 보완한다.

## 작업 항목

### 1. `transaction-form-readiness.ts`(신규)와 단위 테스트 `frontend/src/__tests__/lib/client/transaction-form-readiness.test.ts`(신규)

종류마다 빠진 값의 순서와 금액 0, 결제일 0 과 29 를 확인한다.

### 2. `AddTransactionDialog.tsx` 에 안내, 비활성, fieldset, 토글 의미

### 3. `EditTransactionDialog.tsx` 에 같은 처리

삭제 확인창과 삭제 버튼의 기존 비활성 조건은 유지한다.

### 4. 창 단위 테스트 보정

- `frontend/src/__tests__/components/transactions/dialogs/AddTransactionDialog.test.tsx`(수정): 금액 0 이면 저장 비활성과 「금액을 입력해 주세요」, 카테고리를 고르면 다음 안내로 바뀐다. 토글이 `radiogroup` 이다.
- `frontend/src/__tests__/components/transactions/dialogs/EditTransactionDialog.test.tsx`(수정): 저장 중 입력 칸이 비활성이다.

## 검증

`frontend/` 에서 실행한다.

```bash
pnpm install --frozen-lockfile
pnpm tsc --noEmit && pnpm lint && pnpm lint:md && pnpm test
pnpm test src/__tests__/lib/client/transaction-form-readiness.test.ts src/__tests__/components/transactions/dialogs/AddTransactionDialog.test.tsx src/__tests__/components/transactions/dialogs/EditTransactionDialog.test.tsx
```

추가 검증: `pnpm test:browser browser/add-transaction.spec.ts`.

기대값: 모든 명령이 성공한다.

## 변경 파일

| 파일 | 변경 |
|---|---|
| `frontend/src/components/ui/radio-group.tsx` | 수정 |
| `frontend/browser/add-transaction.spec.ts` | 수정 |
| `frontend/docs/flow.md` | 수정 |
| `frontend/src/lib/client/transaction-form-readiness.ts` | 신규 |
| `frontend/src/__tests__/lib/client/transaction-form-readiness.test.ts` | 신규 |
| `frontend/src/components/transactions/dialogs/AddTransactionDialog.tsx` | 수정 |
| `frontend/src/components/transactions/dialogs/EditTransactionDialog.tsx` | 수정 |
| `frontend/src/__tests__/components/transactions/dialogs/AddTransactionDialog.test.tsx` | 수정 |
| `frontend/src/__tests__/components/transactions/dialogs/EditTransactionDialog.test.tsx` | 수정 |
