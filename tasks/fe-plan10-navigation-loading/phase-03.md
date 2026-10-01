# Phase 03. 같은 화면 전환의 영역 표시와 액션 뒤 이동 버튼

**Execution profile**: standard
**Domain**: app-router

## 목표

같은 화면에서 주소 값만 바꾸면 바뀔 영역이 흐려지고 `aria-busy="true"` 가 된다.
서버 액션 뒤 이동하는 버튼은 이동이 끝날 때까지 비활성과 진행 표시를 유지한다. 헤더의 가족 전환 시트는 누르면 바로 열린다.

**범위 외**: 링크 이동(`loading.tsx`)은 이미 바로 뜨므로 바꾸지 않는다.

## 컨텍스트

모든 경로는 저장소 root 기준이다. 명령은 `frontend/` 에서 돌린다.

**근거 문서**: `frontend/docs/adr/ADR-F39-navigation-pending-feedback.md`, `frontend/docs/flow.md` 의 「14-2. 빈 상태 / 에러 / 로딩」.

코드에서 확인한 사실:

- `frontend/src/app/(authenticated)/transactions/_components/TransactionsPageClient.tsx` 61-66행이 탭에 따라 `expenseListContent`, `incomeListContent`, `recurringListContent` 중 하나를 그린다. 그 위에 탭(`TransactionsTabs`)과 필터(`FilterChips`, `SearchBar`, `AmountRangeFilter`)가 있고 모두 `router.push` 나 `router.replace` 로 `/transactions?...` 를 바꾼다. 카테고리 요약 행(`CategoryExpenseSummary`), 쪽 넘김(`ExpensePagination`, `IncomeListClient`)도 같다.
- `frontend/src/components/calendar/CalendarHome.tsx` 의 `moveMonth` 가 `router.push("/calendar?month=...")` 를 부른다. 그동안 `MonthHeader`, `MemberTotals`, `CalendarGrid`, `DayTransactionList` 는 이전 달을 보인다.
- `frontend/src/app/(authenticated)/analytics/_components/AnalyticsPeriodToggle.tsx` 가 `router.replace("?period=...")` 를 부른다.
- 서버 액션 뒤 이동:
  - `frontend/src/components/families/FamilySelectorPage.tsx`: `setDefaultFamilyAction` → `refreshSession` → `router.push("/calendar")`. 대기 표시가 없다.
  - `frontend/src/components/families/FamilySelectorList.tsx`: `selectFamilyAction` → `refreshSession` → `router.refresh()`. 대기 표시가 없다.
  - `frontend/src/app/(authenticated)/families/create/page.tsx`: `isLoading` 이 `finally` 에서 꺼져, 이동이 끝나기 전에 버튼이 다시 켜진다.
  - `frontend/src/app/(authenticated)/invite/[token]/_components/InvitePageClient.tsx`: `isAccepting` 이 같은 방식이다.
- `frontend/src/components/layout/Header.tsx` 83-90행 `handleOpenFamilySheet` 가 `getFamiliesAction()` 응답을 받은 뒤에야 시트를 연다.

## 의도 메모

- 영역 표시는 `useAppRouter()` 가 돌려주는 `isPending` 이 아니라 전역 대기 상태를 쓴다. 탭과 목록이 다른 컴포넌트라 전환을 일으킨 컴포넌트와 흐려질 영역이 다르다. `frontend/src/lib/client/navigation.tsx` 에 전역 대기 여부를 읽는 `useNavigationPending()` 을 더한다.
- 흐림은 `opacity-60 transition-opacity` 와 `pointer-events-none` 을 함께 준다. 대기 중 두 번 누르는 것을 막는다.
- 액션 뒤 이동 버튼은 액션 시작부터 `isPending` 이 끝날 때까지 비활성이다. `finally` 에서 끄던 상태는 실패할 때만 끈다.
- 가족 전환 시트는 누르면 바로 열고, 목록을 받는 동안 행 스켈레톤(`Skel`) 세 줄을 보인다. 실패하면 시트를 닫고 지금처럼 토스트를 띄운다.

## 작업 항목

### 1. `useNavigationPending()` 추가와 내역 화면 영역 표시

`TransactionsPageClient.tsx` 의 목록 영역을 `aria-busy` 와 흐림으로 감싼다.

### 2. 달력과 분석의 영역 표시

`CalendarHome.tsx` 는 달력 격자와 날짜 목록을, 분석은 `frontend/src/app/(authenticated)/analytics/_components/AnalyticsClient.tsx` 의 본문을 감싼다.

### 3. 가족 선택, 가족 전환, 가족 만들기, 초대 수락 버튼의 대기 유지

### 4. 헤더 가족 전환 시트를 바로 열고 스켈레톤 표시

### 5. 단위 테스트

- `frontend/src/__tests__/components/layout/Header.test.tsx`(수정): 「가족 전환」 을 누르면 응답 전에 시트와 스켈레톤이 보인다.
- `frontend/src/__tests__/components/families/FamilySelectorList.test.tsx`(신규): 항목을 누르면 전환이 끝날 때까지 버튼이 비활성이다.

## 검증

`frontend/` 에서 실행한다.

```bash
pnpm tsc --noEmit && pnpm lint && pnpm lint:md && pnpm test
pnpm test src/__tests__/components/layout/Header.test.tsx src/__tests__/components/families/FamilySelectorList.test.tsx
```

기대값: 모든 명령이 성공한다.

## 변경 파일

| 파일 | 변경 |
|---|---|
| `frontend/src/lib/client/navigation.tsx` | 수정 |
| `frontend/src/app/(authenticated)/transactions/_components/TransactionsPageClient.tsx` | 수정 |
| `frontend/src/components/calendar/CalendarHome.tsx` | 수정 |
| `frontend/src/app/(authenticated)/analytics/_components/AnalyticsClient.tsx` | 수정 |
| `frontend/src/components/families/FamilySelectorPage.tsx` | 수정 |
| `frontend/src/components/families/FamilySelectorList.tsx` | 수정 |
| `frontend/src/app/(authenticated)/families/create/page.tsx` | 수정 |
| `frontend/src/app/(authenticated)/invite/[token]/_components/InvitePageClient.tsx` | 수정 |
| `frontend/src/components/layout/Header.tsx` | 수정 |
| `frontend/src/__tests__/components/layout/Header.test.tsx` | 수정 |
| `frontend/src/__tests__/components/families/FamilySelectorList.test.tsx` | 신규 |
