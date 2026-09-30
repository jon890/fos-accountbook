# Phase 03. 달력 홈 화면과 첫 화면 전환

**Execution profile**: deep
**Domain**: app-router

## 목표

`/calendar` 화면을 만들고 로그인 뒤 첫 화면으로 둔다. 한 칸에 구성원별 지출이 한 줄씩 보이고, 날짜를 누르면 달력 아래 목록이 그날 내역으로 바뀐다.

**범위 외**: 하단 탭은 phase 04, 대시보드 제거는 phase 05 다. 다이얼로그의 `defaultDate` 와 삭제 버튼은 phase 02 가 이미 만들었다.

## 컨텍스트

- 데이터는 phase 01 의 `getCalendarMonthAction(year, month)` 와 `buildMemberColorMap`, `formatCompactAmount` 를 쓴다.
- Page 에서 `serverApiGet` 을 직접 부르지 않고 Action 을 거친다(ADR-F12). URL searchParams 와 클라이언트 상태를 맞출 때는 ADR-F17 의 `draft ?? current` 패턴을 쓴다.
- 사용자 시간대는 `(authenticated)/layout.tsx` 의 `TimeZoneProvider` 와 세션 `session.user.profile?.timezone` 에 있다. 이번 달과 오늘은 이 시간대로 정한다. 선례: `lib/utils/date-timezone.ts` 의 `getMonthRange(timezone)`.
- 목록 행은 기존 `components/transactions/TransactionRow.tsx` 의 `variant="compact"` 를 쓴다. 등록자는 `tx.createdBy` 필드로 전달한다.
- 기존 `components/dashboard/CalendarView.tsx` 는 쓰지 않는다. phase 05 가 지운다.
- 빈 상태 컴포넌트는 `components/empty/EmptyState.tsx`, 로딩 skeleton 은 `Skel` 패턴(`flow.md` 「14-2」)이다.

**근거 문서**: `frontend/docs/flow.md` 의 「5. 달력 홈 (`/calendar`)」, `frontend/docs/adr.md` 의 ADR-F32, ADR-F12, ADR-F17

## 의도 메모

- 날짜 선택은 서버를 부르지 않는다(ADR-F32). 선택 날짜는 클라이언트 상태로 두고, 새로고침해도 유지되도록 `window.history.replaceState` 로 `?date=` 만 바꾼다. 월 이동은 `router.push("/calendar?month=YYYY-MM")` 로 서버가 다시 그린다.
- 칸 크기: 360px 폭에서 7열이면 칸이 약 48px 다. 구성원 두 줄(6px 점과 11px 글자)과 날짜가 들어가도록 칸 최소 높이 60px, 글자 11px 이상, `tabular-nums`. 구성원이 세 명 이상이면 칸에는 지출 많은 두 명만 보이고 나머지는 `+1` 로 줄인다.
- 월 이동 버튼과 날짜 칸은 터치 영역 44px 이상.
- 오늘은 날짜 숫자에 테두리, 선택 날짜는 배경색으로 구분한다. 토요일과 일요일 숫자 색은 기존 토큰을 쓴다.

## 작업 항목

### 1. `frontend/src/app/(authenticated)/calendar/page.tsx`, `loading.tsx`

- searchParams `month`(`YYYY-MM`), `date`(`YYYY-MM-DD`)를 읽는다. 형식이 틀리면 무시하고 기본값(flow.md 규칙)을 쓴다.
- 연도는 2000~2100이고 날짜는 실제 존재해야 한다. 요청 월에 속하지 않는 날짜도 기본값으로 처리한다. 월 이동은 이전 선택 날짜를 넘기지 않고, 월 경계의 이동 버튼은 비활성화한다. 월이 바뀌면 초기 선택 날짜를 새로 적용하고 같은 월 데이터 갱신에서는 선택 날짜를 유지하며 최신 거래 props를 사용한다.
- `getCalendarMonthAction` 실패 시 `throw` 해 `(authenticated)/error.tsx` 로 보낸다. 인증 오류는 기존 action-result-handler 규칙(ADR-F26)을 따른다.
- `loading.tsx` 는 월 헤더, 7×5 칸, 목록 세 줄 skeleton.

### 2. `frontend/src/components/calendar/` 신규 컴포넌트

- `CalendarHome.tsx` (`"use client"`): 선택 날짜 상태, 하위 컴포넌트 조립, 「이 날짜에 추가」 다이얼로그 열기.
- `MonthHeader.tsx`: 이전·다음 달 버튼(`aria-label` 「이전 달」, 「다음 달」), `2026년 9월` 제목.
- `MemberTotals.tsx`: `memberExpenseTotals` 를 가입 순서로 색 점, 이름, 금액(`formatCurrency`). 끝에 가족 합계 지출과 수입.
- `CalendarGrid.tsx`: 일요일 시작 7열. 칸마다 날짜와 `memberExpenses` 를 줄마다 색 점과 `formatCompactAmount` 금액. 칸은 공용 `Button` 이며 `aria-label` 에 날짜와 구성원별 금액을 문장으로 넣는다(예: 「9월 14일, 아내 32,000원, 남편 11,000원」). `aria-pressed` 로 선택 표시.
- `DayTransactionList.tsx`: 선택 날짜 제목과 그날 지출 합계를 표시한다. 제목 예시는 「9월 14일 (월)」이다. 그날 지출과 수입을 시간순으로 `TransactionRow` 에 넘기며 `tx.createdBy` 에 구성원 이름과 색을 준다. 비었으면 EmptyState에 「이 날 기록이 없어요」를 표시한다. 맨 아래 「이 날짜에 추가」 버튼은 선택 날짜를 `defaultDate` 로 주어 `AddTransactionDialog` 를 연다. 항목을 누르면 `EditTransactionDialog` 를 연다.

### 3. 첫 화면 전환: `frontend/src/app/page.tsx`, `frontend/src/components/layout/Header.tsx`, 가족·초대 흐름

- 로그인 뒤 redirect 대상을 대시보드에서 `/calendar` 로.
- Header 로고 링크를 `/calendar` 로.
- `flow.md` 「1. 최초 사용자 온보딩」 의 나머지 대시보드 이동(가족 생성, 선택, 초대 수락 뒤)을 코드에서 찾아 모두 `/calendar` 로 바꾼다. 찾는 명령은 `git grep -n 'dashboard"' -- frontend/src` 다. 찾은 파일은 이 phase 의 변경 파일 표에 더한다. `revalidatePath` 안의 것은 phase 02 가 이미 정리했다.

### 4. `TransactionRow.tsx`: 등록자 표시

- `createdBy` 를 `{ uuid?: string; name: string; colorClass?: string }` 로 넓혀, 색이 오면 아바타 대신 색 점을 쓴다. 기존 호출부 동작은 그대로 둔다.
- 색 점에는 등록자 이름을 화면 텍스트나 접근 가능한 이름으로 제공한다. 항목의 키보드 Enter·Space 동작도 클릭과 동일하게 한다.

### 5. 테스트

- `frontend/src/__tests__/components/calendar/CalendarGrid.test.tsx`: 두 구성원의 같은 날 지출이 두 줄로 줄인 금액과 함께 보인다, 칸 `aria-label` 문장, 칸을 누르면 `onSelect` 가 그 날짜로 불린다.
- `frontend/src/__tests__/components/calendar/DayTransactionList.test.tsx`: 선택 날짜의 지출과 수입만 보인다, 모르는 등록자는 「이전 구성원」, 빈 날은 EmptyState 와 추가 버튼.
- `frontend/src/__tests__/components/calendar/CalendarHome.test.tsx`: 날짜 선택 전후 서버 Action 호출이 늘지 않고 목록이 바뀐다. `history.replaceState`, 월 이동, 선택 날짜 등록·수정, 새 거래 props 반영을 확인한다.
- 달력 Page 테스트에서 최초 조회, 잘못된 월·실제 날짜, 월 불일치, 일반 오류 throw와 인증 오류 로그인 이동을 확인한다. 기존 Header 테스트의 로고 기대 경로도 이 phase에서 바꾼다.

## 검증

```bash
# cwd: <repo root>
cd frontend && pnpm test src/__tests__/components/calendar/CalendarGrid.test.tsx src/__tests__/components/calendar/DayTransactionList.test.tsx src/__tests__/components/calendar/CalendarHome.test.tsx src/__tests__/app/calendar/page.test.tsx src/__tests__/components/layout/Header.test.tsx
pnpm lint && pnpm test
pnpm exec tsc --noEmit
grep -rn 'redirect("/dashboard")' src   # 결과 없음 (phase 05 가 바꿀 dashboard/page.tsx 는 해당 없음)
```

## 변경 파일

| 파일 | 변경 |
|---|---|
| `frontend/src/app/(authenticated)/calendar/page.tsx` | 신규 |
| `frontend/src/app/(authenticated)/calendar/loading.tsx` | 신규 |
| `frontend/src/components/calendar/CalendarHome.tsx` | 신규 |
| `frontend/src/components/calendar/MonthHeader.tsx` | 신규 |
| `frontend/src/components/calendar/MemberTotals.tsx` | 신규 |
| `frontend/src/components/calendar/CalendarGrid.tsx` | 신규 |
| `frontend/src/components/calendar/DayTransactionList.tsx` | 신규 |
| `frontend/src/app/page.tsx` | 수정 |
| `frontend/src/components/layout/Header.tsx` | 수정 |
| `frontend/src/components/transactions/TransactionRow.tsx` | 수정 |
| `frontend/src/__tests__/components/calendar/CalendarGrid.test.tsx` | 신규 |
| `frontend/src/__tests__/components/calendar/DayTransactionList.test.tsx` | 신규 |
| `frontend/src/__tests__/components/calendar/CalendarHome.test.tsx` | 신규 |
| `frontend/src/__tests__/app/calendar/page.test.tsx` | 신규 |
| `frontend/src/__tests__/components/layout/Header.test.tsx` | 수정 |
