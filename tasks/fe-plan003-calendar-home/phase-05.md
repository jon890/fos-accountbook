# Phase 05. 대시보드 제거와 분석 화면 위쪽 이전

**Execution profile**: standard
**Domain**: app-router

## 목표

`/dashboard` 를 없앤다. 예산 카드, 이번 달 수입·지출, 고정비 카드를 `/analytics` 위쪽으로 옮긴다. 예전 주소는 `/analytics` 로 보낸다.

**범위 외**: 분석 화면의 차트와 집계 방식은 바꾸지 않는다(성능 개선 계획 `fe-plan002` 가 고친다).

## 컨텍스트

- 대시보드 화면 `frontend/src/app/(authenticated)/dashboard/page.tsx` 와 전용 컴포넌트 `frontend/src/components/dashboard/`: `BudgetHeroCard`, `IncomeExpenseStats`, `CategoryDistribution`, `RecentActivity`, `QuickActions`, `CalendarView`, `DashboardHeader`, `CoupleAvatars`, `InviteFamilyDialog`, `skeleton/`.
- 고정비 카드는 `getRecurringExpensesTotalAction()` 로 `recurring-expenses/monthly-total` 을 부른다(`flow.md` 「14」).
- 분석 화면 `frontend/src/app/(authenticated)/analytics/page.tsx` 는 이미 `getDashboardStatsAction()` 을 부른다.
- 같은 시기에 성능 개선 계획이 `components/dashboard/CategoryDistribution.tsx` 를 고친다. 이 파일은 지우지 않는다. 쓰는 곳이 없어지면 후속 정리 대상이다.

**근거 문서**: `frontend/docs/flow.md` 의 「5. 달력 홈」 마지막 항목, 「5-3」 의 분석 화면 위쪽 설명, 「14. 고정비 카드」, `frontend/docs/adr.md` 의 ADR-F32

## 의도 메모

- 최근 내역과 빠른 메뉴는 옮기지 않는다. 달력 날짜 목록과 전체 메뉴가 같은 일을 한다.
- `BudgetHeroCard` 는 누르면 `/budget` 으로 가게 한다. 예산 화면의 두 번째 진입점이다(첫째는 전체 메뉴).
- `InviteFamilyDialog` 는 전체 메뉴가 쓰므로 남긴다. 위치를 `components/families/` 로 옮기면 import 를 함께 고친다.

## 작업 항목

### 1. `frontend/src/app/(authenticated)/analytics/page.tsx`: 위쪽 섹션

- `getRecurringExpensesTotalAction()` 을 기존 `Promise.all` 에 더한다.
- 기간 토글 위에 `BudgetHeroCard`(링크 `/budget`), `IncomeExpenseStats`, 고정비 카드를 Server Component 로 둔다. 기존 `AnalyticsClient` 는 그 아래에 그대로 둔다.
- 예산 카드의 남은 일수 계산은 대시보드의 사용자 시간대 계산을 그대로 옮긴다.

### 2. `/dashboard` 제거

- `app/(authenticated)/dashboard/page.tsx` 를 `redirect("/analytics")` 만 하는 파일로 바꾸고 `loading.tsx` 는 지운다.
- 대시보드 전용이 된 컴포넌트를 지운다: `RecentActivity`, `QuickActions`, `CalendarView`, `DashboardHeader`, `CoupleAvatars`, 대시보드 skeleton. 지우기 전에 `grep -rn "<이름>" src` 로 다른 사용처가 없는지 확인한다.
- `actions/dashboard/get-recent-expenses-action.ts`, `get-monthly-daily-stats-action.ts` 를 지운다. 지우기 전에 다른 사용처가 없는지 확인하고, 있으면 ask 로 알린다. `services/dashboard/dashboard-service.ts` 의 함수는 `fe-plan002` 와 충돌하므로 지우지 않는다.

### 3. `InviteFamilyDialog` 위치

- `components/families/InviteFamilyDialog.tsx` 로 옮기고 import 를 고친다(전체 메뉴 `menu/page.tsx` 포함).

### 4. phase 01 에서 남긴 `members` 정리

- `SettingsPageClient.tsx`, `FamilySelector.tsx` 에서 구성원 표시가 필요한 곳은 `getFamilyMembersAction` 을 쓰고, 필요 없으면 표시를 지운다.

### 5. 테스트

- `frontend/src/__tests__/app/analytics/page.test.tsx`(없으면 신규): 예산 카드가 `/budget` 링크이고 고정비 금액이 보인다.
- `frontend/src/__tests__/app/dashboard/page.test.tsx`: 대시보드 페이지가 `/analytics` 로 redirect 한다.
- 지운 컴포넌트의 기존 테스트는 함께 지운다.

## 검증

```bash
# cwd: <repo root>
cd frontend && pnpm test -- src/__tests__/app/analytics/page.test.tsx src/__tests__/app/dashboard/page.test.tsx
pnpm lint && pnpm test
git grep -ln 'QuickActions\|RecentActivity\|CalendarView' -- src   # 결과 없음
```

## 변경 파일

| 파일 | 변경 |
|---|---|
| `frontend/src/app/(authenticated)/analytics/page.tsx` | 수정 |
| `frontend/src/app/(authenticated)/dashboard/page.tsx` | 수정 |
| `frontend/src/app/(authenticated)/dashboard/loading.tsx` | 삭제 |
| `frontend/src/components/dashboard/RecentActivity.tsx` | 삭제 |
| `frontend/src/components/dashboard/QuickActions.tsx` | 삭제 |
| `frontend/src/components/dashboard/CalendarView.tsx` | 삭제 |
| `frontend/src/components/dashboard/DashboardHeader.tsx` | 삭제 |
| `frontend/src/components/dashboard/CoupleAvatars.tsx` | 삭제 |
| `frontend/src/components/dashboard/skeleton/**` | 삭제 |
| `frontend/src/components/dashboard/InviteFamilyDialog.tsx` | 삭제 |
| `frontend/src/components/families/InviteFamilyDialog.tsx` | 신규 |
| `frontend/src/actions/dashboard/get-recent-expenses-action.ts` | 삭제 |
| `frontend/src/actions/dashboard/get-monthly-daily-stats-action.ts` | 삭제 |
| `frontend/src/app/(authenticated)/settings/_components/SettingsPageClient.tsx` | 수정 |
| `frontend/src/components/families/FamilySelector.tsx` | 수정 |
| `frontend/src/app/(authenticated)/menu/page.tsx` | 수정 |
| `frontend/src/__tests__/app/analytics/page.test.tsx` | 신규 |
| `frontend/src/__tests__/app/dashboard/page.test.tsx` | 신규 |
