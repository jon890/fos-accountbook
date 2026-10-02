# Phase 04. 프론트엔드 예산 항목 데이터 계층

**Execution profile**: standard

**Domain**: `server-action`

## 목표

예산 항목과 예산 요약의 타입, 응답 스키마, 서비스, Server Action 을 만든다. phase 05 의 홈 카드와 phase 06 의 관리 화면이 이 계층을 쓴다.

**범위 외**: 화면 컴포넌트는 phase 05, 06 이다.

## 컨텍스트

모든 경로는 저장소 root 기준이다. 명령은 `frontend/` 에서 돌린다. 백엔드 API 는 phase 01~03 이 만들었다.

**근거 문서**: `frontend/docs/data-schema.md` 의 「BudgetItem」 절, `backend/docs/data-schema.md` 의 「예산 항목 요청과 응답」, 「예산 요약과 생활비 합계」 절, `frontend/docs/adr/ADR-F04-actions-services-separation.md`, `frontend/docs/adr/ADR-F06-zod-runtime-validation.md`, `frontend/docs/adr/ADR-F25-server-action-authorization.md`, `frontend/docs/adr/ADR-F42-service-response-validation.md`.

코드에서 확인한 사실:

- 서비스 선례: `frontend/src/services/category/category-service.ts`. `serverApiPost`, `serverApiPut`, `serverApiDelete`, `serverApiGet` 을 `@/lib/server/api/client` 에서 가져오고 `{ schema }` 로 응답을 검증한다. 삭제는 검증하지 않는다.
- 응답 스키마 선례: `frontend/src/lib/schemas/responses/calendar.ts`. `uuidString`, `isoDateString` 은 `frontend/src/lib/schemas/responses/common.ts` 에 있다. 금액은 JSON 숫자라 `z.number()` 로 받는다. `satisfies z.ZodType<타입>` 으로 타입과 맞춘다.
- 입력 스키마 선례: `frontend/src/lib/schemas/category.ts`.
- 액션 선례: `frontend/src/actions/category/create-category-action.ts`(검증과 패턴 A), `frontend/src/actions/category/delete-category-action.ts`. `requireAuth`, `getSelectedFamilyUuid` 는 `@/lib/server/auth/auth-helpers` 에 있다. 가족을 고르지 않았으면 `ActionError.familyNotSelected()` 다.
- `handleActionError`(`frontend/src/lib/errors/action-error.ts`)는 백엔드 400 일 때만 백엔드 문구를 전달한다. 409 는 전달하지 않는다. 예산 항목의 `BI002`, `BI004` 는 409 다.
- 테스트는 `jest.mock` 방식이다(`frontend/docs/adr/ADR-F09-jest-mock-testing.md`). 서비스 테스트 선례는 `frontend/src/__tests__/services/calendar/calendar-service.test.ts`, 액션 테스트 선례는 `frontend/src/__tests__/actions/category/create-category-action.test.ts` 다.

## 의도 메모

- 권한은 ADR-F25 의 패턴 A(Single-family)다. 액션은 `familyUuid` 를 인자로 받지 않고 세션의 `getSelectedFamilyUuid()` 만 쓴다.
- `budgetItemUuid` 는 API 경로에 들어가므로 `z.string().uuid()` 로 검증한 뒤 쓴다(`frontend/CLAUDE.md` 의 「외부 UUID 입력 형식 검증 필수」).
- 공용 `handleActionError` 의 동작은 바꾸지 않는다. 다른 액션의 409 처리가 함께 달라진다. 예산 항목의 생성과 수정 액션이 `ServerApiError` 의 `status === 409` 를 직접 잡아 백엔드 문구로 `ActionError(ErrorCode.INVALID_INPUT, 문구)` 를 만든다. `action-error.ts` 안의 `businessError` 가 export 되어 있지 않으면 export 해서 쓴다.
- 예산 요약 조회는 액션을 따로 만들지 않는다. phase 05 가 `calendar-service` 에서 서비스 함수를 직접 부른다.

## 작업 항목

### 1. 타입 `frontend/src/types/budget-item.ts`

`BudgetItem`, `BudgetItemInput`, `BudgetSummary` 를 `frontend/docs/data-schema.md` 의 「BudgetItem」 절 그대로 정의한다.

### 2. 스키마

- `frontend/src/lib/schemas/responses/budget-item.ts`: `budgetItemResponseSchema`, `budgetItemListResponseSchema`(배열), `budgetSummaryResponseSchema`.
- `frontend/src/lib/schemas/budget-item.ts`: `budgetItemInputSchema`. `name` 은 `trim` 뒤 1~30자(「이름은 필수입니다」, 「이름은 30자까지 쓸 수 있습니다」), `monthlyLimit` 은 0 이상 정수(「한도는 0 이상이어야 합니다」), `categoryUuids` 는 UUID 1개 이상(「카테고리를 하나 이상 골라 주세요」).

### 3. 서비스 `frontend/src/services/budget-item/budget-item-service.ts`

- `getBudgetItems(familyUuid)`: `GET /families/${familyUuid}/budget-items`
- `createBudgetItem(familyUuid, data)`: `POST /families/${familyUuid}/budget-items`
- `updateBudgetItem(familyUuid, budgetItemUuid, data)`: `PUT /families/${familyUuid}/budget-items/${budgetItemUuid}`
- `deleteBudgetItem(familyUuid, budgetItemUuid)`: `DELETE /families/${familyUuid}/budget-items/${budgetItemUuid}`
- `getBudgetSummary(familyUuid, year, month)`: `GET /families/${familyUuid}/dashboard/budget-summary?year=${year}&month=${month}`

### 4. 액션 `frontend/src/actions/budget-item/`

- `get-budget-items-action.ts`: `getBudgetItemsAction(): Promise<ActionResult<BudgetItem[]>>`. 실패 문구 「예산 항목을 불러오는데 실패했습니다」.
- `create-budget-item-action.ts`: `createBudgetItemAction(data: BudgetItemInput): Promise<ActionResult<BudgetItem>>`.
- `update-budget-item-action.ts`: `updateBudgetItemAction(budgetItemUuid: string, data: BudgetItemInput): Promise<ActionResult<BudgetItem>>`.
- `delete-budget-item-action.ts`: `deleteBudgetItemAction(budgetItemUuid: string): Promise<ActionResult<void>>`.
- 쓰기 액션 셋은 성공하면 `revalidatePath("/budget")`, `revalidatePath("/calendar")`, `revalidatePath("/analytics")` 를 부른다.

### 5. 이 phase 를 검증하는 테스트

- `frontend/src/__tests__/services/budget-item/budget-item-service.test.ts`(신규): 다섯 함수가 위 경로와 스키마로 API 래퍼를 부르는지, `getBudgetSummary` 가 `year`, `month` 를 쿼리에 싣는지 확인한다.
- `frontend/src/__tests__/actions/budget-item/budget-item-actions.test.ts`(신규):
  - 정상: `createBudgetItemAction` 이 세션 가족으로 서비스를 부르고 세 경로를 revalidate 한다.
  - 실패: 가족을 고르지 않았으면 `F002`. `categoryUuids` 가 비면 서비스를 부르지 않고 `C001` 과 「카테고리를 하나 이상 골라 주세요」. UUID 형식이 아닌 `budgetItemUuid` 로 수정이나 삭제를 부르면 서비스를 부르지 않고 `C001`. 서비스가 409 `ServerApiError` 를 던지면 결과의 `message` 가 백엔드 문구다.

## 검증

```bash
cd frontend && pnpm test -- src/__tests__/services/budget-item/budget-item-service.test.ts src/__tests__/actions/budget-item/budget-item-actions.test.ts
cd frontend && pnpm tsc --noEmit && pnpm lint && pnpm lint:md && pnpm test
```

모두 종료 코드 0 이어야 한다.

## 변경 파일

| 파일 | 변경 |
|---|---|
| `frontend/src/types/budget-item.ts` | 신규 |
| `frontend/src/lib/schemas/responses/budget-item.ts` | 신규 |
| `frontend/src/lib/schemas/budget-item.ts` | 신규 |
| `frontend/src/services/budget-item/budget-item-service.ts` | 신규 |
| `frontend/src/actions/budget-item/get-budget-items-action.ts` | 신규 |
| `frontend/src/actions/budget-item/create-budget-item-action.ts` | 신규 |
| `frontend/src/actions/budget-item/update-budget-item-action.ts` | 신규 |
| `frontend/src/actions/budget-item/delete-budget-item-action.ts` | 신규 |
| `frontend/src/lib/errors/action-error.ts` | 수정 (`businessError` 를 export 해야 할 때만) |
| `frontend/src/__tests__/services/budget-item/budget-item-service.test.ts` | 신규 |
| `frontend/src/__tests__/actions/budget-item/budget-item-actions.test.ts` | 신규 |
