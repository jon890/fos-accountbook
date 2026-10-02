# Phase 04. 나머지 도메인 스키마와 빠뜨림 검사

**Execution profile**: standard
**Domain**: server-action

## 목표

가족, 사용자, API 토큰, 알림, 초대, 카테고리 서비스의 응답이 스키마로 검증된다. `src/services/**` 에서 값을 돌려받는 API 호출이 스키마 없이 남으면 테스트가 실패한다.

**범위 외**: `void` 를 돌려주는 쓰기 호출은 검증하지 않는다. `src/services/**` 밖의 API 호출(`lib/server/cache.ts`, `lib/server/auth/**`, `ExpenseSummaryWrapper.tsx`)도 이번 범위가 아니다.

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
- null 가능 여부는 실제 백엔드 DTO(`backend/src/main/java/**/dto/*Response*.java`, `*Item.java`)를 읽어 정한다. 기억으로 정하지 않는다. 백엔드는 null 을 키를 남긴 채 `"category": null` 로 보낸다(`@JsonInclude(NON_NULL)` 은 `ApiSuccessResponse` 클래스에만 있어 `message` 와 `data` 에만 적용된다). null 이 오는 필드는 `.nullable()` 로 둔다. `.nullish()` 와 `.optional()` 은 DTO 가 키를 생략할 수 있다고 코드로 확인된 필드에만 쓴다.
- `src/types/**` 의 기존 타입은 지우지 않는다. 스키마 파일에 `const _check: z.ZodType<기존타입> = 스키마;` 같은 컴파일 시점 대조를 둬 어긋나면 `tsc` 가 실패하게 한다. 대조가 실패하면 스키마를 느슨하게 하지 않는다. 기존 타입이 실제 백엔드와 다르면(null 을 허용하지 않는 타입 등) 타입을 실제에 맞게 고치고, 그로 인한 호출부 컴파일 오류를 같은 phase 에서 고친다. 그렇게 고친 파일은 회신의 「변경한 파일」 에 적고, team-lead 가 이 phase 의 변경 파일 표에 더한다. 서비스 안에만 있던 지역 타입은 `z.infer` 로 바꾼다.
- 서비스 테스트는 `serverApiGet` 모듈을 통째로 mock 하므로 검증이 실행되지 않는다. 서비스 테스트는 `expect.objectContaining({ schema: 스키마 })` 로 스키마를 넘기는지만 확인하고, 필드 누락과 null 처리는 스키마 단위 테스트(`safeParse`)로 확인한다. `{ schema }` 인자가 더해져 인자 개수까지 비교하던 기존 `toHaveBeenCalledWith` 가 깨지면 그 단언을 고친다.
- 서비스 호출에 `{ schema }` 를 넘긴다. 반환 타입은 바꾸지 않는다.
- 백엔드 `InvitationResponse.java` 의 `isExpired`, `isUsed` 는 원시형 `boolean` 에 Lombok `@Getter` 라 JSON 키가 `expired`, `used` 다. 프론트 타입과 가짜 백엔드의 `isExpired` 는 실제와 다르다. 서비스가 `status` 와 `expiresAt` 으로 직접 계산하므로(21행, 41행) 스키마는 `status`, `expiresAt` 등 서비스가 읽는 필드를 검증하고 `isExpired`/`isUsed` 는 넣지 않는다. 가짜 백엔드 응답은 실제 DTO(`expired`, `used`)에 맞춘다.
- `getFamilies()` 는 ADR-F25 의 `assertFamilyAccess` 가 부른다. 가족 스키마가 틀리면 B 패턴 Action 의 권한 확인이 모두 내부 오류가 되므로 `update-family-action.test` 와 `pnpm test:browser` 로 확인한다. `UserProfile.defaultFamilyUuid` 는 백엔드가 null 을 허용한다(`UserProfile.java`)는 점을 타입에 반영한다.
- 초대 83행은 `serverApiGet` 대신 쓰는 이유(`skipAuth`)가 있으므로 그대로 두되, 받은 `data` 를 phase 01 의 `validateResponse` 로 검증한다(`ResponseValidationError` 가 나온다). 이 서비스 테스트는 `client` 모듈을 mock 하지만 `validate-response` 는 mock 하지 않는다.
- 빠뜨림 검사는 `frontend/src/__tests__/lib/schemas/responses/service-coverage.test.ts`(신규)다. `src/services/**/*.ts` 를 읽어 `serverApi(Get|Post|Put|Patch)` 호출을 찾는다. 호출의 끝은 여는 괄호와 짝이 맞는 닫는 괄호로 정하고(여러 줄과 인라인 제네릭 포함), 제네릭이 `void` 가 아니고 그 호출 안에 `schema` 가 없는 것을 찾는다. `src/services/**` 밖의 호출(`lib/server/cache.ts`, `lib/server/auth/**`, `components/expenses/summary/ExpenseSummaryWrapper.tsx`)은 범위 밖이고, 서비스 안의 `serverApiClient` 직접 호출은 초대 83행처럼 `validateResponse` 를 거친 것만 허용하는 예외 목록으로 둔다. 찾으면 파일과 줄을 내며 실패한다.

## 작업 항목

### 1. `frontend/src/lib/schemas/responses/family.ts`, `user.ts`, `notification.ts`, `invitation.ts`, `category.ts`(모두 신규)

### 2. 여섯 서비스에 `schema` 연결, 초대 직접 호출의 `parse`

### 3. 빠뜨림 검사 테스트

### 4. 테스트 보정과 추가

- `frontend/src/__tests__/services/invitation/invitation-service.test.ts`(수정): 직접 호출 경로도 필드가 빠지면 `ResponseValidationError`.
- `frontend/src/__tests__/actions/family/update-family-action.test.ts`(수정): `serverApiPut` 호출에 `{ schema }` 인자가 더해져 깨지는 `toHaveBeenCalledWith` 를 고친다.
- 각 스키마 단위 테스트(`frontend/src/__tests__/lib/schemas/responses/domain-schemas.test.ts`(신규))에서 필드 누락 실패와 null 허용 필드 통과를 확인한다.

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
| `frontend/src/__tests__/actions/family/update-family-action.test.ts` | 수정 |
| `frontend/src/__tests__/lib/schemas/responses/domain-schemas.test.ts` | 신규 |
| `frontend/browser/fake-backend.mjs` | 수정 |
