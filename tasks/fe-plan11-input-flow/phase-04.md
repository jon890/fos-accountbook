# Phase 04. 카테고리 격자의 키보드 이동과 터치 크기

**Execution profile**: fast
**Domain**: app-router

## 목표

카테고리 격자는 Tab 한 번으로 들어가고 방향키로 칸을 옮긴다. 칸마다 44px 이상이다. 예산 제외 아이콘이 이름 글자에 잘리지 않는다.

**범위 외**: 카테고리 창은 phase 05 다.

## 컨텍스트

모든 경로는 저장소 root 기준이다. 명령은 `frontend/` 에서 돌린다.

**근거 문서**: `frontend/docs/adr/ADR-F40-in-sheet-amount-keypad.md`, `frontend/docs/flow.md` 의 등록 흐름 절(「AddTransactionDialog (responsive ...)」 도식)과 `/categories` 절, `frontend/docs/adr/ADR-F21-transaction-dialog-unification.md`.

코드에서 확인한 사실(`frontend/src/components/expenses/forms/CategoryGrid.tsx`):

- 35행 `role="radiogroup"` 과 `grid-cols-5 md:grid-cols-10`. 41-48행 각 칸은 `<button role="radio" aria-checked>` 이고 `tabIndex` 를 따로 주지 않아 모든 칸이 Tab 정지점이며 방향키는 동작하지 않는다.
- 50-62행 칸은 `px-1 py-2` 이고 최소 크기를 정하지 않았다.
- 65-70행 `EyeOff` 아이콘이 이름 `span`(truncate) 안에 있다. 위치는 `absolute` 지만 부모가 이름 칸이라 잘릴 수 있다.

## 의도 메모

- roving tabindex: 선택된 칸(없으면 첫 칸)만 `tabIndex={0}`, 나머지는 `-1`. 왼쪽, 오른쪽 방향키는 이전, 다음 칸, 위, 아래 방향키는 현재 열 수만큼 이동한다. 열 수는 768px 기준 5 또는 10 이다(`useMediaQuery("(min-width: 768px)")`). 이동하면 그 칸을 바로 선택한다(WAI-ARIA 라디오 그룹 규칙).
- 칸에 `min-h-11 min-w-11` 을 준다.
- `EyeOff` 는 버튼 바로 아래 자식으로 옮긴다.
- phase 01 의 종류 토글도 같은 방향키 처리를 쓰므로, 처리를 `frontend/src/hooks/useRovingRadio.ts`(신규)로 빼서 둘이 함께 쓴다. phase 01 이 토글에 따로 만든 처리가 있으면 이 훅으로 바꾼다.

## 작업 항목

### 1. `useRovingRadio.ts`(신규)와 단위 테스트 `frontend/src/__tests__/hooks/useRovingRadio.test.tsx`(신규)

### 2. `CategoryGrid.tsx` 에 적용, 크기, 아이콘 위치

### 3. 종류 토글에 같은 훅 적용

`frontend/src/components/transactions/dialogs/AddTransactionDialog.tsx`, `frontend/src/components/transactions/dialogs/EditTransactionDialog.tsx`.

### 4. 테스트

`frontend/src/__tests__/components/expenses/CategoryGrid.test.tsx`(수정): Tab 정지점이 하나이고, 오른쪽 방향키로 다음 칸이 선택되고 포커스된다.

## 검증

`frontend/` 에서 실행한다.

```bash
pnpm tsc --noEmit && pnpm lint && pnpm lint:md && pnpm test
pnpm test src/__tests__/hooks/useRovingRadio.test.tsx src/__tests__/components/expenses/CategoryGrid.test.tsx
```

기대값: 모든 명령이 성공한다.

## 변경 파일

| 파일 | 변경 |
|---|---|
| `frontend/src/hooks/useRovingRadio.ts` | 신규 |
| `frontend/src/__tests__/hooks/useRovingRadio.test.tsx` | 신규 |
| `frontend/src/components/expenses/forms/CategoryGrid.tsx` | 수정 |
| `frontend/src/components/transactions/dialogs/AddTransactionDialog.tsx` | 수정 |
| `frontend/src/components/transactions/dialogs/EditTransactionDialog.tsx` | 수정 |
| `frontend/src/__tests__/components/expenses/CategoryGrid.test.tsx` | 수정 |
