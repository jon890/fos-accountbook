# Phase 02. `useRouter` 를 공용 훅으로 바꾸고 lint 로 막기

**Execution profile**: fast
**Domain**: app-router

## 목표

클라이언트 컴포넌트가 모두 `useAppRouter` 로 이동하고, `next/navigation` 의 `useRouter` 를 다시 쓰면 `pnpm lint` 가 실패한다.

**범위 외**: 화면별 영역 표시와 액션 버튼의 대기 표시는 phase 03 이다.

## 컨텍스트

모든 경로는 저장소 root 기준이다. 명령은 `frontend/` 에서 돌린다.

**근거 문서**: `frontend/docs/adr/ADR-F39-navigation-pending-feedback.md`.

코드에서 확인한 사실(`grep -rln "useRouter" frontend/src --include='*.tsx' | grep -v __tests__`): 아래 20개 파일이 `next/navigation` 의 `useRouter` 를 쓴다.

- `frontend/src/app/(authenticated)/analytics/_components/AnalyticsPeriodToggle.tsx`
- `frontend/src/app/(authenticated)/budget/_components/BudgetClient.tsx`
- `frontend/src/app/(authenticated)/families/create/page.tsx`
- `frontend/src/app/(authenticated)/invite/[token]/_components/InvitePageClient.tsx`
- `frontend/src/app/(authenticated)/menu/_components/MenuPageClient.tsx`
- `frontend/src/app/(authenticated)/notifications/_components/NotificationsClient.tsx`
- `frontend/src/app/(authenticated)/settings/_components/SettingsPageClient.tsx`
- `frontend/src/app/(authenticated)/transactions/_components/AmountRangeFilter.tsx`
- `frontend/src/app/(authenticated)/transactions/_components/FilterChips.tsx`
- `frontend/src/app/(authenticated)/transactions/_components/SearchBar.tsx`
- `frontend/src/app/(authenticated)/transactions/_components/TransactionsTabs.tsx`
- `frontend/src/components/calendar/CalendarHome.tsx`
- `frontend/src/components/expenses/list/ExpensePagination.tsx`
- `frontend/src/components/expenses/summary/CategoryExpenseSummary.tsx`
- `frontend/src/components/families/FamilySelectorDropdown.tsx`
- `frontend/src/components/families/FamilySelectorList.tsx`
- `frontend/src/components/families/FamilySelectorPage.tsx`
- `frontend/src/components/incomes/list/IncomeListClient.tsx`
- `frontend/src/components/layout/Header.tsx`
- `frontend/src/components/settings/BudgetEditDialog.tsx`

`frontend/eslint.config.mjs` 가 lint 규칙을 정한다.

## 의도 메모

- 구현 전에 위 grep 을 다시 돌린다. 앞서 머지된 plan 이 파일을 더하거나 지웠으면 그 결과를 따르고, 목록과 달라진 파일은 보고에 적는다.
- `useSearchParams`, `usePathname` 은 그대로 `next/navigation` 에서 가져온다. 막는 것은 `useRouter` 하나다.
- lint 규칙은 `no-restricted-imports` 의 `paths` 에 `{ name: "next/navigation", importNames: ["useRouter"], message: "useAppRouter(@/lib/client/navigation) 를 쓴다 (ADR-F39)" }` 를 둔다. `frontend/src/lib/client/navigation.tsx` 와 `frontend/src/__tests__/**` 는 규칙에서 뺀다.

## 작업 항목

### 1. 화면과 전환 관련 파일 11개 교체 (`app/(authenticated)/**`)

### 2. 공용 컴포넌트 9개 교체 (`components/**`)

### 3. `eslint.config.mjs` 에 `no-restricted-imports` 규칙 추가

### 4. lint 규칙 테스트와 깨지는 단위 테스트 보정

- `frontend/src/__tests__/lib/no-direct-use-router.test.ts`(신규): `@jest-environment node` 로 `eslint` 의 `ESLint` API 를 써서, `import { useRouter } from "next/navigation"` 를 담은 코드 문자열을 `src/components/Example.tsx` 경로로 lint 하면 `no-restricted-imports` 오류가 나고, `frontend/src/lib/client/navigation.tsx` 경로로 lint 하면 나지 않는 것을 확인한다.

아래 「변경 파일」 의 테스트들이 `next/navigation` 을 모킹한다. 그 모킹이 `useRouter` 를 돌려주면 `useAppRouter` 도 그 값을 쓰므로 대부분 그대로 통과해야 한다. 깨지면 모킹을 고치고 단언은 약하게 바꾸지 않는다.

## 검증

`frontend/` 에서 실행한다.

```bash
pnpm tsc --noEmit && pnpm lint && pnpm lint:md && pnpm test
pnpm test src/__tests__/lib/no-direct-use-router.test.ts src/__tests__/app/analytics/page.test.tsx src/__tests__/app/budget/page.test.tsx src/__tests__/app/calendar/page.test.tsx src/__tests__/app/dashboard/page.test.tsx src/__tests__/app/menu/page.test.tsx src/__tests__/app/transactions/page.test.tsx src/__tests__/components/calendar/CalendarHome.test.tsx src/__tests__/components/expenses/ExpensePagination.test.tsx src/__tests__/components/invite/InvitePageClient.test.tsx src/__tests__/components/layout/BottomNavigation.test.tsx src/__tests__/components/layout/Header.test.tsx src/__tests__/components/settings/SettingsPageClient.test.tsx src/__tests__/lib/action-result-handler.test.ts
grep -rn "useRouter" src --include='*.tsx' --include='*.ts' | grep -v __tests__ | grep -v "lib/client/navigation.tsx"
```

기대값: 앞 명령은 성공하고, 마지막 grep 은 `useAppRouter` 가 들어간 줄만 낸다.

## 변경 파일

| 파일 | 변경 |
|---|---|
| `frontend/src/app/(authenticated)/analytics/_components/AnalyticsPeriodToggle.tsx` | 수정 |
| `frontend/src/app/(authenticated)/budget/_components/BudgetClient.tsx` | 수정 |
| `frontend/src/app/(authenticated)/families/create/page.tsx` | 수정 |
| `frontend/src/app/(authenticated)/invite/[token]/_components/InvitePageClient.tsx` | 수정 |
| `frontend/src/app/(authenticated)/menu/_components/MenuPageClient.tsx` | 수정 |
| `frontend/src/app/(authenticated)/notifications/_components/NotificationsClient.tsx` | 수정 |
| `frontend/src/app/(authenticated)/settings/_components/SettingsPageClient.tsx` | 수정 |
| `frontend/src/app/(authenticated)/transactions/_components/AmountRangeFilter.tsx` | 수정 |
| `frontend/src/app/(authenticated)/transactions/_components/FilterChips.tsx` | 수정 |
| `frontend/src/app/(authenticated)/transactions/_components/SearchBar.tsx` | 수정 |
| `frontend/src/app/(authenticated)/transactions/_components/TransactionsTabs.tsx` | 수정 |
| `frontend/src/components/calendar/CalendarHome.tsx` | 수정 |
| `frontend/src/components/expenses/list/ExpensePagination.tsx` | 수정 |
| `frontend/src/components/expenses/summary/CategoryExpenseSummary.tsx` | 수정 |
| `frontend/src/components/families/FamilySelectorDropdown.tsx` | 수정 |
| `frontend/src/components/families/FamilySelectorList.tsx` | 수정 |
| `frontend/src/components/families/FamilySelectorPage.tsx` | 수정 |
| `frontend/src/components/incomes/list/IncomeListClient.tsx` | 수정 |
| `frontend/src/components/layout/Header.tsx` | 수정 |
| `frontend/src/components/settings/BudgetEditDialog.tsx` | 수정 |
| `frontend/eslint.config.mjs` | 수정 |
| `frontend/src/__tests__/app/analytics/page.test.tsx` | 수정 |
| `frontend/src/__tests__/app/budget/page.test.tsx` | 수정 |
| `frontend/src/__tests__/app/calendar/page.test.tsx` | 수정 |
| `frontend/src/__tests__/app/dashboard/page.test.tsx` | 수정 |
| `frontend/src/__tests__/app/menu/page.test.tsx` | 수정 |
| `frontend/src/__tests__/app/transactions/page.test.tsx` | 수정 |
| `frontend/src/__tests__/components/calendar/CalendarHome.test.tsx` | 수정 |
| `frontend/src/__tests__/components/expenses/ExpensePagination.test.tsx` | 수정 |
| `frontend/src/__tests__/components/invite/InvitePageClient.test.tsx` | 수정 |
| `frontend/src/__tests__/components/layout/BottomNavigation.test.tsx` | 수정 |
| `frontend/src/__tests__/components/layout/Header.test.tsx` | 수정 |
| `frontend/src/__tests__/components/settings/SettingsPageClient.test.tsx` | 수정 |
| `frontend/src/__tests__/lib/action-result-handler.test.ts` | 수정 |
| `frontend/src/__tests__/lib/no-direct-use-router.test.ts` | 신규 |
