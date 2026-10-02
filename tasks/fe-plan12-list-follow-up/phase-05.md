# Phase 05. 분석 지출 TOP 5 의 카테고리 표시

**Execution profile**: fast
**Domain**: app-router

## 목표

분석 화면 지출 TOP 5 가 실제 카테고리 아이콘과 이름을 보인다. 그 달 지출이 1000건을 넘으면 그 사실을 알린다.

**범위 외**: TOP 5 를 백엔드 금액 정렬로 바꾸는 일은 `frontend/docs/prd.md` 「후속 검토」 에 그대로 둔다.

## 컨텍스트

모든 경로는 저장소 root 기준이다. 명령은 `frontend/` 에서 돌린다.

**근거 문서**: `frontend/docs/flow.md` 의 「5-2」, 「6. 예산 알림 플로우」, `/categories` 절, `frontend/docs/adr/ADR-F39-navigation-pending-feedback.md`(화면 이동은 `useAppRouter`).

코드에서 확인한 사실:

- `frontend/src/app/(authenticated)/analytics/page.tsx` 66행이 `getExpensesAction({ familyUuid, startDate, endDate, limit: 1000 })` 으로 그 달 지출을 받는다. 카테고리 목록은 받지 않는다.
- `frontend/src/app/(authenticated)/analytics/_components/AnalyticsClient.tsx` 123-126행이 금액 내림차순 5건을 고르고, 242-251행이 `expense.category?.icon`, `expense.category?.name` 을 쓴다. 목록 응답에는 `category` 가 없고 `categoryUuid` 만 있어(백엔드 `ExpenseResponse::fromWithoutCategory`) 늘 「💸」, 「기타」 로 보인다. 91행 월 이동도 같은 호출이다.
- 카테고리 목록은 `frontend/src/actions/category/get-categories-action.ts` 의 `getFamilyCategoriesAction(familyUuid)` 로 받는다.

## 의도 메모

- `page.tsx` 가 카테고리 목록을 함께 받아 `AnalyticsClient` 에 넘기고, `categoryUuid` 로 맵을 만들어 찾는다(`ExpenseListClient` 와 같은 방식). 아이콘 바탕은 `getCategoryToneStyle` 을 쓴다.
- 받은 지출이 1000건이면 TOP 5 제목 옆에 「상위 1000건 안에서 골랐어요」(`text-xs text-fg-muted`)를 보인다.

## 작업 항목

### 1. `page.tsx` 에서 카테고리 목록 받기와 전달

### 2. TOP 5 를 `frontend/src/app/(authenticated)/analytics/_components/AnalyticsTopExpenses.tsx`(신규)로 떼고 카테고리 찾기와 1000건 안내

### 3. 테스트

- `frontend/src/__tests__/app/analytics/page.test.tsx`(수정): 카테고리 목록을 함께 받는다.
- `frontend/src/__tests__/components/analytics/AnalyticsTopExpenses.test.tsx`(신규): `categoryUuid` 에 맞는 카테고리 이름과 아이콘이 보이고, 1000건이면 안내가 보인다.

## 검증

`frontend/` 에서 실행한다.

```bash
pnpm tsc --noEmit && pnpm lint && pnpm lint:md && pnpm test
pnpm test src/__tests__/app/analytics/page.test.tsx src/__tests__/components/analytics/AnalyticsTopExpenses.test.tsx
pnpm test:browser
```

기대값: 모든 명령이 성공한다.

## 변경 파일

| 파일 | 변경 |
|---|---|
| `frontend/src/app/(authenticated)/analytics/page.tsx` | 수정 |
| `frontend/src/app/(authenticated)/analytics/_components/AnalyticsClient.tsx` | 수정 |
| `frontend/src/app/(authenticated)/analytics/_components/AnalyticsTopExpenses.tsx` | 신규 |
| `frontend/src/__tests__/app/analytics/page.test.tsx` | 수정 |
| `frontend/src/__tests__/components/analytics/AnalyticsTopExpenses.test.tsx` | 신규 |
