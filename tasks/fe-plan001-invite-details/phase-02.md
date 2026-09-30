# Phase 02. 초대 수락 화면에 초대자와 멤버 수 표시

**Execution profile**: standard
**Domain**: app-router

## 목표

`/invite/[token]` 화면이 초대한 사람과 가족의 현재 멤버 수를 보여 준다(#297).

**범위 외**: 데이터 매핑은 phase 01 이 끝냈다. 수락, 거절 동작과 만료 배지는 바꾸지 않는다.

## 컨텍스트

- phase 01 이 `InvitationInfoData` 에 `inviterName?: string`, `inviterAvatarUrl?: string | null`, `memberCount?: number` 를 더했다.
  정의는 `frontend/src/services/invitation/invitation-service.ts` 에 있다.
- 서버 페이지 `frontend/src/app/(authenticated)/invite/[token]/page.tsx` 가 `getInvitationInfoAction` 결과를 `InvitePageClient` 에 props 로 넘긴다.
- 화면 `frontend/src/app/(authenticated)/invite/[token]/_components/InvitePageClient.tsx` 는 96px `gradient-family` 원 안의 `Users` 아이콘, 「가족 초대」 제목, 설명 문구, 가족 이름과 만료 일시를 담은 정보 칸, 수락과 거절 버튼으로 되어 있다.
- 아바타는 `frontend/src/components/ui/avatar.tsx` 의 `Avatar`, `AvatarImage`, `AvatarFallback` 을 쓴다. `frontend/src/components/layout/Header.tsx` 가 같은 조합을 쓴다.

**근거 문서**: `frontend/docs/flow.md` 의 「2. 가족 초대 플로우」 수락자 부분

## 의도 메모

- 사용자와 정한 배치: 상단 설명을 초대자 이름으로 바꾸고, 정보 칸에 멤버 수 줄을 더한다. 초대자 줄은 정보 칸에 따로 두지 않는다.
- 값이 없을 때 지금 화면을 그대로 보인다. 초대자가 없으면 기존 설명과 `Users` 아이콘, 멤버 수가 없으면 멤버 줄을 숨긴다.
- 색은 기존 토큰(`text-fg`, `text-fg-muted`, `text-brand-500`, `bg-bg-muted`)만 쓴다. 새 색이나 arbitrary 값을 만들지 않는다.
- native 태그 대신 `components/ui` 를 쓴다 (common-pitfalls CODE-5).

## 작업 항목

### 1. `frontend/src/app/(authenticated)/invite/[token]/page.tsx`

`InvitePageClient` 에 `inviterName={result.data.inviterName}`, `inviterAvatarUrl={result.data.inviterAvatarUrl ?? null}`, `memberCount={result.data.memberCount}` 를 넘긴다.

### 2. `frontend/src/app/(authenticated)/invite/[token]/_components/InvitePageClient.tsx`

- props 에 `inviterName?: string`, `inviterAvatarUrl?: string | null`, `memberCount?: number` 를 더한다.
- 상단 원: `inviterName` 이 있으면 같은 96px 크기의 `Avatar` 를 그린다. `AvatarImage` 의 `src` 는 `inviterAvatarUrl ?? ""`, `alt` 는 `inviterName`, `AvatarFallback` 은 이름 첫 글자다. `inviterName` 이 없으면 지금의 `gradient-family` 원과 `Users` 아이콘을 그대로 둔다.
- 설명: `inviterName` 이 있으면 「{inviterName}님이 가계부를 함께 관리하자고 초대했어요」, 없으면 지금 문구 「가계부를 함께 관리하도록 초대받았어요」.
- 정보 칸: 가족 이름 줄과 만료 일시 줄 사이에 멤버 줄을 더한다. `memberCount` 가 숫자일 때만 그린다. 아이콘은 `lucide-react` 의 `UserRound`, 라벨 「멤버」, 값 「현재 {memberCount}명」. 기존 가족 이름 줄과 같은 클래스 구조를 쓴다.

### 3. 테스트 `frontend/src/__tests__/components/invite/InvitePageClient.test.tsx` (신규)

`@jest-environment jsdom`. `frontend/src/__tests__/components/settings/SettingsPageClient.test.tsx` 의 mock 방식을 따른다.
`next/navigation` 의 `useRouter`, `@/actions/invitation/accept-invitation-action`, `sonner` 를 mock 한다.

- `inviterName="홍길동"`, `memberCount={2}` 이면 「홍길동님이 가계부를 함께 관리하자고 초대했어요」 와 「현재 2명」 이 보인다
- 두 값이 없으면 「가계부를 함께 관리하도록 초대받았어요」 가 보이고 「멤버」 라벨이 없다
- `memberCount={0}` 이면 「현재 0명」 이 보인다 (0 을 없는 값으로 다루지 않는다)

## 검증

```bash
cd frontend
pnpm exec jest src/__tests__/components/invite/InvitePageClient.test.tsx
pnpm lint && pnpm exec tsc --noEmit && pnpm test && pnpm build
```

기대: 새 테스트 3건과 전체 테스트가 통과하고 빌드가 성공한다.

## 변경 파일

| 파일 | 변경 |
|---|---|
| `frontend/src/app/(authenticated)/invite/[token]/page.tsx` | 수정 |
| `frontend/src/app/(authenticated)/invite/[token]/_components/InvitePageClient.tsx` | 수정 |
| `frontend/src/__tests__/components/invite/InvitePageClient.test.tsx` | 신규 |
