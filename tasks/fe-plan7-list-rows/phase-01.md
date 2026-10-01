# Phase 01. 공용 거래 행과 날짜 머리, 달력 날짜 목록

**Execution profile**: standard
**Domain**: color-token

## 목표

`TransactionRow` 를 모바일에서 읽기 좋은 공용 행으로 바꾸고, 날짜 머리를 누르면 달력의 그 날짜로 가게 한다. 달력 날짜 목록이 새 행을 쓴다.

**범위 외**: 지출, 수입 탭은 phase 02, 반복 지출은 phase 03 이다. 페이지 넘김과 필터는 다음 plan 이다.

## 컨텍스트

모든 경로는 저장소 root 기준이다. 명령은 `frontend/` 에서 돌린다.

**근거 문서**: `frontend/docs/adr/ADR-F37-single-transaction-row.md`, 색은 ADR-F07, F13, F23, 브라우저 테스트는 ADR-F34 와 `frontend/docs/testing-strategy.md` 6절.

코드에서 확인한 사실:

- `frontend/src/components/transactions/TransactionRow.tsx`
  - `TxBase { uuid, amount, description, date, category, createdBy?: { uuid?, name, colorClass? } }`, props `{ tx, variant: "compact" | "full", onEdit? }`.
  - `onEdit` 이 있으면 `role="button"`, `tabIndex=0`, Enter 와 Space 처리가 이미 있다.
  - 금액은 `formatCurrency(Math.abs(amount))` 를 `text-fg` 로 그린다. 지출과 수입 구분이 없다. 작성자는 금액 아래에 11px 로 붙는다. 보조 줄은 `text-[11.5px]`.
- `frontend/src/components/transactions/DateGroupSection.tsx`: 머리가 `group.label`(`text-[12.5px] text-fg-muted`)과 `합계 {formatCurrency(group.totalAmount)}`. 누르는 동작이 없다. `group` 은 `DateGroupWithTotal<T>`(`frontend/src/types/transaction.ts`), 날짜 키는 `group.dateKey`(`yyyy-MM-dd`, `frontend/src/lib/utils/group-by-date.ts`).
- `frontend/src/components/calendar/DayTransactionList.tsx`: 행 왼쪽에 「지출」, 「수입」 글자 열(`text-[11px]`)을 따로 두고 `TransactionRow variant="compact"` 를 쓴다. 작성자는 `getMemberColor(colors, userUuid)` 의 `label`, `bgClass` 로 만든다(`frontend/src/lib/utils/member-color.ts`). 제목 옆에 지출 합계만 보인다.
- 달력 화면 `frontend/src/app/(authenticated)/calendar/page.tsx` 는 `month=YYYY-MM` 과 `date=YYYY-MM-DD` 를 받고, `date` 가 그 달에 속할 때만 선택한다.

## 의도 메모

- 행 구성(390px): 왼쪽 40px 카테고리 아이콘 타일, 가운데 위 설명(없으면 카테고리명, 15px `font-semibold text-fg`), 가운데 아래 `카테고리 · 작성자 · HH:mm`(12px `text-fg-muted`, 설명이 없으면 카테고리 생략), 오른쪽 금액(15px `font-bold num`, 지출 `text-expense`, 수입 `text-income` 과 `+`). 금액은 `formatCurrency` 하나로.
- 작성자는 `colorClass` 가 있으면 점과 이름을 보조 줄에 둔다. 금액 열 아래에 두지 않는다.
- 행 최소 높이 56px, `active:bg-bg-muted` 로 눌림 표시.
- 지출과 수입을 구분하려고 `TxBase` 나 props 에 `kind: "expense" | "income"` 을 더한다. 기본값은 지출이다.
- `compact` 와 `full` 의 모바일 모양은 같게 한다. `full` 의 데스크톱 그리드는 유지한다.
- 날짜 머리: 전체가 `next/link` 이고 `ChevronRight` 를 끝에 둔다. 왼쪽 `오늘`, `어제`, `M월 d일 (요일)`. 오른쪽은 그날 지출 합계, 수입이 있으면 수입 합계도. 높이 44px 이상, 13~14px `font-semibold text-fg`.

## 작업 항목

### 1. `frontend/src/components/transactions/TransactionRow.tsx` 개편

### 2. `frontend/src/components/transactions/DateGroupSection.tsx` 의 날짜 머리를 링크로

- 요일이 필요하면 `frontend/src/lib/utils/group-by-date.ts` 의 라벨 함수를 고치거나 머리에서 계산한다. 지출과 수입 합계를 나누려면 `frontend/src/services/transaction/transaction-service.ts` 의 `groupTransactionsWithTotal` 이나 머리 props 를 고친다.

### 3. `frontend/src/components/calendar/DayTransactionList.tsx` 가 새 행을 쓰게

- 「지출」, 「수입」 글자 열을 빼고 `kind` 로 금액 색과 부호를 준다. 제목 옆에 그날 수입 합계도 보인다.

### 4. 이 phase 를 검증하는 Jest 테스트

- `frontend/src/__tests__/components/transactions/TransactionRow.test.tsx`(없으면 신규): 설명이 없으면 카테고리명이 제목이고 보조 줄에 카테고리가 반복되지 않는다. 수입은 `+` 와 `text-income`, 지출은 부호 없이 `text-expense`. 작성자 이름이 보조 줄에 있다. `onEdit` 이 있으면 Enter 로 불린다.
- `frontend/src/__tests__/components/transactions/DateGroupSection.test.tsx`(없으면 신규): 머리 링크의 href 가 `/calendar?month=2026-03&date=2026-03-15` 형식이다. 수입이 있는 날은 수입 합계가 보인다.
- 기존 테스트가 「지출」 글자 열이나 옛 클래스에 기대면 새 구조에 맞게 고친다(`grep -rn "TransactionRow\|DayTransactionList\|DateGroupSection" frontend/src/__tests__`). 고친 테스트 파일은 이 phase 의 「변경 파일」 표에 더한다.

## 검증

`frontend/` 에서 실행한다.

```bash
pnpm install --frozen-lockfile
pnpm tsc --noEmit && pnpm lint && pnpm lint:md
pnpm test -- src/__tests__/components/transactions/TransactionRow.test.tsx src/__tests__/components/transactions/DateGroupSection.test.tsx
pnpm test
```

기대값: 모든 명령이 성공한다.

## 변경 파일

| 파일 | 변경 |
|---|---|
| `frontend/src/components/transactions/TransactionRow.tsx` | 수정 |
| `frontend/src/components/transactions/DateGroupSection.tsx` | 수정 |
| `frontend/src/components/calendar/DayTransactionList.tsx` | 수정 |
| `frontend/src/lib/utils/group-by-date.ts` | 수정 |
| `frontend/src/services/transaction/transaction-service.ts` | 수정 |
| `frontend/src/types/transaction.ts` | 수정 |
| `frontend/src/__tests__/components/transactions/TransactionRow.test.tsx` | 신규 |
| `frontend/src/__tests__/components/transactions/DateGroupSection.test.tsx` | 신규 |
