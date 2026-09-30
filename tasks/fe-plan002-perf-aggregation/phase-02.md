# Phase 02. 내역 화면 활성 탭만 조회, 재시도 GET 한정, recharts 지연 로드

**Execution profile**: standard
**Domain**: app-router

## 목표

세 가지를 고친다.

1. `/transactions` 가 보이지 않는 탭까지 조회하지 않게 한다. 프로필 API 호출도 없앤다.
2. 백엔드 호출 재시도를 GET 으로 한정하고 타임아웃을 5초로 둔다.
3. recharts 를 쓰는 차트를 처음 화면 번들에서 빼고 필요할 때 받게 한다.

**범위 외**: 집계 API 전환은 phase 01 이다. 검색어와 금액 필터는 백엔드 목록 API 가 받지 않아 이번에 고치지 않는다(`frontend/docs/prd.md` 「후속 검토」). `dashboard/page.tsx`, `CalendarView`, `revalidatePath` 가 있는 action 파일, `ExpenseTabContent.tsx` 의 `router.refresh()` 는 다른 계획이 고치므로 건드리지 않는다.

## 컨텍스트

- `frontend/src/app/(authenticated)/transactions/page.tsx` 는 지출, 수입, 고정지출 목록을 각각 `expenseListContent`, `incomeListContent`, `recurringListContent` props 로 `TransactionsPageClient` 에 넘긴다. RSC 는 props 로 받은 서버 컴포넌트를 화면에 보이는지와 관계없이 모두 렌더링하므로, 세 탭의 조회가 매번 나간다.
- 탭 전환은 `TransactionsTabs` 가 URL `?tab=` 을 바꾸는 방식이다. 서버가 새 `tab` 으로 page 를 다시 그리므로, 보이는 탭만 만들어도 전환 동작은 같다.
- 같은 page 는 시간대를 얻으려고 `getUserProfileAction()` 으로 백엔드를 부른다. 시간대는 세션 `session.user.profile?.timezone` 에 이미 있다(`frontend/src/types/next-auth.d.ts`, `lib/server/auth/config.ts` 가 로그인 때 채운다). 세션은 `lib/server/cache.ts` 의 `getCachedSession()` 으로 읽는다.
- 재시도 설정은 `frontend/src/lib/server/api/client.ts` 의 `KY_RETRY_CONFIG` 다. ky 2.x 는 요청 옵션 `timeout`(ms)을 받는다.
- recharts 를 import 하는 파일은 셋이다. 모두 `"use client"` 다.
  - `frontend/src/components/dashboard/CategoryDistribution.tsx`
  - `frontend/src/app/(authenticated)/analytics/_components/AnalyticsCategoryDonut.tsx`
  - `frontend/src/app/(authenticated)/budget/_components/BudgetCumulativeLine.tsx`
- `next/dynamic` 의 `ssr: false` 는 Client Component 안에서만 쓸 수 있다. `CategoryDistribution` 을 import 하는 `dashboard/page.tsx` 는 Server Component 이고 다른 계획의 소유라 고치지 않는다.

**근거 문서**: `frontend/docs/adr.md` 의 ADR-F31, ADR-F02. `frontend/docs/flow.md` 의 「5-2. /transactions 페이지 구조」

## 의도 메모

- 차트 지연 로드는 컴포넌트 안에서 나눈다. 각 파일에서 recharts 를 쓰는 부분만 같은 디렉터리의 `*Chart.tsx` 로 옮기고, 원래 파일이 그것을 `dynamic(() => import("./XxxChart"), { ssr: false, loading })` 로 부른다. 원래 컴포넌트의 이름, props, export 는 그대로 둔다. 그래야 호출하는 page 를 고치지 않아도 된다.
- `loading` 자리표시는 차트와 같은 높이의 빈 박스(기존 `Skel` 패턴, `flow.md` 「14-2. 빈 상태 / 에러 / 로딩」)로 둔다. 높이가 달라지면 차트가 뜰 때 화면이 밀린다.
- 세션에 시간대가 없으면 `"Asia/Seoul"` 을 쓴다. 기존 fallback 과 같다.

## 작업 항목

### 1. `frontend/src/app/(authenticated)/transactions/page.tsx` — 활성 탭만 렌더링

- `getUserProfileAction` import 와 호출을 지운다. `const session = await getCachedSession(); const timezone = session?.user?.profile?.timezone ?? "Asia/Seoul";`
- 세 slot 중 `activeTab` 에 해당하는 것만 만들고 나머지는 `null` 로 넘긴다.
- `TransactionsPageClient` 의 prop 타입(`expenseListContent` 등)을 `ReactNode` 그대로 둔다. `null` 은 `ReactNode` 에 포함된다.
- 카테고리 조회(`getFamilyCategoriesAction`)는 지출 탭과 필터가 쓰므로 그대로 둔다.

### 2. `frontend/src/lib/server/api/client.ts` — 재시도와 타임아웃

- `KY_RETRY_CONFIG.methods` 를 `["get"]` 로 바꾼다.
- ky 인스턴스 옵션에 `timeout: 5000` 을 둔다. 상수로 빼서 주석에 ADR-F31 을 적는다.
- 파일 머리 주석의 "자동 재시도 (retry)" 를 "GET 자동 재시도" 로 고친다.

### 3. recharts 세 파일 — 차트 부분 분리와 지연 로드

- `CategoryDistribution.tsx` → 차트 부분을 `components/dashboard/CategoryDistributionChart.tsx` 로 옮긴다.
- `AnalyticsCategoryDonut.tsx` → `analytics/_components/AnalyticsCategoryDonutChart.tsx`.
- `BudgetCumulativeLine.tsx` → `budget/_components/BudgetCumulativeLineChart.tsx`.
- 원래 파일은 `import dynamic from "next/dynamic"` 으로 새 파일을 `ssr: false` 로 부른다. 원래 파일에 `from "recharts"` 가 남지 않는다.

### 4. 테스트

- `frontend/src/__tests__/lib/server-api-client.test.ts`: POST 가 502 를 받으면 재시도하지 않고 한 번만 호출되는지, GET 은 502 에서 재시도하는지 확인한다. 기존 테스트가 POST 재시도를 기대하면 그 기대를 고친다.
- `frontend/src/__tests__/app/transactions/page.test.tsx` (없으면 신규): `tab=incomes` 로 렌더링할 때 지출 목록 조회 Action 과 `getUserProfileAction` 이 불리지 않는지 확인한다. 세션 timezone 이 `getMonthRange` 에 전달되는지도 본다.
- recharts 분리 컴포넌트를 렌더링하는 기존 테스트가 있으면 `next/dynamic` 을 mock 해 통과시킨다.

## 검증

```bash
# cwd: <repo root>
cd frontend && pnpm lint && pnpm test && pnpm build
grep -rln 'from "recharts"' src | grep -v Chart.tsx          # 결과 없음
grep -n "getUserProfileAction" "src/app/(authenticated)/transactions/page.tsx"   # 결과 없음
```

`pnpm build` 출력의 Route 표에서 `/analytics`, `/budget`, `/dashboard` 의 First Load JS 가 변경 전보다 줄었는지 보고 두 값을 PR 본문에 적는다. 변경 전 값은 작업 시작 전에 `pnpm build` 로 한 번 잰다.

마지막으로 `tasks/fe-plan002-perf-aggregation/index.json` 의 `status` 와 두 phase 의 `status` 를 `completed` 로 바꾼다.

## Critical Files

| 파일 | 변경 |
|---|---|
| `frontend/src/app/(authenticated)/transactions/page.tsx` | 수정 |
| `frontend/src/lib/server/api/client.ts` | 수정 |
| `frontend/src/components/dashboard/CategoryDistribution.tsx` | 수정 |
| `frontend/src/components/dashboard/CategoryDistributionChart.tsx` | 신규 |
| `frontend/src/app/(authenticated)/analytics/_components/AnalyticsCategoryDonut.tsx` | 수정 |
| `frontend/src/app/(authenticated)/analytics/_components/AnalyticsCategoryDonutChart.tsx` | 신규 |
| `frontend/src/app/(authenticated)/budget/_components/BudgetCumulativeLine.tsx` | 수정 |
| `frontend/src/app/(authenticated)/budget/_components/BudgetCumulativeLineChart.tsx` | 신규 |
| `frontend/src/__tests__/lib/server-api-client.test.ts` | 수정 |
| `frontend/src/__tests__/app/transactions/page.test.tsx` | 신규 또는 수정 |
