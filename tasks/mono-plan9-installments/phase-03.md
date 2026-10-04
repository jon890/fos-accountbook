# Phase 03. 프론트엔드: 할부 목록과 등록·수정 창 컴포넌트

**Execution profile**: standard
**Domain**: app-router

## 목표

할부 탭에 들어갈 클라이언트 컴포넌트 셋을 만든다. 요약 카드와 목록(`InstallmentList`), 항목 한 줄(`InstallmentItem`), 등록과 수정 창(`InstallmentDialog`)이다.

**범위 외**: 내역 화면 탭, `page.tsx`, 전체 메뉴 연결과 브라우저 테스트는 phase 04 가 한다. 데이터 층(`frontend/src/actions/installment/`, `frontend/src/types/installment.ts`)은 phase 02 가 만들었다.

## 컨텍스트

- 창은 `frontend/src/app/(authenticated)/budget/_components/BudgetItemDialog.tsx` 를 본뜬다. 데스크톱은 `Dialog`, 모바일은 하단 `Sheet` 이고 `useMediaQuery("(min-width: 768px)")` 로 고른다. 열릴 때 입력값을 되돌리는 방식(렌더 중 `resetKey` 비교)도 같다.
- 삭제 확인은 `frontend/src/app/(authenticated)/budget/_components/BudgetItemsSection.tsx` 의 `AlertDialog` 사용을 본뜬다.
- 목록 카드는 `frontend/src/components/recurring-expense/RecurringExpenseList.tsx` 의 요약 카드와 목록 카드 구성을 본뜬다. 금액은 `formatCurrency` (`@/lib/utils/format`)로 쓴다. 진행 막대는 `@/components/ui/progress` 의 `Progress` 다.
- 빈 상태는 `@/components/empty/EmptyState` 다. `cta` 는 링크만 받으므로 쓰지 않는다. 추가 버튼은 요약 카드 옆에 항상 있다.
- 저장과 삭제 뒤 목록은 Server Action 의 `revalidatePath("/transactions")` 로 다시 그려진다. 실패하면 `useAppRouter()` (`@/lib/client/navigation`)의 `refresh()` 를 불러 다른 구성원의 변경을 반영한다.
- 색은 `frontend/src/app/globals.css` 의 토큰 클래스만 쓴다(`text-fg-muted`, `bg-bg-elev`, `text-expense` 등). 함정은 `frontend/.claude/skills/_shared/common-pitfalls.md` 의 CODE-4, CODE-5, CODE-6 이다.

**근거 문서**: `frontend/docs/flow.md` 의 「17. 할부 탭」, `frontend/docs/data-schema.md` 의 「Installment」.

## 의도 메모

- 요약 합계는 목록에서 더한다. 「이번 달 할부」 는 `thisMonthAmount` 합, 「남은 할부」 는 `remainingAmount` 합이다. 계산 규칙을 프론트엔드에 다시 두지 않는다.
- 단, 등록 창의 월 납부액 미리보기는 서버 왕복 없이 보여야 해서 `Math.floor(total / months)` 와 첫 회차 `total - monthly × (months - 1)` 만 창 안에서 계산한다. 회차와 남은 금액은 계산하지 않는다.
- 완료 할부를 숨기지 않고 아래 구역에 흐리게 둔다. 사용자가 직접 지울 수 있게 하기 위해서다.

## 작업 항목

### 1. `frontend/src/components/installment/InstallmentList.tsx` (`"use client"`)

- props: `{ items: Installment[]; defaultStartMonth: string }`. `defaultStartMonth` 는 `YYYY-MM` 이고 등록 창의 기본 첫 결제 월이다.
- 위쪽 요약 카드: 「이번 달 할부」 금액(크게), 「남은 할부」 금액, 작은 안내 「예산과 합계에는 포함되지 않아요」. 오른쪽에 「할부 추가」 버튼(`Button`, `Plus` 아이콘)이 등록 창을 연다.
- `items` 가 비면 `EmptyState` (`icon={CreditCard}`, `title="등록된 할부가 없습니다"`, `description="「할부 추가」 버튼으로 진행 중인 할부를 기록해 보세요."`).
- 아니면 `progress !== "COMPLETED"` 인 항목을 「진행 중」 목록 카드에, `COMPLETED` 인 항목을 「완료」 제목(`h3`)을 단 아래 카드에 둔다. 완료가 없으면 그 카드를 그리지 않는다. 순서는 받은 순서다.
- 창은 이 컴포넌트가 하나만 든다. 상태는 `dialog: { open: boolean; installment?: Installment }` 이다. 「할부 추가」 는 `installment` 없이, 항목의 `onSelect` 는 그 할부로 연다. `InstallmentDialog` 에는 `defaultStartMonth` 를 그대로 넘긴다.

### 2. `frontend/src/components/installment/InstallmentItem.tsx` (`"use client"`)

- props: `{ installment: Installment; onSelect: (installment: Installment) => void }`. 한 줄 전체가 native `<button type="button">` 이고(줄 전체 배치에 `Button` 의 고정 높이와 `inline-flex` 가 맞지 않아 CODE-5 의 예외다) 누르면 `onSelect(installment)` 를 부른다. 창 상태는 들지 않는다. `aria-label` 은 `` `${name} 할부 수정` ``.
- 왼쪽: 이름, 아래 줄 보조 문구.
  - `IN_PROGRESS`: `` `${currentRound}/${installmentMonths}회 · 월 ${formatCurrency(monthlyAmount)}` ``
  - `UPCOMING`: `` `${YYYY}년 ${M}월 시작 · ${installmentMonths}개월` `` (`startMonth` 에서 `Number(startMonth.slice(0, 4))` 와 `Number(startMonth.slice(5, 7))` 을 써 월은 앞의 0 없이 쓴다)
  - `COMPLETED`: `` `완납 · ${installmentMonths}개월` ``
- 오른쪽: `COMPLETED` 가 아니면 「남은 금액」 라벨과 `formatCurrency(remainingAmount)`, 완료면 `formatCurrency(totalAmount)`.
- 아래: `Progress` 값은 `Math.round(currentRound / installmentMonths * 100)`. 완료 항목은 줄 전체에 `opacity-60`.

### 3. `frontend/src/components/installment/InstallmentDialog.tsx` (`"use client"`)

- props: `{ open: boolean; onOpenChange: (open: boolean) => void; installment?: Installment; defaultStartMonth: string }`. 있으면 수정, 없으면 등록이다. 제목은 「할부 수정」 / 「할부 추가」.
- 필드(`label` 의 `htmlFor` 와 `id` 를 잇는다):
  - 이름 `installment-name` (`maxLength` 50, placeholder 「예: 노트북」)
  - 총 금액 (원) `installment-total` (`inputMode="numeric"`, 숫자만 남긴다. `BudgetItemDialog` 의 한도 입력과 같다)
  - 할부 개월 `installment-months` (`inputMode="numeric"`, 숫자만)
  - 첫 결제 월 `installment-start` (`type="month"`, 기본 `defaultStartMonth`)
  - 메모 `installment-memo` (`maxLength` 200, 선택)
- 총 금액과 개월이 모두 있고 개월이 2 이상이면 미리보기 한 줄을 보인다: `` `월 ${formatCurrency(monthly)}` `` 이고, 첫 회차가 다르면 `` ` · 첫 달 ${formatCurrency(first)}` `` 를 붙인다.
- 저장: `createInstallmentAction(input)` 또는 `updateInstallmentAction(uuid, input)`. 성공이면 토스트 「할부를 추가했어요」 / 「할부를 수정했어요」 와 창 닫기. 실패면 `toast.error(result.error.message)` 와 `router.refresh()` 를 부르고 창은 연 채로 둔다. 실패 원인(검증 실패, 이미 지운 할부)은 구분하지 않는다. 지운 할부는 refresh 뒤 목록에서 사라지므로 사용자가 창을 닫으면 된다.
- 수정 모드에서만 왼쪽 아래 「삭제」 버튼. 누르면 `AlertDialog` (제목 「할부를 삭제할까요?」, 설명 「삭제한 할부는 되돌릴 수 없어요」, 확인 「삭제」). 확인하면 `deleteInstallmentAction(uuid)`, 성공이면 토스트 「할부를 삭제했어요」 와 창 닫기, 실패면 토스트와 `router.refresh()`, 창 닫기.
- 저장 버튼은 이름, 총 금액, 개월, 첫 결제 월이 모두 있고 저장 중이 아닐 때만 누를 수 있다. 저장 중 문구는 「저장 중...」.

### 4. 테스트

`frontend/src/__tests__/components/installment/InstallmentList.test.tsx` (`@/actions/installment/*`, `@/hooks/useMediaQuery`, `sonner`, `@/lib/client/navigation`(`useAppRouter: () => ({ refresh: mockRefresh })`) 를 mock 한다. router mock 선례는 `frontend/src/__tests__/components/invite/InvitePageClient.test.tsx` 다. `frontend/src/__tests__/app/budget/BudgetItemsSection.test.tsx` 의 mock 구성을 따른다)

- 진행 중 하나(이번 달 83,333, 남은 833,330), 예정 하나(이번 달 0, 남은 500,000), 완료 하나: 요약이 `₩83,333` 과 `₩1,333,330` 을 보이고, 「완료」 제목 아래에 완료 항목만 있다
- 보조 문구가 `2/12회 · 월 ₩83,333`, `2026년 11월 시작 · 3개월`, `완납 · 6개월` 이다(실제 `formatCurrency` 출력에 맞춘다)
- 빈 배열이면 「등록된 할부가 없습니다」 와 「할부 추가」 버튼이 보이고 「완료」 제목이 없다

`frontend/src/__tests__/components/installment/InstallmentDialog.test.tsx`

- 등록: 이름, 총 금액 1000000, 개월 12 를 입력하면 미리보기 `월 ₩83,333 · 첫 달 ₩83,337` 이 보이고, 저장하면 `createInstallmentAction` 이 `{ name, totalAmount: 1000000, installmentMonths: 12, startMonth: defaultStartMonth }` 로 불린다(메모 없음)
- 등록 액션이 `success: false` 와 문구를 주면 그 문구로 `toast.error` 와 `mockRefresh` 가 불리고 창이 열려 있다
- 수정 액션이 `success: false` 여도 같다
- 수정: 기존 값이 채워져 있고, 삭제를 확인하면 `deleteInstallmentAction(uuid)` 가 불린다
- 필수 값이 비면 저장 버튼이 비활성이다

## 검증

```bash
cd frontend && pnpm exec jest src/__tests__/components/installment/InstallmentList.test.tsx src/__tests__/components/installment/InstallmentDialog.test.tsx
cd frontend && pnpm tsc --noEmit && pnpm lint && pnpm lint:md && pnpm test
```

## 변경 파일

| 파일 | 변경 |
|---|---|
| `frontend/src/components/installment/InstallmentList.tsx` | 신규 |
| `frontend/src/components/installment/InstallmentItem.tsx` | 신규 |
| `frontend/src/components/installment/InstallmentDialog.tsx` | 신규 |
| `frontend/src/__tests__/components/installment/InstallmentList.test.tsx` | 신규 |
| `frontend/src/__tests__/components/installment/InstallmentDialog.test.tsx` | 신규 |
