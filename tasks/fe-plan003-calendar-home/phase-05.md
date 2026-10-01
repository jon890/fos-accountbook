# Phase 05. 대시보드 제거와 분석 화면 위쪽 이전

**Execution profile**: standard
**Domain**: app-router

## 목표

`/dashboard` 를 없앤다. 예산 카드, 이번 달 수입·지출, 고정비 카드를 `/analytics` 위쪽으로 옮긴다. 예전 주소는 `/analytics` 로 보낸다.

**범위 외**: 분석 화면의 차트와 집계 방식은 바꾸지 않는다. 성능 개선 PR #405의 집계 구현을 유지한다. 운영 월 경계 오류를 바로잡는 현재 연월 선택만 함께 고친다.

## 컨텍스트

- 대시보드 화면 `frontend/src/app/(authenticated)/dashboard/page.tsx` 와 전용 컴포넌트 `frontend/src/components/dashboard/`: `BudgetHeroCard`, `IncomeExpenseStats`, `CategoryDistribution`, `RecentActivity`, `QuickActions`, `CalendarView`, `DashboardHeader`, `CoupleAvatars`, `InviteFamilyDialog`, `skeleton/`.
- 현재 대시보드에는 고정비 카드가 없다. 분석 화면에 새 고정비 카드를 만들고 `getRecurringExpensesTotalAction()` 으로 `recurring-expenses/monthly-total` 을 부른다(`flow.md` 「14」).
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
- 기존 대시보드 계산은 `Asia/Seoul` 고정이므로 이를 세션 `profile.timezone` 기준으로 보강한다. 값이 없으면 `Asia/Seoul` 을 쓴다. 고정비 카드는 「이달 고정비」와 전체 금액을 표시하고 `/transactions?tab=recurring` 으로 연결한다. 실패는 기존 분석 Page 오류 규칙을 따르며 인증 오류는 로그인으로 보낸다.
- 고정지출 create/update/delete Action은 `/analytics` 를 함께 다시 그려 카드가 최신 금액을 표시하게 한다. 등록 Action의 옛 `/dashboard` 경로는 `/analytics` 로 바꾼다. 기존 고정지출 Action 테스트에 새 경로를 추가하되 성공·실패 검증은 유지한다.
- 통계·분석·예산의 이번 달은 세션 `profile.timezone` 을 사용하며 누락·잘못된 값은 서울로 처리한다. phase 03의 `getDatePartsInTimezone` 을 재사용한다. `getDashboardStats(familyUuid, timezone = "Asia/Seoul")` 는 받은 시간대로 캐시 조회 연월을 정한다. `getDashboardStatsAction` 은 `requireAuth()` 가 반환한 세션에서 시간대를 전달한다. 분석·예산 Page와 카테고리 분포·전월 대비·월 추이 Action의 기본 연월도 같은 기준으로 바꾼다. 명시한 조회 연월과 집계 방식은 유지한다.

### 2. `/dashboard` 제거

- `app/(authenticated)/dashboard/page.tsx` 를 `redirect("/analytics")` 만 하는 파일로 바꾸고 `loading.tsx` 는 지운다.
- 대시보드 전용이 된 컴포넌트를 지운다: `RecentActivity`, `QuickActions`, `CalendarView`, `DashboardHeader`, 대시보드 skeleton. 지우기 전에 `grep -rn "<이름>" src` 로 다른 사용처가 없는지 확인한다. `CoupleAvatars`는 비로그인 첫 화면도 쓰므로 유지한다.
- 인증된 오류·404·403 화면의 홈 링크와 이름을 「홈으로」와 `/calendar`로 맞춘다. 대시보드 이전 주소의 redirect 때문에 분석으로 이동하는 오류를 막는다.
- `actions/dashboard/get-recent-expenses-action.ts` 는 사용처 확인 후 지운다. `get-monthly-daily-stats-action.ts` 는 예산 Page, 분석 Page와 AnalyticsClient가 사용하는 공유 조회·타입 export이므로 유지한다. `services/dashboard/dashboard-service.ts` 의 함수는 `fe-plan002` 와 충돌하므로 지우지 않는다.

### 3. `InviteFamilyDialog` 위치

- `components/families/InviteFamilyDialog.tsx` 로 옮기고 `menu/_components/MenuPageClient.tsx` 의 import를 함께 고친다.
- 외부 `open` 값이 참으로 바뀌면 활성 초대 목록을 조회한다. 전체 메뉴에서 여는 첫 화면에도 기존 초대를 표시하며 조회 실패와 다시 열기를 검증한다.

### 4. phase 01 에서 남긴 `members` 정리

- phase 01의 `memberCount` 인원수와 잘못된 아바타 제거가 적용됐는지 확인한다. 이 화면들에 구성원 API 조회는 추가하지 않는다.

### 5. 테스트

- `frontend/src/__tests__/app/analytics/page.test.tsx`(없으면 신규): 예산 카드가 `/budget` 링크이고 고정비 금액이 보인다.
- `frontend/src/__tests__/app/dashboard/page.test.tsx`: 대시보드 페이지가 `/analytics` 로 redirect 한다.
- 지운 컴포넌트의 기존 테스트는 함께 지운다.
- 분석 Page의 수입·지출 카드, 일반 조회 실패, 401 로그인 처리도 확인한다. `frontend/docs/flow.md` 「5-3」의 조회 목록과 위쪽 카드, 「15」의 삭제된 관리 버튼 설명을 실제 구현에 맞춘다. 계층·타입 설명이 바뀐 관련 docs도 같은 커밋에서 현재 사실로 갱신한다.
- 인증된 오류·404·403 화면의 홈 링크를 검증한다. `flow.md`의 거래 종류 전환 설명과 ADR-F32를 날짜 유지 동작에 맞춘다. 과거 ADR-F21의 결정은 이력으로 보존하고 ADR-F32가 날짜 초기화 정책을 대체함을 적는다.
- UTC 9월 30일 16시에 서울은 10월 1일 01시다. 이 시각을 고정한 테스트에서 통계 캐시와 분석·예산 조회가 10월을 사용하고 다른 시간대는 해당 지역 월을 사용하는지 확인한다. 세션 시간대가 Action→Service로 전달되는지, 기본 연월과 명시 연월도 검증한다.

## 검증

```bash
# cwd: <repo root>
cd frontend && pnpm test src/__tests__/app/analytics/page.test.tsx src/__tests__/app/dashboard/page.test.tsx src/__tests__/app/budget/page.test.tsx src/__tests__/app/authenticated-status-pages.test.tsx src/__tests__/components/families/InviteFamilyDialog.test.tsx src/__tests__/services/dashboard/getDashboardStats.test.ts src/__tests__/actions/dashboard/current-month-actions.test.ts src/__tests__/actions/recurring-expense
pnpm lint && pnpm test
pnpm exec tsc --noEmit
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
| `frontend/src/components/dashboard/skeleton/**` | 삭제 |
| `frontend/src/components/dashboard/InviteFamilyDialog.tsx` | 삭제 |
| `frontend/src/components/families/InviteFamilyDialog.tsx` | 신규 |
| `frontend/src/actions/dashboard/get-recent-expenses-action.ts` | 삭제 |
| `frontend/src/app/(authenticated)/settings/_components/SettingsPageClient.tsx` | 수정 |
| `frontend/src/components/families/FamilySelector.tsx` | 수정 |
| `frontend/src/app/(authenticated)/menu/page.tsx` | 수정 |
| `frontend/src/app/(authenticated)/menu/_components/MenuPageClient.tsx` | 수정 |
| `frontend/src/__tests__/app/analytics/page.test.tsx` | 신규 |
| `frontend/src/__tests__/app/dashboard/page.test.tsx` | 신규 |
| `frontend/src/actions/recurring-expense/index.ts` | 수정 |
| `frontend/src/__tests__/actions/recurring-expense/createRecurringExpenseAction.test.ts` | 수정 |
| `frontend/src/__tests__/actions/recurring-expense/updateRecurringExpenseAction.test.ts` | 수정 |
| `frontend/src/__tests__/actions/recurring-expense/deleteRecurringExpenseAction.test.ts` | 수정 |
| `frontend/docs/flow.md` | 수정 |
| `frontend/docs/code-architecture.md` | 수정 |
| `frontend/docs/data-schema.md` | 수정 |
| `frontend/src/services/dashboard/dashboard-service.ts` | 수정 |
| `frontend/src/actions/dashboard/get-dashboard-stats-action.ts` | 수정 |
| `frontend/src/actions/dashboard/get-monthly-category-breakdown-action.ts` | 수정 |
| `frontend/src/actions/analytics/get-category-breakdown-with-delta-action.ts` | 수정 |
| `frontend/src/actions/analytics/get-monthly-trend-action.ts` | 수정 |
| `frontend/src/app/(authenticated)/budget/page.tsx` | 수정 |
| `frontend/src/__tests__/services/dashboard/getDashboardStats.test.ts` | 신규 |
| `frontend/src/__tests__/actions/dashboard/current-month-actions.test.ts` | 신규 |
| `frontend/src/__tests__/app/budget/page.test.tsx` | 신규 |
| `frontend/src/app/(authenticated)/error.tsx` | 수정 |
| `frontend/src/app/(authenticated)/not-found.tsx` | 수정 |
| `frontend/src/app/(authenticated)/forbidden.tsx` | 수정 |
| `frontend/src/__tests__/app/authenticated-status-pages.test.tsx` | 신규 |
| `frontend/docs/adr.md` | 수정 |
| `frontend/src/__tests__/components/families/InviteFamilyDialog.test.tsx` | 신규 |
