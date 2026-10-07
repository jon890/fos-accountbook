# Phase 01. @shadcn/lint 도입과 클래스 버그 수정

**Execution profile**: standard
**Domain**: color-token

## 목표

`@shadcn/lint` 를 `pnpm lint` 에 넣고 `shadcn/no-unknown-classes`, `shadcn/no-raw-colors` 를 `error` 로 켠다.
두 규칙의 위반을 0건으로 만든다. 그 과정에서 CSS 가 생성되지 않던 애니메이션 클래스와 숫자 폰트 클래스를 고친다.

**범위 외**: `shadcn/require-static-classes` 는 phase 02 가 켠다. `no-restyle`, `no-arbitrary-values`, `no-inline-styles` 는 이 계획에서 켜지 않는다(ADR-F43 의 정리 순서 3번 이후).

## 컨텍스트

**근거 문서**: `frontend/docs/adr/ADR-F43-design-lint-ratchet.md` 가 도입 방식과 규칙을 켜는 원칙을 정한다. 숫자 폰트는 `frontend/docs/adr/ADR-F14-pretendard-variable-font.md` 의 `.num` 이 맡는다.
- `frontend/eslint.config.mjs` 는 flat config 배열이다. `eslint-config-next` 두 세트 뒤에 `src/**` 대상 `no-restricted-imports` 블록이 있다. 새 블록은 그 뒤에 더한다.
- `frontend/components.json` 의 `tailwind.css` 가 `src/app/globals.css` 를 가리킨다. 플러그인이 이 파일에서 테마와 컴포넌트 위치를 스스로 찾으므로 `settings.shadcn` 은 두지 않는다.
- `tw-animate-css` 는 `frontend/package.json` 에 이미 있지만 `src/app/globals.css` 가 가져오지 않는다. `src/components/ui/` 의 dialog, sheet, popover, select, dropdown-menu 가 쓰는 `animate-in`, `fade-in-0`, `zoom-in-95`, `slide-in-from-*` 클래스에 CSS 가 없다.
- `font-num` 은 Tailwind 클래스가 아니다. `--font-num` 은 `src/app/layout.tsx` 의 next/font 변수이고 `@theme` 토큰이 아니다. `src/app/globals.css` 의 `.num` 규칙이 `font-family: var(--font-num)` 과 `tabular-nums` 를 함께 준다.
- 2026-10-07 측정에서 `no-unknown-classes` 위반 중 아래 3개는 CSS 가 아니라 선택자 표시용 이름이다. 클래스를 고치지 않고 규칙의 `allow` 로 허용한다.
  - `day-range-end`, `day-outside`: `src/components/ui/calendar.tsx` 가 `[&:has([aria-selected].day-range-end)]` 같은 선택자로 찾는다
  - `toaster`: `src/components/ui/sonner.tsx` 의 sonner 기본 클래스
- `no-raw-colors` 위반 4건은 모두 `src/components/auth/GoogleIcon.tsx` 의 `fill` hex 다. Google 로그인 버튼의 로고는 브랜드 가이드상 원래 색을 써야 하므로 파일 단위로 규칙을 끈다.

## 의도 메모

- 예외를 `eslint-disable` 주석으로 만들지 않는다. 설정 파일에 이유 주석과 함께 둔다(ADR-F43).
- 버전은 `0.2.0` 으로 정확히 고정한다. `^` 를 붙이지 않는다. 0.x 라 minor 에서 규칙 동작이 바뀐다.
- `font-num` 을 `@theme` 토큰으로 만드는 방법은 쓰지 않는다. `.num` 이 이미 ADR-F14 의 수치 표기 유틸리티다.

## Blocked 조건

- `pnpm add` 가 `@shadcn/lint@0.2.0` 을 받지 못하면 `PHASE_BLOCKED: @shadcn/lint 설치 실패` 를 출력하고 끝낸다.

## 작업 항목

### 1. 패키지 설치

`cd frontend && pnpm add -D -E @shadcn/lint@0.2.0` 를 실행한다. `frontend/package.json` 의 `devDependencies` 에 `"@shadcn/lint": "0.2.0"` 이 들어가고 `frontend/pnpm-lock.yaml` 이 바뀐다.

### 2. `frontend/src/app/globals.css` 와 클래스 수정

- `@import "tailwindcss";` 바로 다음 줄에 `@import "tw-animate-css";` 를 더한다.
- `font-num` 클래스를 쓰는 아래 12곳을 `num` 으로 바꾼다. 같은 className 에 `tabular-nums` 가 함께 있으면 지운다. `.num` 이 같은 속성을 준다.
  - `frontend/src/app/(authenticated)/budget/_components/BudgetItemDialog.tsx` 1곳
  - `frontend/src/app/(authenticated)/settings/_components/SettingsPageClient.tsx` 2곳
  - `frontend/src/components/categories/CategoriesHero.tsx` 1곳
  - `frontend/src/components/installment/InstallmentDialog.tsx` 2곳
  - `frontend/src/components/installment/InstallmentItem.tsx` 1곳
  - `frontend/src/components/settings/ApiTokenSettingsCard.tsx` 3곳
  - `frontend/src/components/settings/BudgetEditDialog.tsx` 1곳
  - `frontend/src/components/settings/SettingsHero.tsx` 1곳
  - `frontend/src/app/layout.tsx` 의 `variable: "--font-num"` 은 next/font 변수 이름이라 바꾸지 않는다
- `frontend/src/components/landing/LandingPage.tsx` 의 하단 CTA `div` className 맨 앞의 `0` 을 지운다. 잘못 들어간 글자다.

### 3. `frontend/eslint.config.mjs` 에 플러그인 블록 추가

기존 `no-restricted-imports` 블록 뒤에 두 블록을 더한다.

- `import { plugin as shadcn } from "@shadcn/lint";` 를 파일 위에 더한다.
- 첫 블록: `files: ["src/**/*.{ts,tsx}"]`, `ignores: ["src/__tests__/**"]`, `plugins: { shadcn }`.
  - `"shadcn/no-unknown-classes": ["error", { allow: ["day-range-end", "day-outside", "toaster"] }]`. 위 세 이름이 선택자 표시용이라는 주석을 단다
  - `"shadcn/no-raw-colors": "error"`
- 둘째 블록: `files: ["src/components/auth/GoogleIcon.tsx"]`, `rules: { "shadcn/no-raw-colors": "off" }`. Google 로고는 브랜드 가이드상 원래 색을 쓴다는 주석을 단다.
- 위에 ADR-F43 을 가리키는 주석 한 줄을 둔다.

### 4. 설정이 동작하는지 확인하는 `frontend/src/__tests__/lint/design-lint.test.ts`

파일 첫 줄에 `/** @jest-environment node */` 를 둔다.
`child_process.spawnSync("pnpm", ["exec", "eslint", "--stdin", "--stdin-filename", "src/components/__design-lint-probe__.tsx", "--format", "json"], { input, encoding: "utf8" })` 로 아래 소스를 lint 한다.
결과 JSON 의 `messages` 에서 `ruleId` 가 `shadcn/` 로 시작하는 것만 줄 번호로 모아 단언한다. 한 번만 실행하고 `jest.setTimeout` 대신 테스트 인자로 60초 제한을 준다.

| 줄 | 소스 | 기대 |
| --- | --- | --- |
| 1 | `export const A = () => <div className="bg-red-500" />;` | `shadcn/no-raw-colors` |
| 2 | `export const B = () => <div className="animate-in fade-in-0" />;` | `shadcn/*` 없음. `tw-animate-css` import 회귀 확인 |
| 3 | `export const C = () => <div className="font-num" />;` | `shadcn/no-unknown-classes` |
| 4 | `export const D = () => <div className="bg-bg text-fg num" />;` | `shadcn/*` 없음 |

## 검증

```bash
cd frontend && pnpm test -- src/__tests__/lint
cd frontend && pnpm tsc --noEmit && pnpm lint && pnpm lint:md && pnpm test
cd frontend && pnpm test:browser
! git grep -n "font-num" -- 'frontend/src/**/*.tsx' ':!frontend/src/app/layout.tsx'
cd frontend && grep -n '"@shadcn/lint": "0.2.0"' package.json
cd frontend && time pnpm lint
```

- 첫 줄은 4개 줄의 기대가 모두 맞아야 통과한다.
- `pnpm lint` 는 종료 코드 0 이어야 한다. 마지막 줄의 실행 시간을 PR 본문에 적는다.
- `pnpm test:browser` 는 다이얼로그 애니메이션이 살아나도 기존 테스트가 통과하는지 본다.

## 변경 파일

| 파일 | 변경 |
|---|---|
| `frontend/package.json` | 수정 |
| `frontend/pnpm-lock.yaml` | 수정 |
| `frontend/eslint.config.mjs` | 수정 |
| `frontend/src/app/globals.css` | 수정 |
| `frontend/src/app/(authenticated)/budget/_components/BudgetItemDialog.tsx` | 수정 |
| `frontend/src/app/(authenticated)/settings/_components/SettingsPageClient.tsx` | 수정 |
| `frontend/src/components/categories/CategoriesHero.tsx` | 수정 |
| `frontend/src/components/installment/InstallmentDialog.tsx` | 수정 |
| `frontend/src/components/installment/InstallmentItem.tsx` | 수정 |
| `frontend/src/components/settings/ApiTokenSettingsCard.tsx` | 수정 |
| `frontend/src/components/settings/BudgetEditDialog.tsx` | 수정 |
| `frontend/src/components/settings/SettingsHero.tsx` | 수정 |
| `frontend/src/components/landing/LandingPage.tsx` | 수정 |
| `frontend/src/__tests__/lint/design-lint.test.ts` | 신규 |
