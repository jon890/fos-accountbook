# Phase 04. 요약 행 재클릭 해제, 카테고리 카드 탭 수정, 예산 알림 이동

**Execution profile**: fast
**Domain**: app-router

## 목표

카테고리별 지출 요약에서 걸러 보는 행을 다시 누르면 필터가 풀린다. 카테고리 관리 화면의 카드를 누르면 수정 창이 열린다. 예산 알림을 누르면 읽음 처리와 함께 예산 화면으로 간다.

**범위 외**: 목록 받기와 필터는 phase 01 부터 03 이다.

## 컨텍스트

모든 경로는 저장소 root 기준이다. 명령은 `frontend/` 에서 돌린다.

**근거 문서**: `frontend/docs/flow.md` 의 「5-2」, 「6. 예산 알림 플로우」, `/categories` 절, `frontend/docs/adr/ADR-F39-navigation-pending-feedback.md`(화면 이동은 `useAppRouter`).

코드에서 확인한 사실:

- `frontend/src/components/expenses/summary/CategoryExpenseSummary.tsx` 52-57행 `handleCategoryClick` 은 늘 `categoryId` 를 설정한다. 걸러 보는 행(`aria-pressed="true"`)을 눌러도 그대로다.
- `frontend/src/app/(authenticated)/categories/_components/CategoryItem.tsx`: `Card`(26행)에 클릭 동작이 없고 수정은 작은 `Edit2` 버튼(34-41행), 삭제는 옆 버튼(42-49행)이다.
- `frontend/src/components/notifications/NotificationItem.tsx` 81-93행 `handleClick` 은 안 읽은 알림을 읽음으로만 바꾼다. 이동은 없다. 예산 알림은 `type` 이 `BUDGET_50_EXCEEDED`, `BUDGET_80_EXCEEDED`, `BUDGET_100_EXCEEDED` 이고 백엔드가 `referenceType: "BUDGET"` 을 준다.
- 알림 항목은 헤더 알림 창(`NotificationList.tsx`)과 `/notifications` 화면에서 함께 쓴다.

## 의도 메모

- 요약 행을 다시 누르면 `categoryId` 를 지운다. 버튼 `aria-pressed` 는 토글 의미와 맞게 된다.
- 카드 전체를 버튼으로 만들지 않는다(안에 수정, 삭제 버튼이 있어 버튼 중첩이 된다). 카드에 `onClick` 으로 수정을 열고, 안쪽 두 버튼은 `event.stopPropagation()` 한다. 키보드 사용자는 지금 수정 버튼을 그대로 쓴다. 카드에 `cursor-pointer`.
- 예산 알림은 읽음 처리 뒤 `/budget` 으로 간다. 이미 읽은 알림도 이동한다. 헤더 알림 창에서 누르면 창을 닫는다(`NotificationList` 의 `onLinkClick` 과 같은 경로).

## 작업 항목

### 1. 요약 행 재클릭 해제와 테스트

`frontend/src/__tests__/components/expenses/CategoryExpenseSummary.test.tsx`(수정).

### 2. 카테고리 카드 탭 수정과 테스트

`frontend/src/__tests__/app/categories/CategoryItem.test.tsx`(신규): 카드를 누르면 `onEdit`, 삭제 버튼을 누르면 `onDelete` 만 불린다.

### 3. 예산 알림 이동과 테스트

`frontend/src/__tests__/components/notifications/NotificationItem.test.tsx`(신규): 예산 알림을 누르면 읽음 처리 뒤 `/budget` 으로 이동하고, 다른 종류는 이동하지 않는다.

## 검증

`frontend/` 에서 실행한다.

```bash
pnpm tsc --noEmit && pnpm lint && pnpm lint:md && pnpm test
pnpm test src/__tests__/components/expenses/CategoryExpenseSummary.test.tsx src/__tests__/app/categories/CategoryItem.test.tsx src/__tests__/components/notifications/NotificationItem.test.tsx
```

기대값: 모든 명령이 성공한다.

## 변경 파일

| 파일 | 변경 |
|---|---|
| `frontend/src/components/expenses/summary/CategoryExpenseSummary.tsx` | 수정 |
| `frontend/src/__tests__/components/expenses/CategoryExpenseSummary.test.tsx` | 수정 |
| `frontend/src/app/(authenticated)/categories/_components/CategoryItem.tsx` | 수정 |
| `frontend/src/__tests__/app/categories/CategoryItem.test.tsx` | 신규 |
| `frontend/src/components/notifications/NotificationItem.tsx` | 수정 |
| `frontend/src/components/notifications/NotificationList.tsx` | 수정 |
| `frontend/src/__tests__/components/notifications/NotificationItem.test.tsx` | 신규 |
