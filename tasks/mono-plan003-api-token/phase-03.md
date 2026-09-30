# Phase 03. 프론트 연동 토큰 타입, service, Server Action

**Execution profile**: standard
**Domain**: server-action

## 목표

설정 화면이 연동 토큰을 조회, 발급, 폐기할 수 있도록 타입, service, Server Action 세 개를 만든다.

**범위 외**: 화면(카드와 Dialog)은 phase 04 가 맡는다. 백엔드는 phase 01, 02 가 끝냈다.

## 컨텍스트

- 백엔드 API: `POST /api/v1/users/me/api-tokens` (본문 `{ name }`, 응답 `data` 에 `CreatedApiToken`), `GET /api/v1/users/me/api-tokens` (`data` 에 `ApiToken[]`), `DELETE /api/v1/users/me/api-tokens/{uuid}`. 한도 초과는 400 `AT002`, 없는 토큰은 404 `AT001`.
- 서버 API 클라이언트: `frontend/src/lib/server/api/client.ts` 의 `serverApiGet<T>(endpoint)`, `serverApiPost<T>(endpoint, body)`, `serverApiDelete<T>(endpoint)` 는 `ApiResponse<T>` 의 `data` 를 돌려준다. 엔드포인트는 `/api/v1` 를 뺀 `/users/me/api-tokens` 로 적는다(`frontend/src/services/user/user-service.ts` 선례).
- Server Action 선례: `frontend/src/actions/family/get-families-action.ts` (`requireAuth` → service → `successResult`, 실패는 `handleActionError`), Zod 스키마 선례: `frontend/src/actions/invitation/_schemas.ts`.
- 토큰은 가족 식별자를 다루지 않고 로그인 사용자 자신의 것만 다룬다. 백엔드가 소유를 확인하므로 ADR-F25 의 가족 패턴은 해당하지 않는다. 입력 검증은 ADR-F06 을 따른다.
- 테스트 선례: `frontend/src/__tests__/actions/family/update-family-action.test.ts` (`jest.mock("@/lib/server/auth/auth-helpers")`, service automock, `next/cache` mock).

**근거 문서**: `frontend/docs/data-schema.md` 의 「ApiToken」, `frontend/docs/flow.md` 의 「15. /settings 페이지 구조」, `frontend/docs/adr.md` 의 ADR-F04, ADR-F06

## 의도 메모

- 발급 결과의 원문(`token`)은 Action 반환값으로만 화면에 넘긴다. 로그, 쿠키, 캐시에 남기지 않는다.
- `createApiTokenAction`, `revokeApiTokenAction` 은 끝에 `revalidatePath("/settings")` 를 부른다 (common-pitfalls CODE-6).

## 작업 항목

### 1. `frontend/src/types/api-token.ts` (신규)

`frontend/docs/data-schema.md` 의 「ApiToken」 타입 `ApiToken`, `CreatedApiToken` 을 그대로 export 한다.

### 2. `frontend/src/services/user/api-token-service.ts` (신규)

- `getApiTokens(): Promise<ApiToken[]>` → `serverApiGet<ApiToken[]>("/users/me/api-tokens")`
- `createApiToken(name: string): Promise<CreatedApiToken>` → `serverApiPost<CreatedApiToken>("/users/me/api-tokens", { name })`
- `revokeApiToken(tokenUuid: string): Promise<void>` → `serverApiDelete<void>(`/users/me/api-tokens/${tokenUuid}`)`

### 3. Server Action 세 개 (신규)

`frontend/src/actions/user/_schemas.ts` 를 새로 만들어 `CreateApiTokenSchema = z.object({ name: z.string().trim().min(1).max(50) })`, `ApiTokenUuidSchema = z.object({ tokenUuid: z.string().uuid() })` 를 둔다.

- `frontend/src/actions/user/get-api-tokens-action.ts`: `getApiTokensAction(): Promise<ActionResult<ApiToken[]>>`, 실패 문구 「연동 토큰 목록을 불러오지 못했습니다」
- `frontend/src/actions/user/create-api-token-action.ts`: `createApiTokenAction(name: string): Promise<ActionResult<CreatedApiToken>>`. `requireAuth` → 스키마 parse → service → `revalidatePath("/settings")`. 실패 문구 「연동 토큰을 발급하지 못했습니다」
- `frontend/src/actions/user/revoke-api-token-action.ts`: `revokeApiTokenAction(tokenUuid: string): Promise<ActionResult<void>>`. 같은 순서. 실패 문구 「연동 토큰을 폐기하지 못했습니다」

### 4. 테스트 `frontend/src/__tests__/actions/user/api-token-actions.test.ts` (신규)

`@jest-environment node`. `update-family-action.test.ts` 의 mock 방식을 따르고 `@/services/user/api-token-service` 를 automock 한다.

- `createApiTokenAction("fos-assistant")`: service 결과를 `success: true` 로 돌려주고 `revalidatePath("/settings")` 를 부른다
- `createApiTokenAction("   ")` 와 51자 이름: `success: false`, service 를 부르지 않는다
- `revokeApiTokenAction("550e8400-e29b-41d4-a716-446655440000")`: service 를 그 uuid 로 부르고 `success: true`
- `revokeApiTokenAction("not-a-uuid")`: `success: false`, service 를 부르지 않는다
- `getApiTokensAction()`: service 가 throw 하면 `success: false` 이고 message 가 「연동 토큰 목록을 불러오지 못했습니다」 또는 서버 메시지다

## 검증

```bash
cd frontend
pnpm exec jest src/__tests__/actions/user/api-token-actions.test.ts
pnpm lint && pnpm exec tsc --noEmit && pnpm test
```

기대: 새 테스트와 전체 테스트가 통과한다.

## 변경 파일

| 파일 | 변경 |
|---|---|
| `frontend/src/types/api-token.ts` | 신규 |
| `frontend/src/services/user/api-token-service.ts` | 신규 |
| `frontend/src/actions/user/_schemas.ts` | 신규 |
| `frontend/src/actions/user/get-api-tokens-action.ts` | 신규 |
| `frontend/src/actions/user/create-api-token-action.ts` | 신규 |
| `frontend/src/actions/user/revoke-api-token-action.ts` | 신규 |
| `frontend/src/__tests__/actions/user/api-token-actions.test.ts` | 신규 |
