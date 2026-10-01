# Phase 02. 화면 코드의 팔레트 클래스 제거와 재발 방지 테스트

**Execution profile**: fast
**Domain**: color-token

## 목표

화면 코드가 Tailwind 기본 팔레트(`gray-*`, `bg-white` 등) 대신 토큰을 쓰게 바꾸고, 팔레트를 다시 쓰면 `pnpm test` 가 실패하게 한다.

**범위 외**: `frontend/src/components/ui/dialog.tsx`, `frontend/src/components/ui/sheet.tsx`, `frontend/src/components/expenses/forms/ExpenseFilters.tsx` 는 등록 화면 정리 PR 이 고치거나 지운다.

## 컨텍스트

모든 경로는 저장소 root 기준이다. 명령은 `frontend/` 에서 돌린다.

**근거 문서**: `frontend/docs/adr/ADR-F38-dark-mode-tokens-and-theme-choice.md`, `frontend/docs/adr/ADR-F23-semantic-foreground-tokens.md`, `frontend/docs/code-architecture.md` 의 「디자인 토큰 / 테마」.

코드에서 확인한 사실(`grep -rnE '\b(bg|text|border|from|to)-(white|gray|blue|red|green)(-[0-9]+)?' frontend/src`):

- `frontend/src/components/expenses/summary/CategoryExpenseSummary.tsx` 10곳: `bg-white/80`, `hover:bg-gray-50/50`, `text-gray-900`, `bg-gray-100`, `from-gray-50 to-white`, `border-gray-100`, `bg-gray-200`, `text-gray-500`.
- `frontend/src/components/families/InviteFamilyDialog.tsx` 8곳: `text-gray-700`, `bg-gray-50`, `text-gray-500`, `text-green-600`, `text-red-600 hover:text-red-700 hover:bg-red-50`, `bg-blue-50`, `text-blue-900`.
- `frontend/src/app/(authenticated)/analytics/_components/AnalyticsClient.tsx` 226-244행 지출 TOP 5 카드 5곳.
- `frontend/src/components/common/PageError.tsx` 4곳, `PageLoadingSpinner.tsx` 2곳, `LoadingSpinner.tsx` 1곳.
- `frontend/src/components/ui/button.tsx` 16행 outline 변형의 `bg-white`.
- `frontend/src/components/landing/LandingPage.tsx` 127행 CTA 가 `bg-white text-brand-700` 이다. 브랜드 그라디언트 위의 흰 버튼이라 다크에서도 흰색이어야 한다.
- `frontend/src/components/auth/SignInForm.tsx` 27행 네이버 버튼 `bg-[#03C75A] text-white` 는 외부 브랜드 지침 색이다.
- `frontend/src/lib/client/utils.ts` 14행은 주석 예시다.

## 의도 메모

치환표다. 맞는 짝이 없으면 가장 가까운 의미의 토큰을 고른다.

| 팔레트 | 토큰 |
|---|---|
| `text-gray-900`, `text-gray-800`, `text-gray-700` | `text-fg` |
| `text-gray-600`, `text-gray-500` | `text-fg-muted` |
| `text-gray-400` | `text-fg-subtle` |
| `bg-gray-50`, `bg-gray-100`, `hover:bg-gray-50/50` | `bg-bg-muted`, `hover:bg-bg-muted` |
| `bg-gray-200` (진행 막대 바탕) | `bg-bg-muted` 또는 `bg-border` |
| `border-gray-50`, `border-gray-100` | `border-border` |
| `bg-white`, `bg-white/80`, `from-gray-50 to-white` | `bg-bg-elev` |
| `text-red-*`, `bg-red-50` | `text-expense`, `bg-expense/10` |
| `text-green-600` | `text-income` |
| `bg-blue-50`, `text-blue-900` | `bg-brand-50`, `text-brand-700` |

- 랜딩 CTA 는 `bg-neutral-0 text-brand-ink` 로 바꾼다. 두 토큰은 다크에서 바뀌지 않는다(phase 01).
- 네이버 버튼은 테스트 허용 목록에 둔다.

## 작업 항목

### 1. `CategoryExpenseSummary.tsx` 치환

### 2. `InviteFamilyDialog.tsx` 치환

### 3. `AnalyticsClient.tsx` TOP 5 카드, `PageError.tsx`, `PageLoadingSpinner.tsx`, `LoadingSpinner.tsx` 치환

### 4. `button.tsx` outline 의 `bg-white` 를 `bg-bg-elev` 로, `LandingPage.tsx` CTA 를 고정 토큰으로

### 5. 재발 방지 테스트 `frontend/src/__tests__/lib/no-raw-palette.test.ts`(신규)

- `@jest-environment node` 로 돌고 `frontend/src` 아래 `.ts`, `.tsx` 를 읽는다. `__tests__` 는 제외한다.
- 접두사(`bg|text|border|from|via|to|ring|fill|stroke|divide|outline|placeholder|shadow|decoration`) 뒤에 팔레트 이름(`white|black|slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose`)이 오는 클래스를 찾는다. `neutral` 은 숫자 단계가 붙은 Tailwind 팔레트만 해당하며 이 프로젝트의 `neutral-0` 부터 `neutral-950` 토큰과 이름이 같으므로 제외한다.
- 허용 목록은 파일과 클래스의 짝으로 둔다. `SignInForm.tsx` 의 `text-white`, `lib/client/utils.ts` 의 주석 예시다.
- 실패 메시지에 파일, 줄, 클래스를 낸다.

## Blocked 조건

`grep -n "bg-white" frontend/src/components/ui/dialog.tsx frontend/src/components/ui/sheet.tsx` 가 결과를 내거나 `frontend/src/components/expenses/forms/ExpenseFilters.tsx` 가 있으면 등록 화면 정리 PR 이 아직 main 에 없는 것이다. 이 phase 를 멈추고 `BLOCKED: 등록 화면 정리 PR 미반영` 을 회신한다.

## 검증

`frontend/` 에서 실행한다.

```bash
pnpm tsc --noEmit && pnpm lint && pnpm lint:md && pnpm test
pnpm test src/__tests__/lib/no-raw-palette.test.ts
pnpm test:browser
```

기대값: 모든 명령이 성공한다. `pnpm test` 에 `no-raw-palette` 테스트가 포함돼 통과한다.

## 변경 파일

| 파일 | 변경 |
|---|---|
| `frontend/src/components/expenses/summary/CategoryExpenseSummary.tsx` | 수정 |
| `frontend/src/components/families/InviteFamilyDialog.tsx` | 수정 |
| `frontend/src/app/(authenticated)/analytics/_components/AnalyticsClient.tsx` | 수정 |
| `frontend/src/components/common/PageError.tsx` | 수정 |
| `frontend/src/components/common/PageLoadingSpinner.tsx` | 수정 |
| `frontend/src/components/common/LoadingSpinner.tsx` | 수정 |
| `frontend/src/components/ui/button.tsx` | 수정 |
| `frontend/src/components/landing/LandingPage.tsx` | 수정 |
| `frontend/src/__tests__/lib/no-raw-palette.test.ts` | 신규 |
