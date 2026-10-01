# Phase 01. 다크 토큰 보강과 다크 브라우저 단언

**Execution profile**: standard
**Domain**: color-token

## 목표

라이트 전용 값을 가진 토큰을 다크 블록에서 다시 정의해, 그 토큰을 쓰는 화면이 다크에서 흰 판이나 옅은 판으로 뜨지 않게 한다.
토스트가 실제 적용된 테마를 따르게 한다.

**범위 외**: 화면 코드의 팔레트 클래스 제거는 phase 02, 개별 화면 정리는 phase 03, 테마 선택은 phase 04 다. `dialog.tsx`, `sheet.tsx` 의 `bg-white` 는 등록 화면 정리 PR 이 고친다.

## 컨텍스트

모든 경로는 저장소 root 기준이다. 명령은 `frontend/` 에서 돌린다.

**근거 문서**: `frontend/docs/adr/ADR-F38-dark-mode-tokens-and-theme-choice.md`, `frontend/docs/adr/ADR-F13-oklch-color-system.md`, `frontend/docs/adr/ADR-F15-data-theme-attribute.md`, `frontend/docs/adr/ADR-F34-browser-tests-fake-backend.md`.

코드에서 확인한 사실:

- `frontend/src/app/globals.css` 의 `@theme` 이 `--color-brand-tint`, `--color-brand-50` 부터 `--color-brand-900`, `--color-cat-{food|cafe|transit|telecom|home|shopping|health|leisure|education|etc}-{bg|fg}`, `--color-category-fallback-bg` 를 정의한다. `[data-theme="dark"]` 블록은 member, 표면(`bg`, `fg`, `border` 계열), shadcn 변수만 다시 정의한다.
- Tailwind v4 유틸리티는 `var(--color-brand-50)` 처럼 변수를 읽으므로 다크 블록에서 변수를 다시 정의하면 `bg-brand-50` 이 따라 바뀐다.
- 같은 파일 `@layer components` 의 `.app-background`, `.glass`, `.gradient-{primary|expense|income|budget|family|category|blue-purple|emerald-green|purple-indigo}` 는 oklch 값을 직접 쓰고 다크 변형이 없다. `.hero-fade` 는 `--color-brand-tint` 와 `--color-bg` 를 쓴다.
- 사용처: `bg-brand-50` 16개 파일(설정 선택 행 `SettingsPageClient.tsx`, `SettingsCard.tsx` 아이콘, 알림 `NotificationItem.tsx` 안읽음 `bg-brand-50/50`, 필터 칩 `FilterChips.tsx` 등), `cat-*-bg` 는 `frontend/src/components/expenses/forms/CategoryGrid.tsx`.
- `frontend/src/components/ui/sonner.tsx` 가 `useTheme()` 의 `theme` 을 Sonner 에 넘긴다. `theme` 은 사용자가 고른 값이라 `"system"` 일 수 있다. 실제 적용된 값은 `resolvedTheme` 이다.
- 브라우저 테스트는 `frontend/browser/` 에 있고 `pnpm test:browser` 로 돈다. `ThemeProvider` 가 `defaultTheme="system"`, `enableSystem` 이라 Playwright 의 `colorScheme: "dark"` 로 다크가 된다.

## 의도 메모

다크 값은 아래를 출발점으로 쓴다. 화면을 띄워 보고 대비가 모자라면 L 값만 조정한다.

| 토큰 | 다크 값 |
|---|---|
| `brand-tint` | `oklch(0.205 0.030 257)` |
| `brand-50` | `oklch(0.255 0.045 257)` |
| `brand-100` | `oklch(0.300 0.065 257)` |
| `brand-200` | `oklch(0.380 0.095 257)` |
| `brand-700` | `oklch(0.800 0.110 257)` |
| `brand-800` | `oklch(0.860 0.080 257)` |
| `brand-900` | `oklch(0.920 0.045 257)` |
| `cat-*-bg` | `oklch(0.300 0.060 H)`, `etc` 는 `oklch(0.300 0.008 230)` |
| `cat-*-fg` | `oklch(0.800 0.110 H)`, `etc` 는 `oklch(0.760 0.015 230)` |
| `category-fallback-bg` | `oklch(0.720 0.130 250 / 0.18)` |

- `brand-300` 부터 `brand-600` 은 버튼과 강조색이라 바꾸지 않는다. `hover:bg-brand-600` 위 흰 글자 대비를 지키기 위해서다.
- 테마와 무관하게 흰 바탕 위 브랜드 글자로 쓸 `--color-brand-ink: oklch(0.470 0.165 257)` 을 `@theme` 에 더하고 다크에서 다시 정의하지 않는다. phase 02 의 랜딩 CTA 가 쓴다.
- 그라디언트 카드는 흰 글자를 얹으므로 다크에서 각 정지점의 L 을 0.08 낮춘다. `.app-background` 는 다크에서 `--color-bg` 와 `--color-brand-tint` 로 같은 방향의 그라디언트를 만든다. `.glass` 는 다크에서 `--color-bg-elev` 기반 반투명으로 바꾼다.

## 작업 항목

### 1. `globals.css` 다크 블록에 brand 옅은 단계와 글자 단계, `brand-ink` 추가

### 2. `globals.css` 다크 블록에 `cat-*-bg`, `cat-*-fg`, `category-fallback-bg` 추가

### 3. `globals.css` 의 `.app-background`, `.glass`, `.gradient-*` 다크 변형 추가

`[data-theme="dark"] .app-background` 처럼 같은 `@layer components` 안에 둔다.

### 4. `sonner.tsx` 가 `resolvedTheme` 을 넘기도록 수정과 단위 테스트

- `frontend/src/__tests__/components/ui/sonner.test.tsx`(신규): `next-themes` 의 `useTheme` 을 모킹해 `theme: "system"`, `resolvedTheme: "dark"` 일 때 Sonner 가 `dark` 테마로 렌더되는지 확인한다. Sonner 를 모킹해 받은 `theme` prop 을 단언해도 된다.

### 5. 다크 브라우저 테스트 `frontend/browser/dark-mode.spec.ts`(신규)

- `test.use({ colorScheme: "dark" })` 로 돌린다. `html` 의 `data-theme` 이 `dark` 인지 먼저 단언한다.
- 계산된 배경색의 밝기를 판정하는 helper 를 spec 안에 둔다. `getComputedStyle` 값이 `oklch(L ...)` 면 L 을, `rgb()` 면 상대 휘도를 쓴다. 다크에서 배경 밝기가 0.45 미만이어야 한다.
- 대상: `/notifications` 의 안읽음 알림 행, `/settings` 의 선택된 기본 가족 행과 카드 아이콘 바탕, `/categories` 의 카테고리 카드.
- 같은 대상을 `colorScheme: "light"` 에서도 돌려 밝기가 0.85 이상인지 확인해 라이트 회귀를 막는다.
- 가짜 백엔드가 모르는 경로(설정 화면의 프로필, API 토큰 조회 등)를 받으면 `frontend/browser/fake-backend.mjs` 에 더한다.
- 대상 요소는 보이는 글자로 찾고 `locator("xpath=ancestor::...")` 나 `closest` 로 배경을 가진 조상을 고른다. 이 phase 에서 컴포넌트에 `data-testid` 를 더하지 않는다.

## 검증

`frontend/` 에서 실행한다.

```bash
pnpm install --frozen-lockfile
pnpm exec playwright install chromium
pnpm tsc --noEmit && pnpm lint && pnpm lint:md && pnpm test
pnpm test src/__tests__/components/ui/sonner.test.tsx
pnpm test:browser browser/dark-mode.spec.ts
```

기대값: 모든 명령이 성공한다.

## 변경 파일

| 파일 | 변경 |
|---|---|
| `frontend/src/app/globals.css` | 수정 |
| `frontend/src/components/ui/sonner.tsx` | 수정 |
| `frontend/src/__tests__/components/ui/sonner.test.tsx` | 신규 |
| `frontend/browser/dark-mode.spec.ts` | 신규 |
| `frontend/browser/fake-backend.mjs` | 수정 |
