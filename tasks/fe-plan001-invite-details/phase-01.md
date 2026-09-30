# Phase 01. 초대 정보 타입, service, 삭제 소유 확인

**Execution profile**: standard
**Domain**: server-action

## 목표

백엔드가 이미 보내는 초대자(`inviter`)와 멤버 수(`memberCount`)를 타입과 service 로 받고,
`deleteInvitationAction` 안에 있던 소유 확인을 service helper 로 옮긴다.

**범위 외**: 화면 표시는 phase 02 가 맡는다. 백엔드는 바꾸지 않는다.

## 컨텍스트

- 백엔드 `GET /api/v1/invitations/token/{token}` 은 `inviter`(`name`, `avatarUrl`)와 `memberCount` 를 이미 응답한다.
  정의는 `backend/src/main/java/com/bifos/accountbook/invitation/application/dto/InvitationResponse.java` 의 `InviterInfo`, `fromWithDetails` 다.
  `inviter` 는 초대자를 찾지 못하면 `null` 이고, `avatarUrl` 은 소셜 이미지가 없으면 `null` 이다.
- 프론트 흐름: `frontend/src/actions/invitation/get-invitation-info-action.ts` → `frontend/src/services/invitation/invitation-service.ts` 의 `getInvitationInfo` → `InvitationInfoData` 반환.
- 삭제 흐름: `frontend/src/actions/invitation/delete-invitation-action.ts` 가 `getActiveInvitations(familyUuid)` 를 불러 `some()` 으로 소유를 확인한다. ADR-F04 상 Action 은 인증, Zod, revalidatePath 만 맡는다.

**근거 문서**: `frontend/docs/flow.md` 의 「2. 가족 초대 플로우」, `frontend/docs/data-schema.md` 의 「Invitation」, `frontend/docs/adr.md` 의 ADR-F04, ADR-F25

## 의도 메모

- `InvitationInfoData` 에 백엔드 모양(`inviter` 객체)을 그대로 넘기지 않고 화면이 쓰는 평평한 값으로 바꾼다. 화면이 백엔드 응답 모양에 묶이지 않게 하려는 것이다.
- 소유 확인 helper 는 기존 동작을 그대로 옮긴다. 선택 가족의 활성 초대 목록에 없으면 `ActionError.entityNotFound("초대 링크", invitationUuid)` 를 던진다.
- `getInvitationInfo` 의 무효 분기(만료, 취소, 사용됨)는 바꾸지 않는다.

## 작업 항목

### 1. `frontend/src/types/invitation.ts`

`InvitationResponse` 에 선택 필드 두 개를 더한다.

- `inviter?: { name: string; avatarUrl: string | null } | null;`
- `memberCount?: number | null;`

### 2. `frontend/src/services/invitation/invitation-service.ts`

- `InvitationInfoData` 에 선택 필드를 더한다: `inviterName?: string`, `inviterAvatarUrl?: string | null`, `memberCount?: number`.
- `getInvitationInfo` 의 유효 분기 반환값에 매핑을 더한다.
  - `inviterName`: `invitation.inviter?.name` 이 비어 있지 않은 문자열일 때만 넣는다
  - `inviterAvatarUrl`: `invitation.inviter?.avatarUrl ?? null`
  - `memberCount`: 숫자일 때만 넣는다
- `export async function assertInvitationOwnership(familyUuid: string, invitationUuid: string): Promise<void>` 를 신설한다.
  `getActiveInvitations(familyUuid)` 결과에 `invitationUuid` 가 없으면 `ActionError.entityNotFound("초대 링크", invitationUuid)` 를 던진다.

### 3. `frontend/src/actions/invitation/delete-invitation-action.ts`

`getActiveInvitations` 호출과 `some()` 검사를 `await assertInvitationOwnership(familyUuid, invitationUuid);` 한 줄로 바꾼다.
import 에서 `getActiveInvitations` 를 빼고 `assertInvitationOwnership` 을 더한다. ADR-F25 패턴 C 주석은 유지한다.

### 4. 테스트 `frontend/src/__tests__/services/invitation/invitation-service.test.ts` (신규)

`@jest-environment node`. `frontend/src/__tests__/services/dashboard/` 의 mock 방식(`@/lib/env/server.env`, `@/lib/server/auth/auth`, `@/lib/server/api/client`)을 따른다.
`serverEnv` mock 에는 `BACKEND_API_URL` 과 `AUTH_URL` 을 둔다.

- `getInvitationInfo`: `serverApiClient` 가 `inviter: { name: "홍길동", avatarUrl: "https://img" }`, `memberCount: 2` 인 PENDING 초대를 돌려주면 `inviterName`, `inviterAvatarUrl`, `memberCount` 가 채워진다
- `getInvitationInfo`: `inviter: null`, `memberCount` 없음이면 세 필드가 `undefined` 또는 `null` 이고 `valid: true` 다
- `assertInvitationOwnership`: `serverApiGet` 이 해당 uuid 를 담은 목록을 돌려주면 resolve 한다
- `assertInvitationOwnership`: 목록에 없으면 `ActionError` (code `C002`) 로 reject 한다

### 5. 테스트 `frontend/src/__tests__/actions/invitation/delete-invitation-action.test.ts` (신규)

`frontend/src/__tests__/actions/invitation/accept-invitation-action.test.ts` 의 mock 방식을 따른다.

- 소유 확인이 통과하면 `deleteInvitation` 과 `revalidatePath("/")` 를 부르고 `success: true` 다
- `assertInvitationOwnership` 이 `ActionError.entityNotFound` 를 던지면 `success: false` 이고 `deleteInvitation` 을 부르지 않는다
- 선택 가족이 없으면 `success: false` 이고 `assertInvitationOwnership` 을 부르지 않는다

## 검증

```bash
cd frontend
pnpm exec jest src/__tests__/services/invitation/invitation-service.test.ts src/__tests__/actions/invitation/delete-invitation-action.test.ts
pnpm lint && pnpm exec tsc --noEmit && pnpm test
```

기대: 새 테스트 7건이 통과하고 전체 테스트가 통과한다.
`grep -n "getActiveInvitations" frontend/src/actions/invitation/delete-invitation-action.ts` 가 아무것도 내지 않는다.

## 변경 파일

| 파일 | 변경 |
|---|---|
| `frontend/src/types/invitation.ts` | 수정 |
| `frontend/src/services/invitation/invitation-service.ts` | 수정 |
| `frontend/src/actions/invitation/delete-invitation-action.ts` | 수정 |
| `frontend/src/__tests__/services/invitation/invitation-service.test.ts` | 신규 |
| `frontend/src/__tests__/actions/invitation/delete-invitation-action.test.ts` | 신규 |
