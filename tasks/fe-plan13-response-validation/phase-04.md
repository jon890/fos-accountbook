# Phase 04. 나머지 도메인 스키마와 빠뜨림 검사

**Execution profile**: standard
**Domain**: server-action

## 목표

가족, 사용자, API 토큰, 알림, 초대, 카테고리 서비스의 응답이 스키마로 검증된다. 값을 돌려받는 API 호출이 스키마 없이 남으면 테스트가 실패한다.

**범위 외**: `void` 를 돌려주는 쓰기 호출은 검증하지 않는다.

## 컨텍스트

모든 경로는 저장소 root 기준이다. 명령은 `frontend/` 에서 돌린다.

**근거 문서**: `frontend/docs/adr/ADR-F42-service-response-validation.md`, `frontend/docs/data-schema.md`(응답 형태), phase 01 이 만든 `frontend/src/lib/schemas/responses/common.ts`.

코드에서 확인한 사실:

- `frontend/src/services/family/family-service.ts`: 14행 `CreateFamilyResult`, 23행 `Family[]`, 27행 `Family`, 34행 `Family`, 53행 `FamilyMemberSummary[]`.
- `frontend/src/services/user/user-service.ts` 5행 `UserProfile`, `frontend/src/services/user/api-token-service.ts` 9행 `ApiToken[]`, 13행 `CreatedApiToken`.
- `frontend/src/services/notification/notification-service.ts` 19행 `NotificationListResponse`, 25행 `UnreadCountResponse`, 43행 `Notification`(PATCH).
- `frontend/src/services/invitation/invitation-service.ts` 31행 `InvitationResponse`, 50행 `InvitationResponse[]`, 83행은 `serverApiClient<{ data: InvitationResponse }>` 를 직접 불러 `success` 확인도 거치지 않는다(`skipAuth`).
- `frontend/src/services/category/category-service.ts` 17, 34행 `CategoryResponse`(`type`: `EXPENSE` | `INCOME`).

## 의도 메모

- 스키마는 `z.object` 기본(모르는 필드는 버림)으로 쓴다. `.strict()` 를 쓰지 않는다.
- null 이 올 수 있는 필드는 실제 백엔드 DTO(`backend/src/main/java/**/dto/*Response*.java`, `*Item.java`)를 읽어 `.nullable()` 이나 `.optional()` 을 정한다. 기억으로 정하지 않는다. 백엔드는 null 필드를 JSON 에서 생략하므로 null 가능 필드는 `.nullish()` 로 둔다.
- `src/types/**` 의 기존 타입은 지우지 않는다. 스키마 파일에 `const _check: z.ZodType<기존타입> = 스키마;` 같은 컴파일 시점 대조를 둬 어긋나면 `tsc` 가 실패하게 한다. 서비스 안에만 있던 지역 타입은 `z.infer` 로 바꾼다.
- 서비스 호출에 `{ schema }` 를 넘긴다. 반환 타입은 바꾸지 않는다.
- 초대 83행은 `serverApiGet` 대신 쓰는 이유(`skipAuth`)가 있으므로 그대로 두되, 받은 `data` 를 같은 스키마로 `parse` 한다.
- 빠뜨림 검사는 `frontend/src/__tests__/lib/schemas/responses/service-coverage.test.ts`(신규)다. `src/services/**/*.ts` 를 읽어 `serverApi(Get|Post|Put|Patch)<타입>(` 호출 중 타입이 `void` 가 아니고 같은 호출에 `schema` 가 없는 것을 찾는다. 찾으면 파일과 줄을 내며 실패한다.

## 작업 항목

### 1. `frontend/src/lib/schemas/responses/family.ts`, `user.ts`, `notification.ts`, `invitation.ts`, `category.ts`(모두 신규)

### 2. 여섯 서비스에 `schema` 연결, 초대 직접 호출의 `parse`

### 3. 빠뜨림 검사 테스트

### 4. 테스트 보정과 추가

- `frontend/src/__tests__/services/invitation/invitation-service.test.ts`(수정): 직접 호출 경로도 필드가 빠지면 `ResponseValidationError`.

## 검증

`frontend/` 에서 실행한다.

```bash
pnpm tsc --noEmit && pnpm lint && pnpm lint:md && pnpm test
pnpm test src/__tests__/lib/schemas/responses/service-coverage.test.ts src/__tests__/services/invitation/invitation-service.test.ts
pnpm test:browser
```

기대값: 모든 명령이 성공한다.

## 변경 파일

| 파일 | 변경 |
|---|---|
| `frontend/src/lib/schemas/responses/family.ts` | 신규 |
| `frontend/src/lib/schemas/responses/user.ts` | 신규 |
| `frontend/src/lib/schemas/responses/notification.ts` | 신규 |
| `frontend/src/lib/schemas/responses/invitation.ts` | 신규 |
| `frontend/src/lib/schemas/responses/category.ts` | 신규 |
| `frontend/src/services/family/family-service.ts` | 수정 |
| `frontend/src/services/user/user-service.ts` | 수정 |
| `frontend/src/services/user/api-token-service.ts` | 수정 |
| `frontend/src/services/notification/notification-service.ts` | 수정 |
| `frontend/src/services/invitation/invitation-service.ts` | 수정 |
| `frontend/src/services/category/category-service.ts` | 수정 |
| `frontend/src/__tests__/lib/schemas/responses/service-coverage.test.ts` | 신규 |
| `frontend/src/__tests__/services/invitation/invitation-service.test.ts` | 수정 |
| `frontend/browser/fake-backend.mjs` | 수정 |
