# Phase 06. 예산 화면의 예산 항목 관리

**Execution profile**: standard

**Domain**: `app-router`

## 목표

`/budget` 화면에 예산 항목 구역을 더해 항목을 만들고 고치고 지운다. 사용자가 홈에 보일 항목을 직접 정하기 위해서다.

**범위 외**: 생활비 한도(월 예산) 수정은 지금처럼 `/settings` 의 `BudgetEditDialog` 가 맡는다. `BudgetCumulativeLine` 과 `BudgetCategoryBars` 의 합계 기준은 바꾸지 않는다.

## 컨텍스트

모든 경로는 저장소 root 기준이다. 명령은 `frontend/` 에서 돌린다. phase 04 의 액션 넷과 타입이 있어야 한다.

**근거 문서**: `frontend/docs/flow.md` 의 「14-3. /budget 페이지」 절, `frontend/docs/data-schema.md` 의 「BudgetItem」 절, `backend/docs/data-schema.md` 의 「예산 항목 요청과 응답」 절, `frontend/docs/adr/ADR-F08-sonner-toast-alerts.md`(`alert` 와 `confirm` 금지), `frontend/docs/adr/ADR-F13-oklch-color-system.md`, `frontend/docs/adr/ADR-F23-semantic-foreground-tokens.md`, `frontend/docs/adr/ADR-F35-mobile-spacing.md`.

코드에서 확인한 사실:

- 페이지 `frontend/src/app/(authenticated)/budget/page.tsx` 는 Server Component 이고 `Promise.all` 로 `getDashboardStatsAction()`, `getMonthlyDailyStatsAction(year, month)`, `getMonthlyCategoryBreakdownAction()` 을 부른 뒤 `getActionDataOrDefault(result, 기본값)` 으로 실패를 기본값으로 바꿔 `BudgetClient` 에 넘긴다.
- `frontend/src/app/(authenticated)/budget/_components/BudgetClient.tsx` 는 `"use client"` 다. 월 예산이 0 이면(`!hasBudget`) 빈 상태 카드만 보이고, 카테고리 막대 `BudgetCategoryBars` 와 「예산 수정하기」 버튼이 아래에 있다.
- 카테고리 목록 액션은 `frontend/src/actions/category/get-categories-action.ts` 의 `getFamilyCategoriesAction(familyUuid?)` 이고 `CategoryResponse[]` 를 준다. `CategoryResponse` 에 `type: "EXPENSE" | "INCOME"` 이 있다(`frontend/src/types/category.ts`).
- 대화상자 선례는 `frontend/src/components/settings/BudgetEditDialog.tsx` 다. 데스크톱은 `Dialog`, 모바일은 `Sheet` 를 `useMediaQuery("(min-width: 768px)")` 로 고르고, 저장 중 상태와 `toast` 를 쓴다. prop 이 바뀔 때 입력값을 되돌리는 방식도 이 파일을 따른다(effect 안 `setState` 금지).
- 삭제 확인은 `frontend/src/components/ui/alert-dialog.tsx` 의 `AlertDialog` 를 쓴다.
- `frontend/src/components/ui/` 에 체크박스 컴포넌트는 없다.
- 페이지 테스트 `frontend/src/__tests__/app/budget/page.test.tsx` 는 세 액션을 `jest.mock` 한다. 새 액션 둘을 부르면 mock 을 더해야 한다.

## 의도 메모

- 카테고리 여러 개 선택은 새 UI 라이브러리를 들이지 않고 토글 버튼 목록으로 만든다. 버튼마다 `aria-pressed` 를 주고 아이콘과 이름을 보인다. `type === "EXPENSE"` 인 카테고리만 보인다.
- 다른 항목에 이미 속한 카테고리는 `disabled` 로 두고 「다른 항목에 있음」 을 보조 글자로 붙인다. 수정 중인 항목 자신의 카테고리는 고를 수 있다.
- 항목 목록과 카테고리 조회가 실패하면 구역 안에 「예산 항목을 불러오지 못했어요」 를 보인다. 예산 화면의 나머지는 그대로 그린다(이 화면의 기존 방식이 기본값 대체다). 인증 실패 처리는 `frontend/src/lib/server/action-result-handler.ts` 의 `getActionDataOrDefault` 가 하는 대로 둔다.
- 저장이 실패하면 액션 결과의 `error.message` 를 `toast.error` 로 보이고 대화상자를 닫지 않는다. 성공하면 `toast.success` 뒤 닫는다. 화면 갱신은 액션의 `revalidatePath` 가 맡는다.
- 한도 입력은 숫자만 받는다. 빈 값은 0 으로 저장한다. 도움말 「0 이면 한도 없이 쓴 금액만 보여요」 를 둔다.
- 항목이 10개면 「항목 추가」 를 `disabled` 로 두고 「예산 항목은 10개까지 만들 수 있어요」 를 보인다.

## 작업 항목

### 1. 페이지에서 항목과 카테고리 조회

`frontend/src/app/(authenticated)/budget/page.tsx` 의 `Promise.all` 에 `getBudgetItemsAction()` 과 `getFamilyCategoriesAction()` 을 더한다. 둘 중 하나라도 실패하면 `budgetItemsFailed = true` 로 `BudgetClient` 에 넘긴다. `BudgetClient` 는 새 props `budgetItems: BudgetItem[]`, `expenseCategories: CategoryResponse[]`(`EXPENSE` 만 걸러서), `budgetItemsFailed: boolean` 을 받는다.

### 2. 구역 `frontend/src/app/(authenticated)/budget/_components/BudgetItemsSection.tsx`

- `"use client"`. 제목 「예산 항목」, 항목마다 이름, 월 한도(`formatCurrency`, 0 이면 「한도 없음」), 카테고리 이름들(쉼표로 이음. 카테고리가 없으면 「카테고리 없음」), 「수정」, 「삭제」 버튼.
- 빈 상태: 「용돈처럼 따로 관리할 지출을 예산 항목으로 만들어 보세요」 와 「항목 추가」.
- 삭제: `AlertDialog` 로 「'{이름}' 항목을 삭제할까요? 이 항목의 지출은 다시 생활비에 들어갑니다」 를 확인한 뒤 `deleteBudgetItemAction(uuid)`.
- `BudgetClient` 에서 `BudgetCategoryBars` 아래에 둔다. `hasBudget` 과 무관하게 항상 그린다.

### 3. 대화상자 `frontend/src/app/(authenticated)/budget/_components/BudgetItemDialog.tsx`

- props: `open`, `onOpenChange`, `item?: BudgetItem`(있으면 수정), `expenseCategories`, `takenCategoryUuids: Set<string>`(다른 항목이 쓰는 카테고리).
- 입력: 이름(최대 30자), 월 한도, 카테고리 토글 목록.
- 저장: 수정이면 `updateBudgetItemAction(item.uuid, input)`, 아니면 `createBudgetItemAction(input)`. 이름이 비었거나 카테고리를 고르지 않았으면 저장 버튼을 `disabled` 로 둔다.

### 4. 이 phase 를 검증하는 테스트

- `frontend/src/__tests__/app/budget/BudgetItemsSection.test.tsx`(신규, 액션은 `jest.mock`):
  - 정상: 항목 둘을 주면 이름, 한도, 카테고리 이름이 보인다. 「항목 추가」 로 대화상자를 열어 이름, 한도, 카테고리 하나를 고르고 저장하면 `createBudgetItemAction` 이 `{ name, monthlyLimit, categoryUuids }` 로 불린다.
  - 다른 항목이 쓰는 카테고리 버튼은 `disabled` 다.
  - 실패: 액션이 `{ success: false, error: { code: "C001", message: "이미 존재하는 예산 항목입니다" } }` 를 주면 `toast.error` 가 그 문구로 불리고 대화상자가 열린 채다.
  - 삭제: 확인을 누르면 `deleteBudgetItemAction` 이 그 uuid 로 불린다.
  - 빈 상태 문구와 10개일 때 「항목 추가」 `disabled`.
- `frontend/src/__tests__/app/budget/page.test.tsx`: 새 액션 둘의 mock 을 더하고, 항목 조회가 실패하면 「예산 항목을 불러오지 못했어요」 가 보이는 케이스를 더한다.

## 검증

```bash
cd frontend && pnpm test -- src/__tests__/app/budget/BudgetItemsSection.test.tsx src/__tests__/app/budget/page.test.tsx
cd frontend && pnpm tsc --noEmit && pnpm lint && pnpm lint:md && pnpm test
```

모두 종료 코드 0 이어야 한다.

## 변경 파일

| 파일 | 변경 |
|---|---|
| `frontend/src/app/(authenticated)/budget/page.tsx` | 수정 |
| `frontend/src/app/(authenticated)/budget/_components/BudgetClient.tsx` | 수정 |
| `frontend/src/app/(authenticated)/budget/_components/BudgetItemsSection.tsx` | 신규 |
| `frontend/src/app/(authenticated)/budget/_components/BudgetItemDialog.tsx` | 신규 |
| `frontend/src/__tests__/app/budget/BudgetItemsSection.test.tsx` | 신규 |
| `frontend/src/__tests__/app/budget/page.test.tsx` | 수정 |
