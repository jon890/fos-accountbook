# Phase 03. 화면별 간격과 안쪽 여백을 반응형으로 맞춘다

**Execution profile**: fast
**Domain**: color-token

## 목표

모바일에서 섹션 간격과 카드, 항목 안쪽 여백을 ADR-F35 의 기준값으로 맞춘다.

**범위 외**: 공용 컴포넌트와 바깥 여백은 phase 01, 02 가 끝냈다. 색상과 다크 모드(#357)는 바꾸지 않는다.

## 컨텍스트

모든 경로는 저장소 root 기준이다. 명령은 `frontend/` 에서 돌린다.

**근거 문서**: `frontend/docs/adr/ADR-F35-mobile-spacing.md` 의 기준값: 카드와 섹션 안쪽 `p-4 md:p-6`, 리스트 항목 `p-3 md:p-4`, 섹션 간격 `space-y-4 md:space-y-6`.

2026-10-01 조사에서 찾은 곳이다. 줄 번호는 조사 시점 값이라 파일을 열어 클래스 문자열로 찾는다.

| 파일 | 지금 클래스 | 바꿀 값 |
|---|---|---|
| `frontend/src/app/(authenticated)/settings/_components/SettingsPageClient.tsx` 74행 | `space-y-6` | `space-y-4 md:space-y-6` |
| `frontend/src/app/(authenticated)/menu/_components/MenuPageClient.tsx` 92행 | `space-y-6 pb-6` | `space-y-4 md:space-y-6` (`pb-6` 제거) |
| `frontend/src/app/(authenticated)/invite/[token]/_components/InvitePageClient.tsx` 101, 103행 | `CardContent space-y-6`, 안쪽 상자 `p-5` | `space-y-4 md:space-y-6`, `p-4 md:p-5` |
| `frontend/src/app/(authenticated)/families/create/page.tsx` 87, 140행 | `space-y-6`, `mt-6 p-4` | `space-y-4 md:space-y-6`, `mt-4 md:mt-6 p-4` |
| `frontend/src/components/families/FamilySelector.tsx` 124, 162, 193, 212, 234행 | `mb-8`, `CardContent p-6`, `my-8` | `mb-4 md:mb-8`, `p-4 md:p-6`, `my-4 md:my-8` |
| `frontend/src/components/notifications/NotificationItem.tsx` 99행 | `w-full p-4` | `w-full p-3 md:p-4` |
| `frontend/src/app/(authenticated)/notifications/_components/NotificationsClient.tsx` 104행 | 빈 상태 `py-16` | `py-10 md:py-16` |
| `frontend/src/components/notifications/NotificationList.tsx` 102행 | `p-8` | `p-6 md:p-8` |
| `frontend/src/app/(authenticated)/budget/_components/BudgetClient.tsx` 78행 | `CardContent ... py-12` | `py-8 md:py-12` |
| `frontend/src/components/expenses/list/ExpenseList.tsx` 48행, `frontend/src/components/incomes/list/IncomeList.tsx` 44행 | `CardContent className="py-8"` | `py-6 md:py-8` |
| `frontend/src/components/categories/CategoriesHero.tsx`, `frontend/src/components/settings/SettingsHero.tsx` | 안쪽 `p-5 md:p-6` | `p-4 md:p-6` |

## 작업 항목

### 1. 설정, 메뉴, 초대, 가족 생성, 가족 선택 화면의 간격

### 2. 알림 항목, 알림 빈 상태, 알림 팝오버 빈 상태

### 3. 예산 빈 카드, 지출과 수입 목록의 빈 상태, 두 히어로 카드

### 4. 이 phase 를 검증하는 브라우저 테스트

- `frontend/browser/mobile-spacing.spec.ts` 에 더한다.
  - `/notifications`: 첫 알림 항목의 `padding-top` 이 `mobile` 에서 `12px`, `desktop` 에서 `16px` 다.
  - `/categories`: 히어로 카드 안쪽 상자의 `padding-left` 가 `mobile` 에서 `16px`, `desktop` 에서 `24px` 다.

## 검증

`frontend/` 에서 실행한다.

```bash
pnpm install --frozen-lockfile
pnpm exec playwright install chromium
pnpm tsc --noEmit && pnpm lint && pnpm lint:md && pnpm test
pnpm test:browser browser/mobile-spacing.spec.ts
pnpm test:browser
```

기대값: 모든 명령이 성공한다.

## 변경 파일

| 파일 | 변경 |
|---|---|
| `frontend/src/app/(authenticated)/settings/_components/SettingsPageClient.tsx` | 수정 |
| `frontend/src/app/(authenticated)/menu/_components/MenuPageClient.tsx` | 수정 |
| `frontend/src/app/(authenticated)/invite/[token]/_components/InvitePageClient.tsx` | 수정 |
| `frontend/src/app/(authenticated)/families/create/page.tsx` | 수정 |
| `frontend/src/components/families/FamilySelector.tsx` | 수정 |
| `frontend/src/components/notifications/NotificationItem.tsx` | 수정 |
| `frontend/src/app/(authenticated)/notifications/_components/NotificationsClient.tsx` | 수정 |
| `frontend/src/components/notifications/NotificationList.tsx` | 수정 |
| `frontend/src/app/(authenticated)/budget/_components/BudgetClient.tsx` | 수정 |
| `frontend/src/components/expenses/list/ExpenseList.tsx` | 수정 |
| `frontend/src/components/incomes/list/IncomeList.tsx` | 수정 |
| `frontend/src/components/categories/CategoriesHero.tsx` | 수정 |
| `frontend/src/components/settings/SettingsHero.tsx` | 수정 |
| `frontend/browser/mobile-spacing.spec.ts` | 수정 |
