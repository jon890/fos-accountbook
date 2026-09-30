# Phase 02. 프론트가 검증 실패 문구를 토스트에 보여 준다

**Execution profile**: standard

## 목표

백엔드가 400 과 필드 검증 문구를 돌려주면 Server Action 이 그 문구를 실패 결과의 메시지로 돌려준다.
지금은 모든 비 401 오류가 「카테고리 생성에 실패했습니다」 같은 기본 문구로 바뀌어 원인이 화면에 보이지 않는다.

**범위 외**: 백엔드 변경(phase 01). 팔레트 값은 바꾸지 않는다(ADR-F13 의 OKLCH 를 유지한다).

## 컨텍스트

- `frontend/src/lib/errors/action-error.ts` 의 `handleActionError(error, defaultMessage)` 가 오류를 `ActionResult` 로 바꾼다.
    - `ActionError` 는 그대로, `ServerApiError` 의 status 401 은 `ActionError.sessionExpired()`, 나머지 `Error` 는 `ActionError.internalError(defaultMessage)` 다.
- `frontend/src/lib/server/api/types.ts` 의 `ServerApiError` 는 `status?: number` 와 `errorData?: unknown` 을 가진다. `errorData` 는 백엔드 응답 JSON 이다.
- phase 01 이후 400 응답은 `errors: [{ code, field, rejectedValue, message }]` 를 담는다.
- 입력 오류 코드는 `frontend/src/lib/errors/error-code.ts` 의 `INVALID_INPUT`(`C001`) 이다.
- 카테고리 다이얼로그는 실패 시 `result.error.message` 를 토스트로 보인다. 다이얼로그는 고치지 않는다.
- 기존 테스트는 `frontend/src/__tests__/lib/action-error.test.ts` 의 `describe("handleActionError 변환기")` 에 있다.

**근거 문서**: `frontend/docs/data-schema.md` 의 `ApiErrorResponse` 와 `ErrorDetails`

## 의도 메모

- 필드 문구는 사용자에게 보일 문장으로 백엔드가 이미 만든 것이라 그대로 쓴다. 앞에 필드 이름을 붙이지 않는다.
- 400 이 아니거나 `errors[0].message` 가 문자열이 아니면 지금 동작(기본 문구)을 유지한다. 다른 Action 의 기존 동작을 바꾸지 않는다.

## 작업 항목

### 1. `handleActionError` 의 400 분기

`frontend/src/lib/errors/action-error.ts` 에서 401 분기 다음에 둔다.

- `error instanceof ServerApiError && error.status === 400` 이고 `errorData.errors[0].message` 가 비지 않은 문자열이면
  `new ActionError(ErrorCode.INVALID_INPUT, message).addParameter("fieldName", field)` 의 실패 결과를 돌려준다.
- `errorData` 는 `unknown` 이라 타입 가드로 형태를 확인한다. `any` 를 쓰지 않는다.

### 2. 이 phase 를 검증하는 테스트

`frontend/src/__tests__/lib/action-error.test.ts` 에 `describe("ServerApiError 400 → 필드 문구")` 를 더한다.

| 입력 | 기대 |
| --- | --- |
| status 400, `errors: [{ field: "color", message: "색상은 #RRGGBB 또는 oklch(L C H) 형식이어야 합니다" }]` | `error.code` 가 `C001`, `error.message` 가 그 문구 |
| status 400, `errors` 없음 | 기본 문구(internalError) |
| status 500 | 기본 문구(기존 동작 회귀 방지) |

## 검증

```bash
# cwd: <repo root>/frontend
pnpm lint
pnpm exec tsc --noEmit
pnpm test -- src/__tests__/lib/action-error.test.ts
pnpm test
```

모든 명령이 종료 코드 0 이어야 한다.

## 변경 파일

| 파일 | 변경 |
|---|---|
| `frontend/src/lib/errors/action-error.ts` | 수정 |
| `frontend/src/__tests__/lib/action-error.test.ts` | 수정 |
