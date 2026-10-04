# Phase 01. 프론트엔드: 구성원 누적 금액을 지우고 색 범례만 남긴다

**Execution profile**: fast
**Domain**: app-router

## 목표

달력 홈 `/calendar` 에서 구성원별 월 누적 금액과 「가족 지출 / 가족 수입」 줄을 지운다.
달력 칸의 색이 누구인지 알려 주는 범례(색 점과 이름)만 남긴다.
프론트엔드가 `daily-stats` 응답의 `memberExpenseTotals` 를 더 읽지 않게 해서, 다음 phase 에서 백엔드가 그 필드를 지워도 홈이 깨지지 않게 한다.

**범위 외**: 백엔드 `DailyStatsResponse` 와 `DashboardService` 변경은 phase 02 가 한다. `totalIncome`, `totalExpense` 응답 필드는 그대로 둔다.

## 컨텍스트

- 홈 컴포넌트 트리는 `frontend/src/components/calendar/CalendarHome.tsx` 다. 지금은 `BudgetSummaryCard` 바로 아래에서 `<MemberTotals daily={data.daily} colors={colors} />` 를 그린다.
- `frontend/src/components/calendar/MemberTotals.tsx` 는 두 부분이다.
  - 구성원 줄: `colors` 의 키와 `daily.memberExpenseTotals` 의 키를 합쳐 색 점, 이름, 금액을 그린다.
  - 가족 합계 줄: `daily.totalExpense`, `daily.totalIncome` 을 그린다.
- `colors` 는 `buildMemberColorMap(data.members)` (`frontend/src/lib/utils/member-color.ts`) 가 만든다. 가입 순서이고 값의 `label` 과 `bgClass` 로 이름과 색을 그린다.
- 응답 스키마 `dailyStatsResponseSchema` 는 `frontend/src/lib/schemas/responses/calendar.ts` 에 있고 `satisfies z.ZodType<DailyStatsWithMembers>` 로 `frontend/src/types/dashboard.ts` 의 타입과 묶여 있다. 두 곳에서 함께 지워야 타입 검사가 통과한다.
- zod `z.object` 는 모르는 키를 버리므로, 필드를 지운 뒤 백엔드가 아직 `memberExpenseTotals` 를 보내도 파싱은 성공한다.

**근거 문서**: `frontend/docs/flow.md` 의 「달력 홈」 트리(`MemberLegend` 줄), `frontend/docs/data-schema.md` 의 「Dashboard」 절, `frontend/docs/code-architecture.md` 의 디렉터리 트리.

## 의도 메모

- 컴포넌트를 통째로 지우지 않는 이유: 달력 칸은 구성원별 금액을 색으로만 구분한다. 범례가 없으면 어느 색이 누구인지 화면에서 알 수 없다.
- 범례는 `colors` 만으로 그린다. 금액이 없는 구성원도 범례에 나온다. 이전 구성원(`colors` 에 없는 userUuid)은 범례에 넣지 않는다. 그 색은 날짜 목록에서 「이전 구성원」 으로 보인다.

## 작업 항목

### 1. `frontend/src/components/calendar/MemberLegend.tsx` 신규, `MemberTotals.tsx` 삭제

- `export function MemberLegend({ colors }: { colors: Map<string, MemberColor> })`.
- `<ul aria-label="구성원 색상" className="flex flex-wrap gap-x-5 gap-y-2 px-1 text-xs">` 안에 `colors` 의 값마다 `<li>` 하나. 색 점은 기존 `MemberTotals` 의 `<span className={\`size-1.5 rounded-full ${member.bgClass}\`} aria-hidden="true" />` 을 그대로 쓰고 이름은 `text-fg-muted` 로 쓴다. 금액은 그리지 않는다.
- `colors.size === 0` 이면 `null` 을 돌려준다.
- `MemberTotals.tsx` 는 지운다.

### 2. `frontend/src/components/calendar/CalendarHome.tsx`

- `MemberTotals` import 와 사용을 `MemberLegend` 로 바꾼다: `<MemberLegend colors={colors} />`. 위치는 그대로 `BudgetSummaryCard` 아래다.

### 3. 응답 타입과 스키마에서 `memberExpenseTotals` 를 지운다

- `frontend/src/types/dashboard.ts` 의 `DailyStatsWithMembers.memberExpenseTotals` 를 지운다.
- `frontend/src/lib/schemas/responses/calendar.ts` 의 `memberExpenseTotals: z.array(memberAmountSchema),` 를 지운다. `memberAmountSchema` 는 `memberExpenses` 가 계속 쓴다.
- `frontend/src/test-fixtures/calendar.ts` 와 브라우저 테스트용 가짜 백엔드 `frontend/browser/fake-backend.mjs` 의 `memberExpenseTotals` 값을 지운다.

### 4. 테스트를 고친다

- `frontend/src/__tests__/components/calendar/CalendarHome.test.tsx` 의 「구성원 합계는 목록 금액 대신 서버 합계를 가입 순서로 표시한다」 를 바꾼다. 새 이름은 「구성원 색 범례는 가입 순서로 이름만 보이고 금액은 보이지 않는다」 다.
  - `screen.getByRole("list", { name: "구성원 색상" }).textContent` 가 `"아내남편"` 이다(픽스처 가입 순서).
  - 가족 합계 줄이 그리던 `₩99,000` 과 `₩120,000` 텍스트가 화면에 없다(`queryByText` 가 `null`). 픽스처의 예산 카드 금액은 이 두 값과 다르다.
- `frontend/src/__tests__/lib/schemas/responses/transaction.test.ts` 의 `dailyStats` 픽스처에서 `memberExpenseTotals` 를 지운다. 「memberExpenseTotals 가 빠지면 실패한다」 케이스는 지우고, 대신 「memberExpenseTotals 가 있어도 통과하고 결과에서 빠진다」 케이스를 둔다(백엔드 배포 순서와 무관하게 홈이 깨지지 않는다는 것을 고정한다).
- `frontend/src/__tests__/services/calendar/calendar-service.test.ts`, `frontend/src/__tests__/actions/calendar/get-calendar-month-action.test.ts` 의 `memberExpenseTotals` 값을 지운다.

## 검증

```bash
cd frontend && pnpm tsc --noEmit && pnpm lint && pnpm lint:md && pnpm test
```

```bash
cd frontend && pnpm exec jest src/__tests__/components/calendar/CalendarHome.test.tsx src/__tests__/lib/schemas/responses/transaction.test.ts src/__tests__/services/calendar/calendar-service.test.ts src/__tests__/actions/calendar/get-calendar-month-action.test.ts
```

```bash
cd frontend && pnpm test:browser browser/calendar.spec.ts
```

```bash
# 저장소 루트에서 실행한다. 운영 코드와 가짜 백엔드에 남은 참조가 없어야 한다. 테스트는 배포 순서를 고정하려고 이 이름을 담으므로 뺀다
! git grep -n "memberExpenseTotals\|MemberTotals" -- frontend/src frontend/browser ':!frontend/src/__tests__'
```

## 변경 파일

| 파일 | 변경 |
|---|---|
| `frontend/src/components/calendar/MemberLegend.tsx` | 신규 |
| `frontend/src/components/calendar/MemberTotals.tsx` | 삭제 |
| `frontend/src/components/calendar/CalendarHome.tsx` | 수정 |
| `frontend/src/types/dashboard.ts` | 수정 |
| `frontend/src/lib/schemas/responses/calendar.ts` | 수정 |
| `frontend/src/test-fixtures/calendar.ts` | 수정 |
| `frontend/browser/fake-backend.mjs` | 수정 |
| `frontend/src/__tests__/components/calendar/CalendarHome.test.tsx` | 수정 |
| `frontend/src/__tests__/lib/schemas/responses/transaction.test.ts` | 수정 |
| `frontend/src/__tests__/services/calendar/calendar-service.test.ts` | 수정 |
| `frontend/src/__tests__/actions/calendar/get-calendar-month-action.test.ts` | 수정 |
| `frontend/browser/calendar.spec.ts` | 수정 |
