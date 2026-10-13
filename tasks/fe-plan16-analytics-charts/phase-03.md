# Phase 03. 분석 도넛이 저장 색을 쓰고 조각마다 다른 색을 갖게 한다

**Execution profile**: standard
**Domain**: color-token

## 목표

분석 화면의 카테고리 도넛, 도넛 옆 범례, 카테고리 상세 목록이 같은 색을 쓰고, 한 차트 안에서 두 조각이 같은 색이 되지 않게 한다.
지금은 이름 표에 없는 카테고리가 모두 회색이라 조각을 구분할 수 없다.

**범위 외**:

- 대시보드 분포(`frontend/src/components/dashboard/CategoryDistribution.tsx`, `CategoryDistributionChart.tsx`)는 바꾸지 않는다. 어느 화면에서도 쓰지 않는다(`frontend/docs/code-architecture.md`).
- 지출 TOP 5, 예산 카테고리 막대, 내역 행, 배지의 이름 톤 색(`getCategoryTone`)은 그대로 둔다.

## 컨텍스트

- 백엔드 `category-breakdown` 응답 항목에는 이미 `color` 가 있다. `frontend/src/lib/schemas/responses/dashboard.ts` 의 `categoryBreakdownResponseSchema` 에서 `color: z.string().nullable()` 이다.
- `frontend/src/services/analytics/analytics-service.ts` 의 `getCategoryBreakdownWithDelta` 가 항목을 `CategoryWithDelta` 로 바꿀 때 `color` 를 버린다.
- `CategoryWithDelta` 는 `frontend/src/types/analytics.ts` 에 있다.
- 저장 색은 카테고리 화면에서 `PALETTE` 8색 중에 고른다. `PALETTE` 는 `frontend/src/app/(authenticated)/categories/_components/category-constants.ts` 에 있고 `AddCategoryDialog.tsx`, `EditCategoryDialog.tsx` 가 import 한다. 예전 데이터는 `#RRGGBB` 일 수 있다(백엔드 `CategoryColor`).
- 색을 이름으로 정하는 곳은 `AnalyticsCategoryDonutChart.tsx:17`, `AnalyticsCategoryDonut.tsx:80`, `CategoryDetailList.tsx:53` 의 `getCategoryTone(item.name)` 이다.
- `CategoryDetailList` 는 `items` 전체를 받아 안에서 `topN` 만큼 자른다.

**근거 문서**: `frontend/docs/flow.md` 의 「카테고리 분포의 색」, `frontend/docs/code-architecture.md` 의 차트 절

## 의도 메모

- 기각: 금액 순위 팔레트만 쓰기. 구분은 확실하지만 달마다 같은 카테고리의 색이 바뀌고 카테고리 화면의 색과 어긋난다.
- 기각: 저장 색만 쓰기. 8색 중에서 고르므로 두 카테고리가 같은 색을 고르면 차트에서 구분되지 않는다.
- 색 배정은 순수 함수로 두고 세 컴포넌트가 각자 부른다. 같은 `items` 를 넣으면 같은 결과가 나와 props 로 넘길 필요가 없다.
- 팔레트는 `lib` 으로 옮긴다. `lib/utils` 가 `app/` 의 경로 전용 모듈을 import 하면 레이어가 거꾸로 선다.
- `style` 속성에 동적 색을 넣는 것은 CODE-2 의 예외(동적 계산)에 해당한다. Tailwind arbitrary class 로 바꾸지 않는다.

## 작업 항목

### 1. `frontend/src/lib/utils/category-palette.ts` 신규, `category-constants.ts` 수정

- `export const CATEGORY_PALETTE: readonly string[]` 에 지금 `PALETTE` 의 8개 값과 주석을 그대로 옮긴다.
- `category-constants.ts` 는 `export const PALETTE: string[] = [...CATEGORY_PALETTE];` 로 바꾼다. 두 다이얼로그는 고치지 않는다.

### 2. `frontend/src/lib/utils/category-chart-color.ts` 신규

```ts
export function getCategoryChartColors(
  items: ReadonlyArray<{ categoryUuid: string; color: string | null; totalAmount: number }>,
): Map<string, string>
```

- 차트 팔레트는 `CATEGORY_PALETTE` 8색 뒤에 어두운 변형 4색 `oklch(0.420 0.100 230)`, `oklch(0.420 0.110 330)`, `oklch(0.420 0.100 152)`, `oklch(0.440 0.100 60)` 을 붙인 12색이다.
- `totalAmount` 내림차순으로 돈다. 같은 금액은 입력 순서를 유지한다.
- 첫 번째 패스: 저장 색이 있고 아직 쓰지 않은 색이면 그 색을 쓴다. 색 비교는 `trim().toLowerCase()` 로 맞춘다.
- 두 번째 패스: 남은 항목에 금액 순서대로 아직 쓰지 않은 차트 팔레트 색을 준다. 다 쓰면 팔레트 처음부터 다시 돈다.
- 반환 Map 의 키는 `categoryUuid` 다.

### 3. `CategoryWithDelta.color` 와 서비스 변환

- `frontend/src/types/analytics.ts` 의 `CategoryWithDelta` 에 `color: string | null; // 카테고리 화면에서 고른 저장 색. 없으면 null` 을 더한다.
- `getCategoryBreakdownWithDelta` 의 항목 변환에 `color: item.color` 를 더한다.
- 타입이 바뀌어 깨지는 테스트 fixture 에 `color` 를 채운다. `frontend/src/__tests__/components/analytics/CategoryDetailList.test.tsx`, `frontend/src/__tests__/components/lazy-charts.test.tsx`, `frontend/src/__tests__/services/analytics/analytics-service.test.ts` 다. `pnpm tsc --noEmit` 이 다른 파일을 가리키면 그 파일도 변경 파일에 더한다.

### 4. 세 컴포넌트가 배정한 색을 쓴다

- `AnalyticsCategoryDonutChart.tsx`: `getCategoryChartColors(breakdown.items)` 로 받은 색을 `fill` 에 쓴다.
- `AnalyticsCategoryDonut.tsx`: 범례 점의 `background` 를 같은 함수의 색으로 바꾼다.
- `CategoryDetailList.tsx`: 자르기 전의 `items` 로 색을 받는다. 아이콘 칸은 `background: color-mix(in srgb, ${color} 16%, transparent)` 와 `color: ${color}`, 진행 막대는 `background: ${color}` 를 쓴다. 카테고리 화면 `CategoryItem.tsx` 의 아이콘 칸과 같은 섞는 비율이다.
- 세 파일에서 `getCategoryTone` import 를 지운다.

### 5. 이 phase 를 검증하는 테스트

`frontend/src/__tests__/lib/utils/category-chart-color.test.ts` 신규:

- 저장 색이 서로 다르면 그대로 쓴다.
- 두 항목의 저장 색이 같으면 금액이 큰 쪽이 그 색을 갖고, 작은 쪽은 쓰지 않은 팔레트 색을 받는다. 대소문자와 공백만 다른 색도 같은 색으로 본다.
- 저장 색이 null 이면 쓰지 않은 팔레트 색을 받는다.
- 입력 순서와 관계없이 금액 순서로 배정한다.
- 13개를 넣어도 throw 하지 않고 모든 키에 색이 있다.

`frontend/browser/fake-backend.mjs` 의 `category-breakdown` 응답 항목을 셋으로 바꾼다. `totalExpense` 16200 은 그대로 둔다.

- 식비 10000, 61.73%, 식비의 저장 색
- 교통 4000, 24.69%, 교통의 저장 색
- 생활 2200, 13.58%, 색은 식비와 같은 `oklch(0.560 0.140 35)`
- 세 항목 모두 `deltaPercent: null`, `previousAmount: null` 이다.

`frontend/browser/analytics-charts.spec.ts` 에 테스트를 더한다.

- `/analytics` 의 도넛 조각(`.recharts-pie-sector path`) 3개의 `fill` 값이 서로 다르다.
- 「생활」 범례 점의 계산된 배경색이 회색이 아니다. 같은 파일에 `colorLightness` 와 같은 방식으로 oklch chroma 를 읽는 함수를 두고 0.05 보다 크다는 것을 단언한다.

## 검증

```bash
cd frontend && pnpm exec jest src/__tests__/lib/utils/category-chart-color.test.ts src/__tests__/components/analytics src/__tests__/services/analytics src/__tests__/components/lazy-charts.test.tsx
cd frontend && pnpm tsc --noEmit && pnpm lint && pnpm lint:md && pnpm test
cd frontend && pnpm test:browser analytics-charts.spec.ts
cd frontend && pnpm test:browser
```

- 세 번째 줄은 바꾼 분포 응답을 쓰는 새 단언만 돌린다. 네 번째 줄은 같은 가짜 응답을 쓰는 다른 spec 이 깨지지 않았는지 본다.

```bash
cd frontend && ! git grep -n "getCategoryTone" -- "src/app/(authenticated)/analytics/_components/AnalyticsCategoryDonutChart.tsx" "src/app/(authenticated)/analytics/_components/AnalyticsCategoryDonut.tsx" "src/app/(authenticated)/analytics/_components/CategoryDetailList.tsx"
```

## 변경 파일

| 파일 | 변경 |
|---|---|
| `frontend/src/lib/utils/category-palette.ts` | 신규 |
| `frontend/src/lib/utils/category-chart-color.ts` | 신규 |
| `frontend/src/app/(authenticated)/categories/_components/category-constants.ts` | 수정 |
| `frontend/src/types/analytics.ts` | 수정 |
| `frontend/src/services/analytics/analytics-service.ts` | 수정 |
| `frontend/src/app/(authenticated)/analytics/_components/AnalyticsCategoryDonutChart.tsx` | 수정 |
| `frontend/src/app/(authenticated)/analytics/_components/AnalyticsCategoryDonut.tsx` | 수정 |
| `frontend/src/app/(authenticated)/analytics/_components/CategoryDetailList.tsx` | 수정 |
| `frontend/src/__tests__/lib/utils/category-chart-color.test.ts` | 신규 |
| `frontend/src/__tests__/components/analytics/CategoryDetailList.test.tsx` | 수정 |
| `frontend/src/__tests__/components/lazy-charts.test.tsx` | 수정 |
| `frontend/src/__tests__/services/analytics/analytics-service.test.ts` | 수정 |
| `frontend/browser/fake-backend.mjs` | 수정 |
| `frontend/browser/analytics-charts.spec.ts` | 수정 |
