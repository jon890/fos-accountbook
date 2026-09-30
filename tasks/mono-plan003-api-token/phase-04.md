# Phase 04. 설정 화면 외부 연동 카드

**Execution profile**: standard
**Domain**: app-router

## 목표

설정 화면에 「외부 연동」 카드를 더해 사용자가 연동 토큰을 발급하고, 원문을 한 번 복사하고, 폐기할 수 있게 한다.

**범위 외**: Server Action 과 service 는 phase 03 이 만들었다. 백엔드는 바꾸지 않는다.

## 컨텍스트

- 서버 페이지 `frontend/src/app/(authenticated)/settings/page.tsx` 가 프로필과 가족을 조회해 `SettingsPageClient` 에 넘긴다.
- `frontend/src/app/(authenticated)/settings/_components/SettingsPageClient.tsx` 는 `frontend/src/components/layout/SettingsCard.tsx` 의 `SettingsCard`(`icon`, `title`, `subtitle?`, `children`, `className?`)로 카드를 그리고 `grid gap-4 md:grid-cols-2` 안에 둔다. 마지막 카드가 「내 가족 목록」 이다.
- phase 03 이 만든 것: `frontend/src/types/api-token.ts` 의 `ApiToken`, `CreatedApiToken`, `frontend/src/actions/user/` 의 `getApiTokensAction`, `createApiTokenAction`, `revokeApiTokenAction`.
- UI 부품: `frontend/src/components/ui/` 의 `dialog.tsx`, `alert-dialog.tsx`, `input.tsx`, `label.tsx`, `button.tsx`. native 태그를 쓰지 않는다 (common-pitfalls CODE-5).
- 기존 Dialog 컴포넌트 선례: `frontend/src/components/settings/BudgetEditDialog.tsx`, 토스트는 `sonner` 의 `toast`.
- 날짜 표시는 `date-fns` 의 `format` 과 `ko` 로케일을 쓴다 (`InvitePageClient.tsx` 선례).

**근거 문서**: `frontend/docs/flow.md` 의 「15. /settings 페이지 구조」 의 「외부 연동 카드」

## 의도 메모

- 원문은 발급 직후 같은 Dialog 안에서만 보인다. Dialog 를 닫으면 state 에서 지운다.
- 목록 조회가 실패해도 설정 화면 전체를 막지 않는다. 카드에 「연동 토큰을 불러오지 못했어요」 를 보이고 나머지 카드는 그대로다.
- 색은 기존 토큰만 쓴다. 새 색이나 arbitrary 값을 만들지 않는다.
- 복사는 `navigator.clipboard.writeText` 를 쓰고 성공하면 `toast.success("복사했어요")`.

## 작업 항목

### 1. `frontend/src/app/(authenticated)/settings/page.tsx`

`getApiTokensAction()` 을 함께 부른다. 성공이면 `apiTokens={result.data}`, 실패면 `apiTokens={null}` 을 `SettingsPageClient` 에 넘긴다. 이 조회에는 `requireActionSuccess` 를 쓰지 않는다.

### 2. `frontend/src/components/settings/ApiTokenSettingsCard.tsx` (신규, `"use client"`)

props: `initialTokens: ApiToken[] | null`.

- 카드 본문만 그린다. 제목, 부제, 아이콘이 있는 카드 틀은 `SettingsPageClient` 가 그린다(작업 항목 3).
- `initialTokens` 가 null 이면 「연동 토큰을 불러오지 못했어요」.
- 목록 행: 이름, `tokenPrefix` 뒤에 「…」 를 붙인 값, 「발급 {yyyy.MM.dd}」, 「마지막 사용 {yyyy.MM.dd HH:mm}」 또는 「사용 기록 없음」, 「폐기」 버튼. 비었으면 「아직 발급한 토큰이 없어요」.
- 「토큰 발급」 버튼 → `Dialog`: 이름 `Input`(최대 50자)과 「발급」 버튼. `createApiTokenAction` 성공 시 같은 Dialog 가 원문, 「복사」 버튼, 「이 창을 닫으면 토큰을 다시 볼 수 없어요」 를 보이고 목록 state 에 새 토큰을 앞에 더한다. 실패 시 `toast.error(result.error.message)`.
- 「폐기」 → `AlertDialog` 「{이름} 토큰을 폐기할까요? 이 토큰을 쓰는 연동이 바로 끊겨요」 → `revokeApiTokenAction` 성공 시 목록 state 에서 뺀다.

### 3. `frontend/src/app/(authenticated)/settings/_components/SettingsPageClient.tsx`

props 에 `apiTokens: ApiToken[] | null` 을 더하고, 「내 가족 목록」 카드 다음에 `SettingsCard` 를 두고 그 안에 `<ApiTokenSettingsCard initialTokens={apiTokens} />` 를 둔다. `SettingsCard` 의 props 는 `icon={KeyRound}`, `title="외부 연동"`, `subtitle="fos-assistant 같은 에이전트가 가계부를 기록할 때 쓰는 토큰이에요"`, `className="md:col-span-2"` 다. `KeyRound` 는 `lucide-react` 에서 가져온다. 작업 항목 2 의 컴포넌트는 제목과 부제를 다시 그리지 않고 본문만 그린다.

### 4. 테스트 `frontend/src/__tests__/components/settings/ApiTokenSettingsCard.test.tsx` (신규)

`@jest-environment jsdom`. `SettingsPageClient.test.tsx` 의 mock 방식을 따르고 `@/actions/user/create-api-token-action`, `@/actions/user/revoke-api-token-action`, `sonner` 를 mock 한다.

- 목록: 토큰 하나(`lastUsedAt: null`)면 이름, `fab_abcd1234…`, 「사용 기록 없음」 이 보인다
- null: 「연동 토큰을 불러오지 못했어요」
- 발급: 이름 입력 후 「발급」 → `createApiTokenAction` 이 그 이름으로 불리고 원문과 「이 창을 닫으면 토큰을 다시 볼 수 없어요」 가 보인다
- 폐기: 「폐기」 → 확인 → `revokeApiTokenAction` 이 그 uuid 로 불리고 행이 사라진다

### 5. `frontend/src/__tests__/components/settings/SettingsPageClient.test.tsx`

새 필수 prop `apiTokens` 를 기존 렌더 호출마다 `apiTokens={[]}` 로 넘긴다. 기존 단언은 바꾸지 않는다. `@/actions/user/create-api-token-action`, `@/actions/user/revoke-api-token-action` 를 mock 에 더한다.

## 검증

```bash
# cwd: frontend
pnpm exec jest src/__tests__/components/settings/ApiTokenSettingsCard.test.tsx src/__tests__/components/settings/SettingsPageClient.test.tsx
pnpm lint && pnpm lint:md && pnpm exec tsc --noEmit && pnpm test
# server.env 는 import 때 필수 환경값을 검증한다. Dockerfile 과 같이 검증을 건너뛰고 빌드한다
SKIP_ENV_VALIDATION=true pnpm build
```

기대: 새 테스트 4건과 전체 테스트가 통과하고 빌드가 성공한다.

## 변경 파일

| 파일 | 변경 |
|---|---|
| `frontend/src/app/(authenticated)/settings/page.tsx` | 수정 |
| `frontend/src/components/settings/ApiTokenSettingsCard.tsx` | 신규 |
| `frontend/src/app/(authenticated)/settings/_components/SettingsPageClient.tsx` | 수정 |
| `frontend/src/__tests__/components/settings/ApiTokenSettingsCard.test.tsx` | 신규 |
| `frontend/src/__tests__/components/settings/SettingsPageClient.test.tsx` | 수정 |
