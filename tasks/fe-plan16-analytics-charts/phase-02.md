# Phase 02. 월별 추이 조회 실패를 실패 카드로 보인다

**Execution profile**: fast
**Domain**: app-router

## 목표

월별 추이 조회가 실패하면 0원 막대 대신 이미 있는 「월별 추이를 불러오지 못했습니다」 카드를 보인다.
지금은 실패와 지출이 없는 달을 화면에서 구분할 수 없다.

**범위 외**: 카테고리 분포의 `getCategoryBreakdownWithDelta` 실패 처리는 바꾸지 않는다. 그 안의 두 달 `monthly-trend` 호출도 지금처럼 빈 값으로 바꾼다.

## 컨텍스트

- `frontend/src/services/analytics/analytics-service.ts` 의 `getMonthlyTrend` 는 `serverApiGet(...).catch(emptyOnFailure<MonthlyTrendResponse>({ points: [], average: 0 }))` 로 401 이 아닌 실패를 모두 빈 응답으로 바꾼다.
- `frontend/src/actions/analytics/get-monthly-trend-action.ts` 는 throw 를 `handleActionError` 로 실패 결과로 바꾼다. 고치지 않는다.
- `frontend/src/app/(authenticated)/analytics/page.tsx` 는 모든 결과를 돌며 `A001`, `A002` 면 `handleActionError(result)` 로 로그인에 보낸다. 그 뒤 `getAnalyticsData(result)` 가 실패 결과를 throw 해 오류 화면으로 보낸다.
- `frontend/src/app/(authenticated)/analytics/_components/AnalyticsClient.tsx` 는 `initialTrend: MonthlyTrend | null` 을 받고, null 이면 「월별 추이를 불러오지 못했습니다」 카드를 그린다. 고치지 않는다.

**근거 문서**: `frontend/docs/flow.md` 의 「5-3. /analytics 페이지 구조」 끝 문단(월별 추이 조회만 예외)

## 의도 메모

- 실패를 page 에서 null 로 바꾸고 서비스에서 바꾸지 않는다. 서비스가 null 을 돌려주면 `MonthlyTrend` 타입이 흐려지고 다른 호출부가 생길 때 다시 숨는다.
- 인증 실패는 지금처럼 로그인으로 보낸다. page 의 인증 검사 루프가 null 처리보다 먼저 돈다.

## 작업 항목

### 1. `analytics-service.ts` 의 `getMonthlyTrend`

- `getMonthlyTrend` 의 `serverApiGet` 에서 `.catch(emptyOnFailure<MonthlyTrendResponse>(...))` 를 지운다. 실패는 그대로 throw 한다.
- `getCategoryBreakdownWithDelta` 의 `emptyOnFailure` 두 곳은 그대로 둔다. 지운 뒤 `MonthlyTrendResponse` import 가 아직 쓰이는지 확인한다.

### 2. `page.tsx` 의 추이 결과

- `const trend = getAnalyticsData(trendResult);` 를 `const trend = trendResult.success ? trendResult.data : null;` 로 바꾼다.
- 그 위의 인증 검사 루프와 `results` 배열은 바꾸지 않는다.

### 3. 이 phase 를 검증하는 `frontend/src/__tests__/services/analytics/analytics-service.test.ts`

- `getMonthlyTrend` 의 `it.each` 테스트 「일반 실패와 응답 계약 위반에도 세 달의 점을 유지한다」 를 「일반 실패와 응답 계약 위반을 그대로 전파한다」 로 바꾼다. 같은 세 입력(`ServerApiError` 500, `Error("network")`, `ResponseValidationError`)에서 `rejects.toBe(error)` 를 단언한다.
- 「401은 전파한다」 는 그대로 둔다.

### 4. 이 phase 를 검증하는 `frontend/src/__tests__/app/analytics/page.test.tsx`

- 「각 조회의 일반 오류는 기본값으로 숨기지 않고 오류 화면으로 전달한다」 의 `it.each` 목록에서 `getMonthlyTrendAction` 을 뺀다.
- 새 테스트 「월별 추이 조회의 일반 오류는 추이 카드에만 실패를 보인다」: `getMonthlyTrendAction` 이 `{ success: false, error: { code: "C001", message: "조회 실패" } }` 를 돌려줄 때 page 가 throw 하지 않고, 렌더링 결과에 「월별 추이를 불러오지 못했습니다」 와 「이번 달」 제목이 함께 있으며 `redirect` 가 불리지 않는다.
- 「어느 조회에서든 인증 만료가 오면 로그인으로 보낸다」 는 `getMonthlyTrendAction` 을 포함한 채 그대로 통과해야 한다.

## 검증

```bash
cd frontend && pnpm exec jest src/__tests__/services/analytics/analytics-service.test.ts src/__tests__/app/analytics/page.test.tsx
cd frontend && pnpm tsc --noEmit && pnpm lint && pnpm test
cd frontend && pnpm test:browser analytics-charts.spec.ts
```

- 세 번째 줄은 phase 01 의 가짜 추이 응답이 있어 막대가 그대로 보이는지 확인한다.

## 변경 파일

| 파일 | 변경 |
|---|---|
| `frontend/src/services/analytics/analytics-service.ts` | 수정 |
| `frontend/src/app/(authenticated)/analytics/page.tsx` | 수정 |
| `frontend/src/__tests__/services/analytics/analytics-service.test.ts` | 수정 |
| `frontend/src/__tests__/app/analytics/page.test.tsx` | 수정 |
