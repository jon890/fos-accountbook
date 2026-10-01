# Phase 03. 등록과 카테고리 관리 화면이 종류에 맞는 카테고리를 쓴다

**Execution profile**: standard
**Domain**: app-router

## 목표

지출과 고정지출 등록은 지출 카테고리만, 수입 등록은 수입 카테고리만 보여 준다. 카테고리 관리 화면은 지출과 수입을 나눠 보여 주고, 새 카테고리를 만들 때 종류를 고른다.

**범위 외**: 카테고리 창을 하단 시트로 바꾸는 일, 숫자패드, 예산 제외 표시는 다음 plan 이다. 백엔드는 phase 01, 02 가 끝냈다.

## 컨텍스트

모든 경로는 저장소 root 기준이다. 명령은 `frontend/` 에서 돌린다.

**근거 문서**: `backend/docs/adr/ADR-B23-category-type.md`(API 계약), `frontend/docs/data-schema.md` 의 카테고리 타입 절, 브라우저 테스트는 ADR-F34.

코드에서 확인한 사실:

- 타입: `frontend/src/types/category.ts` 의 `CategoryResponse { uuid, familyUuid, name, icon?, color?, excludeFromBudget?, createdAt, updatedAt }`. 스키마 `frontend/src/lib/schemas/category.ts`.
- 등록: `frontend/src/components/transactions/dialogs/AddTransactionDialog.tsx` 가 `getFamilyCategoriesAction` 으로 카테고리를 받아 `TransactionFormFields`(`frontend/src/components/transactions/forms/TransactionFormFields.tsx`)에 넘기고, 그 안의 `CategoryGrid`(`frontend/src/components/expenses/forms/CategoryGrid.tsx`)가 그린다. 수정 시트 `EditTransactionDialog.tsx` 도 같은 필드를 쓴다. 종류는 `type`(`expense`, `income`, `recurring`).
- 종류를 바꾸면 고른 카테고리가 새 종류에 없을 수 있다.
- 카테고리 관리: `frontend/src/app/(authenticated)/categories/_components/CategoryPageClient.tsx`, `CategoryList.tsx`, `AddCategoryDialog.tsx`, `EditCategoryDialog.tsx`.
- 가짜 백엔드 `frontend/browser/fake-backend.mjs` 의 카테고리 응답에 `type` 이 없다.

## 의도 메모

- 종류를 바꾸면 고른 카테고리를 비운다. 새 종류의 첫 카테고리를 자동으로 고르지 않는다.
- 관리 화면은 「지출」, 「수입」 두 탭(기존 `ui/segmented-toggle` 이나 탭 컴포넌트)으로 나눈다. 카테고리 추가는 지금 탭의 종류로 만든다. 수정 창에서는 종류를 바꾸지 않는다(ADR-B23).
- `frontend/docs/data-schema.md` 의 카테고리 타입 절에 `type` 을 더한다.

## 작업 항목

### 1. 타입과 스키마, 생성 액션에 `type`

- `frontend/src/types/category.ts`, `frontend/src/lib/schemas/category.ts`, 카테고리 생성 액션(`frontend/src/actions/category/create-category-action.ts`)과 그 테스트.

### 2. 등록과 수정 화면이 종류로 카테고리를 거르기

- `TransactionFormFields.tsx`(또는 넘기는 쪽)에서 `expense`, `recurring` 은 `EXPENSE`, `income` 은 `INCOME`. 종류를 바꾸면 선택 초기화.

### 3. 카테고리 관리 화면의 지출, 수입 탭과 생성 종류

### 4. 가짜 백엔드와 `frontend/docs/data-schema.md`

- 가짜 백엔드 카테고리에 `type` 과 수입 카테고리를 더한다.

### 5. 이 phase 를 검증하는 테스트

- Jest: `frontend/src/__tests__/components/transactions/TransactionFormFields.test.tsx`(신규): 수입이면 수입 카테고리만, 지출이면 지출 카테고리만 보인다. 종류를 바꾸면 선택이 비워진다.
- Jest: `frontend/src/__tests__/actions/category/create-category-action.test.ts`(신규): `type` 을 백엔드 요청에 넘기는 케이스, 인증 실패, 가족 미선택.
- 브라우저: `frontend/browser/categories.spec.ts` 에 수입 탭을 누르면 수입 카테고리만 보이는 케이스.

## 검증

`frontend/` 에서 실행한다.

```bash
pnpm install --frozen-lockfile
pnpm exec playwright install chromium
pnpm tsc --noEmit && pnpm lint && pnpm lint:md
pnpm test -- src/__tests__/components/transactions/TransactionFormFields.test.tsx src/__tests__/actions/category/create-category-action.test.ts
pnpm test
pnpm test:browser browser/categories.spec.ts
pnpm test:browser
```

기대값: 모든 명령이 성공한다.

## 변경 파일

| 파일 | 변경 |
|---|---|
| `frontend/src/types/category.ts` | 수정 |
| `frontend/src/lib/schemas/category.ts` | 수정 |
| `frontend/src/actions/category/create-category-action.ts` | 수정 |
| `frontend/src/components/transactions/forms/TransactionFormFields.tsx` | 수정 |
| `frontend/src/components/transactions/dialogs/AddTransactionDialog.tsx` | 수정 |
| `frontend/src/components/transactions/dialogs/EditTransactionDialog.tsx` | 수정 |
| `frontend/src/app/(authenticated)/categories/_components/CategoryPageClient.tsx` | 수정 |
| `frontend/src/app/(authenticated)/categories/_components/CategoryList.tsx` | 수정 |
| `frontend/src/app/(authenticated)/categories/_components/AddCategoryDialog.tsx` | 수정 |
| `frontend/docs/data-schema.md` | 수정 |
| `frontend/browser/fake-backend.mjs` | 수정 |
| `frontend/browser/categories.spec.ts` | 수정 |
| `frontend/src/__tests__/components/transactions/TransactionFormFields.test.tsx` | 신규 |
| `frontend/src/__tests__/actions/category/create-category-action.test.ts` | 신규 |
