# Phase 05. 카테고리 추가, 수정 창을 모바일 하단 시트로

**Execution profile**: standard
**Domain**: app-router

## 목표

768px 미만에서 카테고리 추가와 수정 창이 하단 시트로 뜬다. 이모지 격자는 8열이고, 색 문자열(hex)은 화면에 보이지 않는다.

**범위 외**: 카테고리 종류 분리와 예산 제외 표시는 이미 main 에 있다. 바꾸지 않는다.

## 컨텍스트

모든 경로는 저장소 root 기준이다. 명령은 `frontend/` 에서 돌린다.

**근거 문서**: `frontend/docs/adr/ADR-F40-in-sheet-amount-keypad.md`, `frontend/docs/flow.md` 의 등록 흐름 절(「AddTransactionDialog (responsive ...)」 도식)과 `/categories` 절, `frontend/docs/adr/ADR-F21-transaction-dialog-unification.md`.

코드에서 확인한 사실:

- `frontend/src/app/(authenticated)/categories/_components/AddCategoryDialog.tsx` 35-36행과 `EditCategoryDialog.tsx` 33-34행은 늘 `Dialog` 다.
- 이모지 격자: Add 131행, Edit 126행 `grid-cols-10`, `max-h-32` 스크롤.
- 색 문자열 노출: Add 154행, Edit 149행 `<span className="text-xs text-fg-muted ...">{color}</span>`.
- 반응형 선례: `frontend/src/components/settings/BudgetEditDialog.tsx` 45행, 152-169행이 `useMediaQuery("(min-width: 768px)")` 로 데스크톱 `Dialog max-w-md`, 모바일 `Sheet side="bottom" h-auto` 를 고른다.

## 의도 메모

- 두 창이 같은 반응형 껍데기를 쓰도록 `frontend/src/app/(authenticated)/categories/_components/CategoryFormShell.tsx`(신규)를 만든다. 제목, 본문, 하단 버튼을 받아 폭에 따라 Dialog 나 Sheet 로 그린다. 시트는 `bg-bg-elev`, 하단 버튼은 `safe-area-pb` 로 홈 표시줄을 피한다.
- 이모지 격자는 `grid-cols-8`, 칸은 44px 이상이다. `max-h` 는 시트에서 4줄이 보이게 둔다.
- 색 고르기 칸은 견본 원만 보이고, 각 견본에 `aria-label`(색 이름이 없으면 「색 1」 처럼 순번)을 준다. hex 문자열 `span` 은 지운다.

## 작업 항목

### 1. `CategoryFormShell.tsx`(신규)

### 2. `AddCategoryDialog.tsx`, `EditCategoryDialog.tsx` 를 껍데기로 옮기고 격자 8열, 색 문자열 제거

### 3. 단위 테스트

- `frontend/src/__tests__/components/categories/AddCategoryDialog.test.tsx`(수정): 모바일에서 `data-slot="sheet-content"`, 데스크톱에서 `data-slot="dialog-content"`. hex 문자열이 보이지 않는다.
- `frontend/src/__tests__/components/categories/EditCategoryDialog.test.tsx`(수정): 같은 두 가지.

### 4. 브라우저 테스트 `frontend/browser/categories.spec.ts`(수정)

390px 에서 「카테고리 추가」 를 누르면 하단 시트가 화면 아래에 붙어 열리고(시트 아래 가장자리가 뷰포트 높이와 같다), 이모지 격자 한 줄에 8칸이다. 다크에서 시트 배경이 흰색이 아니다.

## 검증

`frontend/` 에서 실행한다.

```bash
pnpm tsc --noEmit && pnpm lint && pnpm lint:md && pnpm test
pnpm test src/__tests__/components/categories/AddCategoryDialog.test.tsx src/__tests__/components/categories/EditCategoryDialog.test.tsx
pnpm test:browser browser/categories.spec.ts
```

기대값: 모든 명령이 성공한다.

## 변경 파일

| 파일 | 변경 |
|---|---|
| `frontend/src/app/(authenticated)/categories/_components/CategoryFormShell.tsx` | 신규 |
| `frontend/src/app/(authenticated)/categories/_components/AddCategoryDialog.tsx` | 수정 |
| `frontend/src/app/(authenticated)/categories/_components/EditCategoryDialog.tsx` | 수정 |
| `frontend/src/__tests__/components/categories/AddCategoryDialog.test.tsx` | 수정 |
| `frontend/src/__tests__/components/categories/EditCategoryDialog.test.tsx` | 수정 |
| `frontend/browser/categories.spec.ts` | 수정 |
