# Phase 01. 타입, 달력 조회 service·action, 구성원 색 토큰, 금액 줄임 표기

**Execution profile**: standard
**Domain**: server-action

## 목표

달력 화면(phase 03)이 쓸 데이터 계층과 표시 도구를 만든다. 화면은 아직 만들지 않는다.

**범위 외**: 다이얼로그는 phase 02, 화면 컴포넌트는 phase 03, 탐색은 phase 04, 대시보드 이전은 phase 05 다.

## 선행 조건

백엔드 계획 `be-plan001` 이 main 에 머지돼 있어야 한다. 이 phase 가 부르는 세 API 가 거기서 생긴다.

- 지출·수입 응답의 `userUuid`
- `daily-stats` 의 `memberExpenses`, `memberExpenseTotals`
- `GET /families/{uuid}/members`

main 에 없으면 `PHASE_BLOCKED: be-plan001 미머지` 를 출력하고 멈춘다. 확인: `git log origin/main --oneline | grep -i "be-plan001\|member-daily-stats"`.

## 컨텍스트

- 레이어는 `actions/` → `services/` → `lib/server/api/` 다(ADR-F04). Server Action 권한 검증은 ADR-F25 의 A 패턴(Single-family: `requireAuth()` 와 `getSelectedFamilyUuid()`)이다. 선례는 `frontend/src/actions/dashboard/get-monthly-daily-stats-action.ts`.
- 백엔드 호출은 `lib/server/api/client.ts` 의 `serverApiGet<T>(path)` 다.
- 색 토큰은 `frontend/src/app/globals.css` 의 `@theme` 블록에 OKLCH 로만 쓴다(ADR-F13). 강조 배경 위 글자는 전용 foreground 토큰(ADR-F23). 다크 모드는 `[data-theme="dark"]` 셀렉터(ADR-F15).
- 금액 표시 도구는 `frontend/src/lib/utils/format.ts` 에 있다(`formatCurrency` 등).

**근거 문서**: `frontend/docs/flow.md` 의 「5. 달력 홈 (`/calendar`)」, `frontend/docs/data-schema.md` 의 Family, Expense, Income, Dashboard 타입, `frontend/docs/adr.md` 의 ADR-F32, ADR-F04, ADR-F25, ADR-F13

## 의도 메모

- 한 달 목록을 한 번에 받는 이유와 1000건 한계는 ADR-F32 에 있다. 합계는 목록을 더하지 않고 `daily-stats` 값을 쓴다.
- `Family.members` 는 백엔드가 보낸 적이 없는 필드라 지운다. 이를 읽던 대시보드, 설정, 가족 선택기의 잘못된 아바타 표시는 지운다. 인원수는 실제 응답의 `memberCount` 를 사용한다. 구성원 조회는 달력에서만 수행한다.

## 작업 항목

### 1. 타입: `frontend/src/types/expense.ts`, `income.ts`, `family.ts`, `dashboard.ts`

- `Expense`, `Income` 에 `userUuid: string`.
- `family.ts`: `FamilyMemberSummary { userUuid; name: string | null; email: string | null; image: string | null; role: "OWNER" | "MEMBER"; joinedAt: string }`. `Family.members` 와 기존 `FamilyMember` 는 지운다(쓰는 곳 정리는 의도 메모).
- `dashboard.ts`: `MemberAmount { userUuid: string; amount: number }`, `DailyStatsWithMembers` (`frontend/docs/data-schema.md` 의 정의 그대로).
- 달력 화면 모델 `frontend/src/types/calendar.ts` (신규): `CalendarMonth { year; month; daily: DailyStatsWithMembers; expenses: Expense[]; incomes: Income[]; members: FamilyMemberSummary[] }`.

### 2. service: `frontend/src/services/family/family-service.ts`, `frontend/src/services/calendar/calendar-service.ts` (신규)

- `getFamilyMembers(familyUuid): Promise<FamilyMemberSummary[]>` → `GET /families/${familyUuid}/members`.
- `getCalendarMonth(familyUuid, year, month): Promise<CalendarMonth>` 가 네 호출을 `Promise.all` 로 부른다: `dashboard/daily-stats?year&month`, `expenses?startDate&endDate&size=1000`, `incomes?startDate&endDate&size=1000`, `getFamilyMembers`. 날짜 범위는 그 달 1일부터 말일까지 `YYYY-MM-DD`.
- 금액 필드는 `Number()` 로 바꾼다(백엔드 BigDecimal).

### 3. action: `frontend/src/actions/calendar/get-calendar-month-action.ts`, `frontend/src/actions/family/get-family-members-action.ts` (신규)

- `"use server"`, Zod 로 `year`(2000~2100), `month`(1~12) 검증(ADR-F06), A 패턴 권한, `ActionResult<T>` 반환. 선례와 같은 오류 변환.
- `getFamilyMembersAction(): Promise<ActionResult<FamilyMemberSummary[]>>` 는 인자 없이 선택 가족을 조회한다. 달력 Action 테스트에서 정상 응답, 잘못된 월, 가족 미선택, 백엔드 401 변환을 확인한다.

### 4. 표시 도구: `frontend/src/lib/utils/format.ts`, `frontend/src/lib/utils/member-color.ts` (신규), `frontend/src/app/globals.css`

- `formatCompactAmount(amount: number): string`: 1만 이상 `3.2만`(소수 첫째 자리, `.0` 은 뺀다, 100만 이상은 `123만`), 1천 이상 `9.8천`, 그 밖은 정수 그대로. 음수는 앞에 `-`.
- `globals.css`: `--color-member-1` ~ `--color-member-4` 와 다크 모드 값. 서로 구분되는 hue 네 개로, 지출(`--color-expense`)과 수입(`--color-income`) 색과 겹치지 않게 고른다. 점과 글자에 쓰므로 배경 토큰은 두지 않는다.
- `member-color.ts`: `buildMemberColorMap(members: FamilyMemberSummary[]): Map<string, MemberColor>`. 입력 순서(가입 순서)대로 `member-1` ~ `member-4` 를 돌려 쓴다. 없는 `userUuid` 는 `getMemberColor` 가 `neutral` 과 라벨 「이전 구성원」 을 돌려준다. 반환에는 Tailwind 클래스 이름(`bg-member-1`, `text-member-1` 등)과 표시 이름(`name ?? email ?? "구성원"`)을 담는다.

### 5. 테스트

- `frontend/src/__tests__/services/calendar/calendar-service.test.ts`: 네 경로 호출, 금액 숫자 변환, 호출 하나가 실패하면 예외가 전파된다(페이지가 error.tsx 로 간다).
- `frontend/src/__tests__/lib/format-compact-amount.test.ts`: 0, 800, 9800, 10000, 32400, 1234567, -5000.
- `frontend/src/__tests__/lib/member-color.test.ts`: 가입 순서대로 색, 다섯 번째 구성원이 `member-1` 로 돌아온다, 모르는 uuid 는 「이전 구성원」.
- 기존 수정 다이얼로그의 지출·수입 fixture에 `userUuid` 를 추가하고 설정 fixture의 `members` 를 제거한다. 서비스 금액 변환은 일별·구성원별·가족 합계와 거래 목록 모두를 확인한다.

## 검증

```bash
# cwd: <repo root>
cd frontend && pnpm test src/__tests__/services/calendar/calendar-service.test.ts src/__tests__/lib/format-compact-amount.test.ts src/__tests__/lib/member-color.test.ts src/__tests__/actions/calendar/get-calendar-month-action.test.ts
pnpm lint && pnpm test
pnpm exec tsc --noEmit
```

## 변경 파일

| 파일 | 변경 |
|---|---|
| `frontend/src/types/expense.ts` | 수정 |
| `frontend/src/types/income.ts` | 수정 |
| `frontend/src/types/family.ts` | 수정 |
| `frontend/src/types/dashboard.ts` | 수정 |
| `frontend/src/types/calendar.ts` | 신규 |
| `frontend/src/services/family/family-service.ts` | 수정 |
| `frontend/src/services/calendar/calendar-service.ts` | 신규 |
| `frontend/src/actions/calendar/get-calendar-month-action.ts` | 신규 |
| `frontend/src/actions/family/get-family-members-action.ts` | 신규 |
| `frontend/src/lib/utils/format.ts` | 수정 |
| `frontend/src/lib/utils/member-color.ts` | 신규 |
| `frontend/src/app/globals.css` | 수정 |
| `frontend/src/app/(authenticated)/dashboard/page.tsx` | 수정 |
| `frontend/src/app/(authenticated)/settings/_components/SettingsPageClient.tsx` | 수정 |
| `frontend/src/components/families/FamilySelector.tsx` | 수정 |
| `frontend/src/__tests__/services/calendar/calendar-service.test.ts` | 신규 |
| `frontend/src/__tests__/lib/format-compact-amount.test.ts` | 신규 |
| `frontend/src/__tests__/lib/member-color.test.ts` | 신규 |
| `frontend/src/__tests__/actions/calendar/get-calendar-month-action.test.ts` | 신규 |
| `frontend/src/__tests__/components/transactions/dialogs/EditTransactionDialog.test.tsx` | 수정 |
| `frontend/src/__tests__/components/settings/SettingsPageClient.test.tsx` | 수정 |
