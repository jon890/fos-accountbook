# Phase 03. 예산 화면과 고정지출 목록의 색 정리

**Execution profile**: fast
**Domain**: color-token

## 목표

예산 현황 카드의 글자와 진행 막대가 두 테마에서 읽히게 하고, 고정지출 목록이 다크에서 흰 반투명 판으로 뜨지 않게 한다.

**범위 외**: 토큰 값은 phase 01, 팔레트 치환은 phase 02 에서 끝났다. 등록 시트와 카테고리 창은 등록 화면 정리 PR 과 다음 입력 흐름 plan 이 다룬다.

## 컨텍스트

모든 경로는 저장소 root 기준이다. 명령은 `frontend/` 에서 돌린다.

**근거 문서**: `frontend/docs/adr/ADR-F38-dark-mode-tokens-and-theme-choice.md`, `frontend/docs/adr/ADR-F23-semantic-foreground-tokens.md`.

코드에서 확인한 사실:

- `frontend/src/app/(authenticated)/budget/_components/BudgetClient.tsx` 70행 아이콘 상자와 91행 「예산 설정」 버튼이 `gradient-budget` 이고 91행은 `text-brand-fg` 다. 노란 바탕에 흰 글자라 대비가 약 2:1 이다.
- 같은 파일 102-142행 예산 현황 카드는 초과가 아니면 `gradient-budget text-brand-fg` 다. 138행 `Progress` 는 `gradient-card-overlay` 를 트랙으로 쓰지만 채움은 `frontend/src/components/ui/progress.tsx` 기본값 `bg-primary` 라, 다크에서 `--primary` 가 밝은 파랑으로 바뀌어 노란 카드 위에서 튄다.
- 대시보드의 예산 카드 `frontend/src/components/dashboard/BudgetHeroCard.tsx` 는 `gradient-primary text-brand-fg` 와 `--color-hero-track`, `--color-hero-fill` 로 진행 막대를 그린다.
- `frontend/src/components/recurring-expense/RecurringExpenseList.tsx` 27행 목록 카드가 `glass`(흰 75% 반투명)를 쓴다.

## 의도 메모

- 예산 화면의 정상 상태 색은 대시보드 예산 카드와 같게 `gradient-primary text-brand-fg` 로 맞춘다. 초과 상태의 `gradient-expense text-expense-fg` 는 그대로 둔다.
- 그라디언트 카드 위 진행 막대는 트랙 `--color-hero-track`, 채움 `--color-hero-fill` 을 쓴다. `Progress` 의 채움 색은 `[&_[data-slot=progress-indicator]]:bg-[var(--color-hero-fill)]` 처럼 호출부에서 덮어쓴다. `progress.tsx` 기본값은 다른 화면이 쓰므로 바꾸지 않는다.
- 고정지출 목록 카드는 다른 목록 카드처럼 `bg-bg-elev border border-border` 로 둔다.

## 작업 항목

### 1. `BudgetClient.tsx` 아이콘 상자, 「예산 설정」 버튼, 예산 현황 카드를 `gradient-primary` 로

### 2. `BudgetClient.tsx` 예산 현황 카드의 진행 막대를 hero 트랙과 채움으로

### 3. `RecurringExpenseList.tsx` 목록 카드의 `glass` 를 표면 토큰으로

### 4. `frontend/browser/dark-mode.spec.ts` 에 `/budget`, `/transactions` 단언 추가

- 다크에서 `/transactions` 의 고정지출 목록 카드와 카테고리별 지출 카드 배경 밝기가 0.45 미만이다.
- 다크에서 `/budget` 예산 현황 카드의 진행 막대 채움 색이 `--primary` 와 다르다.
- 가짜 백엔드에 예산 화면용 응답이 없으면 `frontend/browser/fake-backend.mjs` 에 더한다.

## 검증

`frontend/` 에서 실행한다.

```bash
pnpm tsc --noEmit && pnpm lint && pnpm lint:md && pnpm test
pnpm test:browser
pnpm test:browser browser/dark-mode.spec.ts
```

기대값: 모든 명령이 성공한다.

## 변경 파일

| 파일 | 변경 |
|---|---|
| `frontend/src/app/(authenticated)/budget/_components/BudgetClient.tsx` | 수정 |
| `frontend/src/components/recurring-expense/RecurringExpenseList.tsx` | 수정 |
| `frontend/browser/dark-mode.spec.ts` | 수정 |
| `frontend/browser/fake-backend.mjs` | 수정 |
