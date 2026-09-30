# Phase 01. 월 합계와 추이를 백엔드 집계 API 로 전환

**Execution profile**: standard
**Domain**: server-action

## 목표

`services/dashboard/dashboard-service.ts` 와 `services/analytics/analytics-service.ts` 가 지출·수입 목록을 `size=1000` 으로 받아 더하던 것을 백엔드 집계 API 호출로 바꾼다.
함수의 이름, 인자, 반환 타입은 그대로 둔다. 호출하는 Action 과 화면은 고치지 않는다.

**범위 외**: 내역 화면, HTTP 클라이언트, 차트 지연 로드는 phase 02 다. 분석 화면의 `getExpensesAction({ limit: 1000 })` 호출(지출 상위 5건 표시용)은 남긴다. `CalendarView`, `dashboard/page.tsx`, `revalidatePath` 가 있는 action 파일은 다른 계획이 고치므로 건드리지 않는다.

## 컨텍스트

- 레이어는 `actions/` → `services/` → `lib/server/api/` 다(ADR-F04). 이 phase 는 `services/` 만 고친다.
- 백엔드 호출은 `lib/server/api/client.ts` 의 `serverApiGet<T>(path)` 를 쓴다. 경로는 `BACKEND_API_URL`(`.../api/v1`) 뒤에 붙는 상대 경로다. 응답 envelope 은 `serverApiGet` 이 벗겨 `data` 를 돌려준다. 기존 `getRecentExpenses` 가 선례다.
- 백엔드 응답 (모두 `GET /families/{familyUuid}/dashboard/...`):

| 경로 | 응답 `data` |
|---|---|
| `daily-stats?year&month` | `{ year, month, dailyStats: [{ date: "YYYY-MM-DD", income, expense }], totalIncome, totalExpense }`. 거래가 있는 날만 날짜 오름차순 |
| `stats/category-breakdown?year&month&compareWithPrev=true\|false` | `{ year, month, totalExpense, items: [{ categoryUuid, name, icon, color, totalAmount, percentage, deltaPercent }] }`. 금액 내림차순. `percentage` 는 소수 둘째 자리. `deltaPercent` 는 `compareWithPrev=false` 이거나 직전 달 금액이 없거나 0 이면 null. 카테고리가 삭제됐으면 `name`, `icon`, `color` 가 null |
| `stats/monthly-trend?from=YYYY-MM&to=YYYY-MM` | `{ points: [{ year, month, totalExpense }], average }`. 지출이 있는 달만 오름차순. `from` 이 `to` 보다 뒤면 400 |

  금액 필드는 백엔드 `BigDecimal` 이라 JSON 숫자로 온다. 프론트 타입은 `number` 로 받는다.
- 합산 규칙은 백엔드가 소유한다. 삭제되지 않은 지출을 모두 더하고 예산 제외 표시는 보지 않는다. 기존 프론트 집계도 예산 제외를 보지 않았다.

**근거 문서**: `frontend/docs/adr.md` 의 ADR-F30, ADR-F04. `frontend/docs/flow.md` 의 「5. 대시보드 데이터 흐름」, 「5-3. /analytics 페이지 구조」

## 의도 메모

- 반환 타입을 바꾸지 않는 이유: 다른 계획이 같은 시기에 `CalendarView` 와 대시보드 화면을 고친다. 타입이 같아야 두 브랜치가 충돌 없이 머지된다.
- `getMonthlyCategoryBreakdown` 의 `percentage` 는 기존처럼 정수(`Math.round`)로 돌려준다. 기존 테스트와 화면이 정수를 가정한다.
- 이전 코드는 금액이 0 이하인 지출을 건너뛰었다. 백엔드 합계는 건너뛰지 않는다. 금액이 0 이하인 지출은 등록 검증에서 막히므로 결과는 같다.
- 실패 처리: 기존 함수는 목록 조회 실패를 `.catch(() => ({ items: [] }))` 로 빈 결과로 바꿨다. 집계 호출 실패도 빈 결과(합계 0, 항목 없음)로 바꾼다. 인증 오류는 빈 결과로 바꾸지 않고 다시 던진다. 판별은 `lib/server/api/types.ts` 의 `ServerApiError` 이고 `status === 401` 인 경우다. Action 계층이 이를 `A002` 로 바꿔 로그인으로 보낸다(ADR-F26).

## 작업 항목

### 1. `frontend/src/services/dashboard/dashboard-service.ts` — 일별 합계

- `getMonthlyDailyStats(familyUuid, year, month): Promise<DailyTransactionSummary[]>` 가 `daily-stats?year=${year}&month=${month}` 를 부르고 `dailyStats` 를 `{ date, income, expense }` 배열로 돌려준다.
- `MONTHLY_FETCH_PAGE_SIZE`, `RawIncomeResponse` 와 날짜 파싱 코드는 더 쓰이지 않으면 지운다.

### 2. `frontend/src/services/dashboard/dashboard-service.ts` — 카테고리 월 분포

- `getMonthlyCategoryBreakdown(familyUuid, year, month): Promise<MonthlyCategoryBreakdown>` 가 `stats/category-breakdown?year&month&compareWithPrev=false` 를 부른다.
- 항목 변환: `name ?? "Unknown"`, `icon ?? "💰"`, `color ?? undefined`, `percentage: Math.round(percentage)`.
- `getCachedFamilyCategories` 조회는 이 함수에서 필요 없으므로 뺀다. `getRecentExpenses` 는 계속 쓴다.

### 3. `frontend/src/services/analytics/analytics-service.ts` — 추이와 전월 대비

- `getMonthlyTrend(familyUuid, period, refYear, refMonth)`:
  - 기존처럼 `targets` 배열(오름차순, 개월 수 = `PERIOD_TO_MONTHS[period]`)을 만든다.
  - `monthly-trend?from=<targets[0]>&to=<refYear-refMonth>` 를 한 번 부른다. `YYYY-MM` 은 두 자리 월로 만든다.
  - 응답 `points` 를 `year-month` 키로 찾아 없는 달은 `totalExpense: 0` 으로 채운다. `average` 는 기존 규칙대로 프론트가 `Math.round(합계 / 개월 수)` 로 계산한다. 백엔드 `average` 는 지출이 있는 달로만 나누므로 쓰지 않는다.
- `getCategoryBreakdownWithDelta(familyUuid, year, month)`:
  - `stats/category-breakdown?year&month&compareWithPrev=true` 와 `monthly-trend?from=<직전 달>&to=<이번 달>` 을 `Promise.all` 로 부른다.
  - 항목의 `deltaPercent` 는 백엔드 값을 `Math.round` 한다. null 은 그대로 둔다.
  - `totalDelta` 는 `monthly-trend` 의 두 달 합계로 기존 `computeDelta(current, previous)` 를 쓴다. 응답에 없는 달은 0 이다.
  - `getMonthlyCategoryBreakdown` 을 더는 import 하지 않는다.

### 4. `frontend/src/__tests__/services/dashboard/getMonthlyCategoryBreakdown.test.ts`, `frontend/src/__tests__/services/analytics/analytics-service.test.ts` — 테스트 교체

- 기존 테스트는 목록 응답을 mock 하거나 `getMonthlyCategoryBreakdown` 을 mock 한다. `serverApiGet` 을 경로별로 mock 하는 방식으로 바꾼다(ADR-F09, jest.mock).
- 확인할 것:
  - `getMonthlyCategoryBreakdown`: 호출 경로에 `compareWithPrev=false` 가 있고, 이름이 null 인 항목이 `"Unknown"` 으로, `percentage` 33.33 이 33 으로 바뀐다
  - `getMonthlyTrend`: `y1` 에서 호출이 한 번이고 `from` 이 11개월 전(연도 경계 포함)이며, 응답에 없는 달이 0 으로 채워져 점이 12개다
  - `getCategoryBreakdownWithDelta`: 직전 달이 응답에 없으면 `totalDelta` 가 null, 1월이면 직전 달이 전년 12월
  - 실패: 집계 호출이 `ServerApiError(status 500)` 면 빈 결과, `ServerApiError(status 401)` 이면 다시 던진다
- `getMonthlyDailyStats` 테스트가 없으면 `frontend/src/__tests__/services/dashboard/getMonthlyDailyStats.test.ts` 를 새로 만들어 경로와 변환을 확인한다.

## 검증

```bash
# cwd: <repo root>
cd frontend && pnpm lint && pnpm test
grep -n "size=\${MONTHLY_FETCH_PAGE_SIZE}\|MONTHLY_FETCH_PAGE_SIZE" src/services   # 결과 없음
grep -rn "getMonthlyCategoryBreakdown" src/services/analytics                    # 결과 없음
```

## Critical Files

| 파일 | 변경 |
|---|---|
| `frontend/src/services/dashboard/dashboard-service.ts` | 수정 |
| `frontend/src/services/analytics/analytics-service.ts` | 수정 |
| `frontend/src/__tests__/services/dashboard/getMonthlyCategoryBreakdown.test.ts` | 수정 |
| `frontend/src/__tests__/services/analytics/analytics-service.test.ts` | 수정 |
| `frontend/src/__tests__/services/dashboard/getMonthlyDailyStats.test.ts` | 신규 (없을 때) |
