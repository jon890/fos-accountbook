# Phase 02. 프론트가 검증 실패 문구를 토스트에 보여 준다

**Execution profile**: standard

## 목표

백엔드가 400 과 필드 검증 문구를 돌려주면 Server Action 이 그 문구를 실패 결과의 메시지로 돌려준다.
지금은 모든 비 401 오류가 「카테고리 생성에 실패했습니다」 같은 기본 문구로 바뀌어 원인이 화면에 보이지 않는다.

**범위 외**: 백엔드 변경(phase 01). 팔레트 값은 바꾸지 않는다(ADR-F13 의 OKLCH 를 유지한다).

## 컨텍스트

- `frontend/src/lib/errors/action-error.ts` 의 `handleActionError(error, defaultMessage)` 가 오류를 `ActionResult` 로 바꾼다.
    - `ActionError` 는 그대로, `ServerApiError` 의 status 401 은 `ActionError.sessionExpired()`, 나머지 `Error` 는 `ActionError.internalError(defaultMessage)` 다.
- `frontend/src/lib/server/api/types.ts` 의 `ServerApiError` 는 `status?: number` 와 `errorData?: unknown` 을 가진다. `errorData` 는 백엔드 응답 JSON 이어야 한다.
- 지금은 실제 요청에서 `errorData` 가 항상 `null` 이다. `frontend/src/lib/server/api/client.ts` 가 같은 응답 본문을 두 번 읽기 때문이다.
    - ky 의 `beforeError` 훅이 `response.json()` 으로 본문을 먼저 소비한다.
    - `serverApiClient` 의 `catch` 가 같은 응답을 `error.response.json().catch(() => null)` 로 다시 읽고, 이미 읽은 본문이라 실패해 `null` 이 된다.
- phase 01 이후 400 응답은 `errors: [{ code, field, rejectedValue, message }]` 를 담는다.
- 입력 오류 코드는 `frontend/src/lib/errors/error-code.ts` 의 `INVALID_INPUT`(`C001`) 이다.
    - `action-error.ts` 는 지금 `import { ERROR_MESSAGES, type ErrorCode } from "./error-code"` 로 `ErrorCode` 를 타입으로만 가져온다.
- 카테고리 다이얼로그는 실패 시 `result.error.message` 를 토스트로 보인다. 다이얼로그는 고치지 않는다.
- 기존 테스트는 `frontend/src/__tests__/lib/action-error.test.ts` 의 `describe("handleActionError 변환기")` 에 있다.

**근거 문서**: `frontend/docs/data-schema.md` 의 `ApiErrorResponse` 와 `ErrorDetails`

## 의도 메모

- 필드 문구는 사용자에게 보일 문장으로 백엔드가 이미 만든 것이라 그대로 쓴다. 앞에 필드 이름을 붙이지 않는다.
- 400 이 아니거나 `errors[0].message` 가 문자열이 아니면 지금 동작(기본 문구)을 유지한다. 다른 Action 의 기존 동작을 바꾸지 않는다.

## 작업 항목

### 1. 오류 응답 본문을 남긴다

`frontend/src/lib/server/api/client.ts` 의 `beforeError` 훅에서 `response.json()` 을 `response.clone().json()` 으로 바꾼다.

- 훅 본문을 이름 있는 함수로 빼서 export 하고, `beforeError` 배열에는 그 함수를 넣는다. 테스트가 이 함수를 직접 호출한다.
- 그 밖에는 바꾸지 않는다. 기존 로깅과 `error.message` 설정은 그대로 둔다.
- `catch` 의 두 번째 읽기가 원본 본문을 읽어 `ServerApiError.errorData` 에 백엔드 응답 JSON 이 담긴다.

### 2. `handleActionError` 의 400 분기

`frontend/src/lib/errors/action-error.ts` 에서 401 분기 다음에 둔다.

- `error instanceof ServerApiError && error.status === 400` 이고 `errorData.errors[0].message` 가 비지 않은 문자열이면
  `new ActionError(ErrorCode.INVALID_INPUT, message).addParameter("fieldName", field)` 의 실패 결과를 돌려준다.
- `ErrorCode` import 를 값 import 로 바꾼다: `import { ERROR_MESSAGES, ErrorCode } from "./error-code"`. 같은 이름의 타입도 그대로 쓸 수 있다.
- `errorData` 는 `unknown` 이라 타입 가드로 형태를 확인한다. `any` 를 쓰지 않는다.

### 3. 이 phase 를 검증하는 테스트

`frontend/src/__tests__/lib/action-error.test.ts` 의 기존 `describe("handleActionError 변환기")` 안에 `describe("ServerApiError 400 → 필드 문구")` 를 더한다.

| 입력 | 기대 |
| --- | --- |
| status 400, `errors: [{ field: "color", message: "색상은 #RRGGBB 또는 oklch(L C H) 형식이어야 합니다" }]` | `error.code` 가 `C001`, `error.message` 가 그 문구 |
| status 400, `errors` 없음 | 기본 문구(internalError) |
| status 500 | 기본 문구(기존 동작 회귀 방지) |

`frontend/src/__tests__/lib/server-api-client.test.ts` 를 새로 만든다. 작업 항목 1 에서 export 한 훅 함수를 직접 호출해 훅이 지나간 뒤에도 응답 본문이 남는지 확인한다.

- `jest.config.js` 가 `ky` 를 `src/__mocks__/ky.ts` 로 바꾸고 그 mock 은 `fetch` 를 부르지 않는다. 그래서 `serverApiClient` 를 거쳐 400 을 재현할 수 없다.
- 파일 첫 줄에 `/** @jest-environment node */` 를 둔다. Node 의 실제 `Response` 를 쓰기 위해서다.
- `client.ts` 가 import 하는 `next/headers` 는 `jest.mock("next/headers", () => ({ cookies: async () => ({ get: () => undefined }) }))` 로 대신한다.

| 훅에 넣는 응답 | 기대 |
| --- | --- |
| `new Response(JSON.stringify({ errors: [{ field: "color", message: "색상은 #RRGGBB 또는 oklch(L C H) 형식이어야 합니다" }] }), { status: 400, headers: { "content-type": "application/json" } })` 를 담은 `{ response }` | 훅이 끝난 뒤 `await response.json()` 의 `errors[0].message` 가 그 문구 |

훅을 `response.json()` 으로 되돌리면 이 테스트가 `Body is unusable` 로 실패해야 한다.

## 검증

```bash
# cwd: <repo root>/frontend
pnpm lint
pnpm exec tsc --noEmit
pnpm test -- src/__tests__/lib/action-error.test.ts src/__tests__/lib/server-api-client.test.ts
pnpm test
```

모든 명령이 종료 코드 0 이어야 한다.

## 변경 파일

| 파일 | 변경 |
|---|---|
| `frontend/src/lib/server/api/client.ts` | 수정 |
| `frontend/src/lib/errors/action-error.ts` | 수정 |
| `frontend/src/__tests__/lib/action-error.test.ts` | 수정 |
| `frontend/src/__tests__/lib/server-api-client.test.ts` | 신규 |
