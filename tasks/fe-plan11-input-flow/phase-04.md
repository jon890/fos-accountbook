# Phase 04. 카테고리 격자의 키보드 이동과 터치 크기

**Execution profile**: fast
**Domain**: app-router

## 목표

카테고리 격자는 Tab 한 번으로 들어가고 방향키로 칸을 옮긴다. 칸마다 44px 이상이다. 예산 제외 아이콘이 이름 글자에 잘리지 않는다.

**범위 외**: 카테고리 창은 phase 05 다.

## 컨텍스트

모든 경로는 저장소 root 기준이다. 명령은 `frontend/` 에서 돌린다.

**근거 문서**: `frontend/docs/adr/ADR-F40-in-sheet-amount-keypad.md`, `frontend/docs/flow.md` 의 등록 흐름 절의 AddTransactionDialog 도식과 `/categories` 절, `frontend/docs/adr/ADR-F21-transaction-dialog-unification.md`.

코드에서 확인한 사실(`frontend/src/components/expenses/forms/CategoryGrid.tsx`):

- 35행 `role="radiogroup"` 과 `grid-cols-5 md:grid-cols-10`. 41-48행 각 칸은 `<button role="radio" aria-checked>` 이고 `tabIndex` 를 따로 주지 않아 모든 칸이 Tab 정지점이며 방향키는 동작하지 않는다.
- 50-62행 칸은 `px-1 py-2` 이고 최소 크기를 정하지 않았다.
- 65-70행 `EyeOff` 아이콘이 이름 `span`(truncate) 안에 있다. 위치는 `absolute` 지만 부모가 이름 칸이라 잘릴 수 있다.

## 의도 메모

- roving tabindex: 선택된 칸(없으면 첫 칸)만 `tabIndex={0}`, 나머지는 `-1`. 왼쪽, 오른쪽 방향키는 이전, 다음 칸, 위, 아래 방향키는 현재 열 수만큼 이동한다. 열 수는 768px 기준 5 또는 10 이다(`useMediaQuery("(min-width: 768px)")`). 이동하면 그 칸을 바로 선택한다(WAI-ARIA 라디오 그룹 규칙).
- 칸에 `min-h-11 min-w-11` 을 준다.
- `EyeOff` 는 버튼 바로 아래 자식으로 옮긴다.
- 종류 토글은 phase 01의 Radix RadioGroup을 유지한다. 카테고리 격자는 좌우 한 칸, 상하 열 수만큼 이동해야 하므로 1차원 Radix 이동 대신 전용 useRovingRadio를 사용한다. 선택 타일은 기존 Button을 사용한다.
- 훅은 `{ values: string[], selectedValue: string | null, onChange: (value: string) => void, columns: number, disabled?: boolean }`을 받고 getItemProps(value: string)으로 각 항목의 ref, tabIndex, onKeyDown을 반환한다. CategoryGrid는 Button에 {...getItemProps(category.uuid)}를 전달한다. 방향키는 전체 목록에서 modulo로 순환하며 Home/End는 처음/마지막으로 이동한다. 비활성이거나 빈 목록이면 이동하지 않는다. 선택이 목록에 없으면 첫 항목만 Tab 정지점이다.

## 작업 항목

### 1. `useRovingRadio.ts`(신규)와 단위 테스트 `frontend/src/__tests__/hooks/useRovingRadio.test.tsx`(신규)

### 2. `CategoryGrid.tsx` 에 적용, 크기, 아이콘 위치

### 3. 종류 토글의 기존 RadioGroup 회귀 확인

Add의 방향키 선택과 Edit의 잠긴 종류를 창 테스트에서 유지하는지 확인한다. 종류 토글 코드는 수정할 필요가 없다.

### 4. 테스트

`frontend/src/__tests__/components/expenses/CategoryGrid.test.tsx`(수정): Tab 정지점이 하나이고, 오른쪽 방향키로 다음 칸이 선택되고 포커스된다.

## 검증

`frontend/` 에서 실행한다.

```bash
pnpm tsc --noEmit && pnpm lint && pnpm lint:md && pnpm test
pnpm test src/__tests__/hooks/useRovingRadio.test.tsx src/__tests__/components/expenses/CategoryGrid.test.tsx src/__tests__/components/transactions/dialogs/AddTransactionDialog.test.tsx src/__tests__/components/transactions/dialogs/EditTransactionDialog.test.tsx
```

기대값: 모든 명령이 성공한다.

## 변경 파일

| 파일 | 변경 |
|---|---|
| `frontend/src/hooks/useRovingRadio.ts` | 신규 |
| `frontend/src/__tests__/hooks/useRovingRadio.test.tsx` | 신규 |
| `frontend/src/components/expenses/forms/CategoryGrid.tsx` | 수정 |
| `frontend/src/__tests__/components/expenses/CategoryGrid.test.tsx` | 수정 |
