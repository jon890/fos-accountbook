# Phase 01. 공용 카드, 다이얼로그, 빈 상태의 모바일 여백

**Execution profile**: standard
**Domain**: color-token

## 목표

`Card` 가 여백을 갖지 않고 카드 부품이 반응형 여백을 갖게 한다. 다이얼로그와 빈 상태도 모바일에서 여백을 줄인다.
이 기본값을 바꾸면서 `CardHeader` 를 쓰는 화면이 위로 붙지 않게 함께 맞춘다.

**범위 외**: 화면이 다시 쌓은 바깥 여백은 phase 02, 화면별 간격은 phase 03 이다.

## 컨텍스트

모든 경로는 저장소 root 기준이다. 명령은 `frontend/` 에서 돌린다.

**근거 문서**: `frontend/docs/adr/ADR-F35-mobile-spacing.md`, `frontend/docs/adr/ADR-F34-browser-tests-fake-backend.md`, `frontend/docs/testing-strategy.md` 의 「6. 브라우저 테스트」 절.

코드에서 확인한 사실:

- `frontend/src/components/ui/card.tsx`
  - `Card`: `bg-card text-card-foreground flex flex-col gap-6 rounded-xl border py-6 shadow-sm`.
  - `CardHeader`: `... gap-1.5 px-6 ... [.border-b]:pb-6`. `CardContent`: `px-6`. `CardFooter`: `flex items-center px-6 [.border-t]:pt-6`.
- `Card` 사용처 13개 파일 중 `Card` 자체의 `py` 를 덮어쓰는 곳이 없다. 대부분 `CardContent` 에 `p-4`, `p-3 md:p-6`, `py-8` 같은 여백을 직접 준다(`grep -rn "<Card[ >]" frontend/src`).
- `CardHeader` 를 쓰는 화면은 넷이다.
  - `frontend/src/components/auth/AuthCenterCard.tsx`: `CardHeader className="text-center pt-8 pb-4"`, `CardContent className="space-y-4"`.
  - `frontend/src/app/(authenticated)/invite/[token]/_components/InvitePageClient.tsx`: `CardHeader className="text-center pb-4 pt-8"`, `CardContent className="space-y-6"`.
  - `frontend/src/app/(authenticated)/families/create/page.tsx`: `CardHeader className="text-center pt-8 pb-4"`, `CardContent`(클래스 없음).
  - `frontend/src/app/(authenticated)/budget/_components/BudgetClient.tsx` 186-213행: `CardHeader className="pb-1 p-4"`(tailwind-merge 가 뒤의 `p-4` 를 남겨 `pb-1` 이 사라진다), `CardContent className="p-4 pt-0"`.
- `CardContent` 에 위아래 여백이 없는 사용처: `frontend/src/app/(authenticated)/categories/_components/CategoryItem.tsx` 의 `CardContent className="px-2 md:p-4"`. `Card` 의 `py-6` 이 사라지면 모바일 위아래가 0 이 된다.
- 부품 없이 내용을 바로 넣는 카드: `frontend/src/components/categories/CategoriesHero.tsx`, `frontend/src/components/settings/SettingsHero.tsx`(안쪽 `div p-5 md:p-6`).
- `frontend/src/components/ui/dialog.tsx` 의 `DialogContent`: `... max-w-[calc(100%-2rem)] ... p-6 ... sm:max-w-lg`.
- `frontend/src/components/ui/alert-dialog.tsx` 의 `AlertDialogContent`: `... w-full max-w-lg ... p-6 ... sm:rounded-lg`. 모바일에서 화면 끝에 붙고 모서리가 각진다.
- `frontend/src/components/empty/EmptyState.tsx`: 바깥 `px-6 pt-13 pb-10`, 아이콘 원 `size-24 ... mb-5`, 아이콘 `size-12`, 버튼 `mb-6`.
- 브라우저 테스트: `frontend/browser/` 에 Playwright 설정, 가짜 백엔드(`fake-backend.mjs`, `/api/v1/families`, 카테고리, 알림, 읽지 않은 수만 응답), `fixtures.ts`(세션 쿠키), `categories.spec.ts`, `notifications.spec.ts` 가 있다. project 는 `mobile`(390×844)과 `desktop`(1280×900)이다.

## 의도 메모

- `Card` 에 부품 기본 여백을 넣을 때 기존 사용처의 클래스가 tailwind-merge 로 덮어쓰는지 확인한다. 예: `CardContent className="p-4"` 는 새 기본값을 덮어 그대로 16px 다.
- 데스크톱에서 카드 위아래가 달라진다. 기존에는 `Card py-6` 과 `CardContent` 여백이 합쳐졌고, 이제 `CardContent` 여백만 남는다. ADR-F35 가 받아들인 변화다.
- 스크린샷 비교를 쓰지 않는다. 계산된 스타일과 `boundingBox()` 로 단언한다(ADR-F34).

## 작업 항목

### 1. `card.tsx` 의 기본 여백

- `Card`: `py-6 gap-6` 을 빼고 `py-0 gap-0` 상당으로 둔다.
- `CardHeader`: `px-4 pt-4 md:px-6 md:pt-6`. `[.border-b]` 규칙은 `pb-4 md:pb-6` 으로.
- `CardContent`: `p-4 md:p-6`. `CardHeader` 와 함께 쓰면 헤더 아래에 바로 붙도록 기존 사용처가 `pt-0` 을 줄 수 있다.
- `CardFooter`: `px-4 pb-4 md:px-6 md:pb-6`, `[.border-t]:pt-4 md:[.border-t]:pt-6`.

### 2. `CardHeader` 를 쓰는 네 화면과 위아래 여백이 없는 `CategoryItem` 맞추기

- `AuthCenterCard`, `InvitePageClient`, `families/create/page.tsx`: 헤더 `pt-8` 을 `pt-6 md:pt-8` 로, 헤더와 본문 사이가 두 배가 되지 않게 `CardContent` 에 `pt-0 md:pt-0` 을 준다.
- `BudgetClient` 의 두 요약 카드: `CardHeader className="p-4 pb-1 md:p-4 md:pb-1"`, `CardContent className="p-4 pt-0 md:p-4 md:pt-0"`로 breakpoint까지 명시한다.
- `CategoryItem`: `CardContent className="p-3 md:p-4"`.

### 3. 다이얼로그 두 종류

- `DialogContent`: `p-6` 을 `p-4 sm:p-6`.
- `AlertDialogContent`: `max-w-[calc(100%-2rem)] rounded-lg p-4 sm:max-w-lg sm:p-6`. 기존 `max-w-lg` 과 `sm:rounded-lg` 는 이 값으로 바꾼다.

### 4. `EmptyState`

- 바깥: `px-4 pt-8 pb-6 md:px-6 md:pt-13 md:pb-10`.
- 아이콘 원: `size-16 md:size-24`, 아이콘: `size-8 md:size-12`.

### 5. 이 phase 를 검증하는 브라우저 테스트 `frontend/browser/mobile-spacing.spec.ts`

- `/categories` 에서 `[data-slot="card"]` 첫 요소의 계산된 `padding-top` 이 `0px` 이다(두 project 모두).
- `/categories` 에서 첫 카테고리 항목(`CategoryItem` 의 `[data-slot="card-content"]`)의 `padding-top` 이 `mobile` 에서 `12px`, `desktop` 에서 `16px` 이다.
- 가짜 백엔드가 모르는 경로를 받으면 fixture 가 실패시키므로, 이 spec 이 새 application API 경로를 부르지 않는지 확인한다.

### 6. 계획 검토 반영

- 테스트 기대값: Dialog padding은 mobile 16px, desktop 24px이다. AlertDialog는 mobile padding 16px, 실제 폭 358px, radius 16px(기존 rounded-lg 토큰)이며 desktop padding 24px, max-width 512px이다.
- EmptyState는 mobile 좌우 16px, 위 32px, 아래 24px, 원 64px, 아이콘 32px이며 desktop 좌우 24px, 위 52px, 아래 40px, 원 96px, 아이콘 48px이다.

- 기본값의 `md:p-6`은 비반응형 부분 여백보다 우선한다. 본문 위 여백을 없애는 네 화면은 `pt-0 md:pt-0`을 쓴다. Budget 헤더와 본문은 데스크톱도 16px을 유지하도록 헤더 `p-4 pb-1 md:p-4 md:pb-1`, 본문 `p-4 pt-0 md:p-4 md:pt-0`을 쓴다.
- `CategoryExpenseSummary`의 본문은 `md:pt-0`, `FamilySelector` 오류 카드와 `transactions/page.tsx`의 `py-8`, `py-12`는 같은 `md:py-*`를 명시해 기존 의도를 유지한다.
- 브라우저 테스트는 카테고리 추가 Dialog와 삭제 AlertDialog의 폭별 여백, 모바일 폭과 둥근 모서리도 확인한다. 가짜 백엔드에 테스트 전용 빈 카테고리 설정을 추가해 `EmptyState`의 폭별 여백과 아이콘 크기를 확인한다. `POST /__test/categories`에 `{empty: true}`를 보내 빈 목록을 설정하고 기존 reset에서 설정을 초기화한다.

## 검증

`frontend/` 에서 실행한다.

```bash
pnpm install --frozen-lockfile
pnpm exec playwright install chromium
pnpm tsc --noEmit && pnpm lint && pnpm lint:md && pnpm test
pnpm test:browser browser/mobile-spacing.spec.ts
pnpm test:browser
```

기대값: 모든 명령이 성공한다. `pnpm test:browser` 는 기존 8건과 새 spec 을 두 project 에서 모두 통과한다.

## 변경 파일

| 파일 | 변경 |
|---|---|
| `frontend/src/components/ui/card.tsx` | 수정 |
| `frontend/src/components/ui/dialog.tsx` | 수정 |
| `frontend/src/components/ui/alert-dialog.tsx` | 수정 |
| `frontend/src/components/empty/EmptyState.tsx` | 수정 |
| `frontend/src/components/auth/AuthCenterCard.tsx` | 수정 |
| `frontend/src/app/(authenticated)/invite/[token]/_components/InvitePageClient.tsx` | 수정 |
| `frontend/src/app/(authenticated)/families/create/page.tsx` | 수정 |
| `frontend/src/app/(authenticated)/budget/_components/BudgetClient.tsx` | 수정 |
| `frontend/src/app/(authenticated)/categories/_components/CategoryItem.tsx` | 수정 |
| `frontend/browser/mobile-spacing.spec.ts` | 신규 |
| `frontend/src/components/expenses/summary/CategoryExpenseSummary.tsx` | 수정 |
| `frontend/src/components/families/FamilySelector.tsx` | 수정 |
| `frontend/src/app/(authenticated)/transactions/page.tsx` | 수정 |
| `frontend/browser/fake-backend.mjs` | 수정 |
