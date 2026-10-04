# Phase 02. 프론트엔드: 할부 타입, 스키마, 서비스, Server Action

**Execution profile**: standard
**Domain**: server-action

## 목표

phase 01 의 할부 API 를 부르는 프론트엔드 데이터 층을 만든다. 화면은 phase 03, 04 가 이 층만 부른다.

**범위 외**: 컴포넌트와 화면 연결은 phase 03, 04 가 한다.

## 컨텍스트

가장 최근에 만든 예산 항목(`budget-item`) 데이터 층을 본뜬다.

| 본뜰 파일 | 새 파일 |
|---|---|
| `frontend/src/types/budget-item.ts` | `frontend/src/types/installment.ts` |
| `frontend/src/lib/schemas/budget-item.ts` | `frontend/src/lib/schemas/installment.ts` |
| `frontend/src/lib/schemas/responses/budget-item.ts` | `frontend/src/lib/schemas/responses/installment.ts` |
| `frontend/src/services/budget-item/budget-item-service.ts` | `frontend/src/services/installment/installment-service.ts` |
| `frontend/src/actions/budget-item/_helpers.ts` 와 `*-budget-item-action.ts` 네 개 | `frontend/src/actions/installment/_helpers.ts` 와 `*-installment-action.ts` 네 개 |
| `frontend/src/__tests__/actions/budget-item/budget-item-actions.test.ts` | `frontend/src/__tests__/actions/installment/installment-actions.test.ts` |

- 권한은 ADR-F25 패턴 A(Single-family)다. 액션은 `requireAuth()` 뒤 `getSelectedFamilyUuid()` 로 세션의 가족만 쓴다. 없으면 `ActionError.familyNotSelected()`.
- 입력 검증은 ADR-F06 대로 Zod 로 하고, 실패하면 첫 필드 문구로 `ActionError.invalidInput` 을 던진다(`parseBudgetItemInput` 과 같다).
- 서비스 응답은 ADR-F42 대로 `schema` 를 넘겨 검증한다. `frontend/src/__tests__/lib/schemas/responses/service-coverage.test.ts` 가 `src/services/**` 의 빠뜨림을 자동으로 잡는다.
- 백엔드 400 은 공용 `handleActionError` 가 백엔드 문구를 그대로 전달한다. 404 는 기본 문구로 바뀐다. 할부는 409 가 없어 `rethrowBudgetItemConflict` 같은 변환이 필요 없다.

**근거 문서**: `frontend/docs/data-schema.md` 의 「Installment」, `backend/docs/data-schema.md` 의 「할부 요청과 응답」.

## 의도 메모

- 요약 합계(이번 달 할부, 남은 할부)를 위한 별도 API 나 함수를 서비스에 두지 않는다. 화면이 목록에서 더한다(phase 03).
- 메모가 빈 문자열이면 보내지 않는다(`undefined`). 백엔드도 공백 메모를 null 로 바꾸지만 요청을 깔끔하게 두기 위해서다.

## 작업 항목

### 1. 타입과 스키마

`frontend/src/types/installment.ts`: `frontend/docs/data-schema.md` 「Installment」 의 `InstallmentProgress`, `Installment` 를 그대로 옮긴다. `InstallmentInput` 은 `z.infer<typeof installmentInputSchema>` 로 둔다.

`frontend/src/lib/schemas/installment.ts`: `installmentInputSchema`

| 필드 | 규칙과 문구 |
|---|---|
| `name` | `z.string().trim().min(1, "이름은 필수입니다").max(50, "이름은 50자까지 쓸 수 있습니다")` |
| `totalAmount` | 정수, `min(1, "총 금액은 1원 이상이어야 합니다")`, `max(9_999_999_999, "총 금액이 너무 큽니다")` |
| `installmentMonths` | 정수, `min(2, "할부는 2개월 이상이어야 합니다")`, `max(60, "할부는 60개월까지 기록할 수 있습니다")` |
| `startMonth` | `regex(/^\d{4}-(0[1-9]|1[0-2])$/, "첫 결제 월을 골라 주세요")` |
| `memo` | `z.string().trim().max(200, "메모는 200자까지 쓸 수 있습니다").transform((v) => (v === "" ? undefined : v)).optional()`. `.optional()` 을 `transform` 뒤에 둔다. 앞에 두면 `z.infer` 의 `memo` 가 필수 키가 되어 phase 03 의 창에서 `pnpm tsc` 가 실패한다 |

객체 단계 `refine`: `totalAmount >= installmentMonths`, 실패 문구 「총 금액은 할부 개월 수 이상이어야 합니다」, `path: ["totalAmount"]`.

`frontend/src/lib/schemas/responses/installment.ts`: `installmentResponseSchema` 와 `installmentListResponseSchema = z.array(installmentResponseSchema)`. `satisfies z.ZodType<Installment>` 로 타입과 묶는다. `uuidString`, `isoDateString` 은 `./common` 에서 가져온다. `memo` 는 `z.string().nullable()`, `progress` 는 `z.enum(["UPCOMING", "IN_PROGRESS", "COMPLETED"])`.

### 2. 서비스

`frontend/src/services/installment/installment-service.ts`

- `getInstallments(familyUuid): Promise<Installment[]>` → `GET /families/${familyUuid}/installments`
- `createInstallment(familyUuid, data: InstallmentInput): Promise<Installment>` → `POST`
- `updateInstallment(familyUuid, installmentUuid, data): Promise<Installment>` → `PUT /families/${familyUuid}/installments/${installmentUuid}`
- `deleteInstallment(familyUuid, installmentUuid): Promise<void>` → `DELETE`

`serverApiGet`, `serverApiPost`, `serverApiPut`, `serverApiDelete` 는 `@/lib/server/api/client` 에서 가져온다.

### 3. Server Action

`frontend/src/actions/installment/_helpers.ts`: `parseInstallmentInput(data)`, `parseInstallmentUuid(uuid)` (UUID 형식 검증, 필드 이름 `installmentUuid`).

| 파일 | 함수 | 실패 기본 문구 |
|---|---|---|
| `get-installments-action.ts` | `getInstallmentsAction(): Promise<ActionResult<Installment[]>>` | 할부를 불러오는데 실패했습니다 |
| `create-installment-action.ts` | `createInstallmentAction(data: InstallmentInput)` | 할부 등록에 실패했습니다 |
| `update-installment-action.ts` | `updateInstallmentAction(installmentUuid: string, data: InstallmentInput)` | 할부 수정에 실패했습니다 |
| `delete-installment-action.ts` | `deleteInstallmentAction(installmentUuid: string): Promise<ActionResult<void>>` | 할부 삭제에 실패했습니다 |

- 모두 `"use server"`. 쓰기 액션 세 개는 성공 뒤 `revalidatePath("/transactions")` 만 부른다. 할부는 예산, 달력, 분석에 보이지 않는다.

### 4. 테스트

`frontend/src/__tests__/lib/schemas/installment.test.ts`

- 정상 입력이 통과하고 공백 메모가 `undefined` 가 된다
- 개월 1, 개월 61, `startMonth` `"2026-13"`, 총액 5와 개월 12, 공백 이름이 각각 실패하고 위 표의 문구를 낸다

`frontend/src/__tests__/lib/schemas/responses/installment.test.ts`

- 백엔드 응답 예시 하나가 통과한다. `memo: null` 도 통과한다
- `progress` 가 `"DONE"` 이면 실패한다

`frontend/src/__tests__/actions/installment/installment-actions.test.ts` (`budget-item-actions.test.ts` 와 같은 mock 구성)

- 생성은 세션 가족으로 서비스를 부르고 `/transactions` 만 revalidate 한다
- 입력 검증 실패면 서비스를 부르지 않고 `success: false` 와 필드 문구를 준다
- 수정과 삭제는 UUID 가 형식에 맞지 않으면 서비스를 부르지 않는다
- 가족이 선택되지 않았으면 실패한다
- 백엔드 400(`ServerApiError`, `status` 400, 필드 오류 하나)이면 그 문구를 그대로 준다

## 검증

```bash
cd frontend && pnpm exec jest src/__tests__/lib/schemas/installment.test.ts src/__tests__/lib/schemas/responses/installment.test.ts src/__tests__/actions/installment/installment-actions.test.ts src/__tests__/lib/schemas/responses/service-coverage.test.ts
cd frontend && pnpm tsc --noEmit && pnpm lint && pnpm lint:md && pnpm test
```

## 변경 파일

| 파일 | 변경 |
|---|---|
| `frontend/src/types/installment.ts` | 신규 |
| `frontend/src/lib/schemas/installment.ts` | 신규 |
| `frontend/src/lib/schemas/responses/installment.ts` | 신규 |
| `frontend/src/services/installment/installment-service.ts` | 신규 |
| `frontend/src/actions/installment/_helpers.ts` | 신규 |
| `frontend/src/actions/installment/get-installments-action.ts` | 신규 |
| `frontend/src/actions/installment/create-installment-action.ts` | 신규 |
| `frontend/src/actions/installment/update-installment-action.ts` | 신규 |
| `frontend/src/actions/installment/delete-installment-action.ts` | 신규 |
| `frontend/src/__tests__/lib/schemas/installment.test.ts` | 신규 |
| `frontend/src/__tests__/lib/schemas/responses/installment.test.ts` | 신규 |
| `frontend/src/__tests__/actions/installment/installment-actions.test.ts` | 신규 |
