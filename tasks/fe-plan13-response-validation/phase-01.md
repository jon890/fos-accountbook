# Phase 01. API 래퍼의 schema 인자와 응답 계약 오류

**Execution profile**: standard
**Domain**: server-action

## 목표

`serverApiGet`, `serverApiPost`, `serverApiPut`, `serverApiPatch` 가 선택 인자 `schema` 를 받아 `response.data` 를 검증한다. 어긋나면 `ResponseValidationError` 를 던지고, Action 은 이를 내부 오류 결과로 바꾼다.

**범위 외**: 도메인별 스키마는 phase 02 부터 04 다.

## 컨텍스트

모든 경로는 저장소 root 기준이다. 명령은 `frontend/` 에서 돌린다.

**근거 문서**: `frontend/docs/adr/ADR-F42-service-response-validation.md`, `frontend/docs/adr/ADR-F06-zod-runtime-validation.md`, `frontend/docs/code-architecture.md` 의 「에러 처리」.

코드에서 확인한 사실:

- `frontend/src/lib/server/api/client.ts` 182행 `serverApiClient<T>` 가 `response.json<T>()`(221행)로 타입만 붙인다. 248행 `serverApiGet<T>(endpoint)`, 261행 `serverApiPost<T>(endpoint, body?, options?)`, 280행 `serverApiPut<T>(endpoint, body?)`, 297행 `serverApiPatch<T>(endpoint, body?)`, 314행 `serverApiDelete<T>(endpoint)` 가 `ApiResponse<T>` 의 `success` 를 보고 `data` 를 돌려준다.
- `frontend/src/lib/server/api/types.ts` 8행 `ServerApiError`, 22행 `ApiResponse<T>`, 29행 `ServerApiOptions`(`skipAuth` 만).
- `frontend/src/lib/errors/action-error.ts` 263행 `handleActionError(error, defaultMessage)` 가 `ActionError`, 401, 400, 네트워크 오류를 나눠 결과를 만든다. 그 밖은 `internalError(defaultMessage)` 다.
- `frontend/src/types/common.ts` 38행 `PaginationResponse<T>`.

## 의도 메모

- 래퍼 시그니처는 기존 호출을 깨지 않게 마지막 인자에 `options?: { schema?: z.ZodType<T> } & ServerApiOptions` 를 둔다(GET 은 두 번째 인자). `schema` 가 있으면 `schema.safeParse(response.data)`, 실패하면 `ResponseValidationError(endpoint, issues)` 를 던진다.
- 검증과 오류 변환은 `frontend/src/lib/server/api/validate-response.ts`(신규)의 `validateResponse(endpoint, schema, data)` 하나에 둔다. 래퍼와 phase 04 의 초대 직접 호출이 함께 쓴다. `client.ts` 에 두지 않는다. 서비스 테스트가 `client` 모듈을 통째로 mock 하므로 그 안의 함수는 `undefined` 를 돌려주게 된다.
- `ResponseValidationError` 는 `types.ts` 에 두고 `endpoint` 와 `issues`(경로와 코드만, 값 없음)를 갖는다. 던지기 전에 `console.error` 로 엔드포인트와 이슈 경로를 한 줄 남긴다. 응답 값은 남기지 않는다. 오류 message 는 `응답 계약 위반: <엔드포인트 경로 템플릿>` 처럼 쓰고 응답 값과 UUID 를 넣지 않는다(`handleActionError` 의 `withCause` 가 message 를 `debugInfo.cause` 로 클라이언트에 싣는다). 엔드포인트는 UUID 와 쿼리를 `:uuid` 와 빈 값으로 바꾼 경로를 쓴다.
- `handleActionError` 는 지금도 `Error` 면 `internalError` 로 돌려준다. `ResponseValidationError` 에서 달라지는 것은 `withCause` 로 message 를 `debugInfo.cause` 에 싣지 않는 것 하나다(사용자 문구는 기존 `defaultMessage`).
- 공용 스키마는 `frontend/src/lib/schemas/responses/common.ts`(신규)에 둔다: `paginationSchema(itemSchema)`(`PaginationResponse<T>` 와 대조), `uuidString`, `isoDateString` 같은 작은 조각.

## 작업 항목

### 1. `types.ts` 에 `ResponseValidationError`, `validate-response.ts`(신규), `client.ts` 래퍼에 `schema` 인자

### 2. `frontend/src/lib/schemas/responses/common.ts`(신규)

### 3. `action-error.ts` 의 `handleActionError` 분기

### 4. 단위 테스트

- `frontend/src/__tests__/lib/server/api/response-validation.test.ts`(신규): 맞는 응답은 그대로 돌려주고, 필드가 빠지면 `ResponseValidationError` 와 이슈 경로를 낸다. 모르는 필드는 버리고 통과한다. 로그와 오류 message 에 응답 값이 없다. `validateResponse` 단위 테스트를 포함한다.
- `frontend/src/__tests__/lib/action-error.test.ts`(수정): `ResponseValidationError` 가 내부 오류 결과가 되고 `debugInfo.cause` 에 message 가 실리지 않는다.

## 검증

`frontend/` 에서 실행한다.

```bash
pnpm install --frozen-lockfile
pnpm tsc --noEmit && pnpm lint && pnpm lint:md && pnpm test
pnpm test src/__tests__/lib/server/api/response-validation.test.ts src/__tests__/lib/action-error.test.ts
```

기대값: 모든 명령이 성공한다.

## 변경 파일

| 파일 | 변경 |
|---|---|
| `frontend/src/lib/server/api/types.ts` | 수정 |
| `frontend/src/lib/server/api/client.ts` | 수정 |
| `frontend/src/lib/server/api/validate-response.ts` | 신규 |
| `frontend/src/lib/schemas/responses/common.ts` | 신규 |
| `frontend/src/lib/errors/action-error.ts` | 수정 |
| `frontend/src/__tests__/lib/server/api/response-validation.test.ts` | 신규 |
| `frontend/src/__tests__/lib/action-error.test.ts` | 수정 |
