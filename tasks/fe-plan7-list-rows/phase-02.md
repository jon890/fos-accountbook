# Phase 02. 지출과 수입 탭에 공용 행을 쓰고 수정 시트를 하나로

**Execution profile**: deep
**Domain**: color-token, app-router, server-action

## 목표

내역의 지출, 수입 탭이 phase 01 의 공용 행과 날짜 머리를 쓴다. 행을 한 번 누르면 수정 시트가 열리고, 삭제는 시트 안에서만 한다. 내역 탭에도 작성자가 보인다.

**범위 외**: 반복 지출은 phase 03 이다. 페이지 넘김, 필터, 카테고리 요약 아코디언은 다음 plan 이다.

## 컨텍스트

모든 경로는 저장소 root 기준이다. 명령은 `frontend/` 에서 돌린다.

**근거 문서**: `frontend/docs/adr/ADR-F37-single-transaction-row.md`.

코드에서 확인한 사실:

- `frontend/src/components/expenses/list/ExpenseListClient.tsx`: `DateGroupSection` 의 `renderItem` 으로 `ExpenseItem` 을 그리고, `EditTransactionDialog` 하나와 `DeleteExpenseDialog`(`frontend/src/components/expenses/dialogs/DeleteExpenseDialog.tsx`) 하나를 부모가 가진다.
- `frontend/src/components/expenses/list/ExpenseItem.tsx`: `window.innerWidth < 768` 일 때 행을 펼쳐 수정, 삭제 버튼을 보인다. `bg-white`, `text-gray-*`, `-₩` 직접 조립.
- `frontend/src/components/incomes/list/IncomeListClient.tsx`, `frontend/src/components/incomes/list/IncomeItem.tsx`: 수입 행마다 `EditTransactionDialog` 와 `AlertDialog` 를 따로 품는다. 제목이 카테고리, 금액 `text-xs`.
- `frontend/src/components/transactions/dialogs/EditTransactionDialog.tsx`: 모바일은 하단 `Sheet`, 데스크톱은 `Dialog`. `type !== "recurring"` 이면 시트 아래에 「삭제」 버튼과 확인 `AlertDialog` 가 이미 있다.
- `frontend/src/components/expenses/list/ExpenseList.tsx`, `frontend/src/components/incomes/list/IncomeList.tsx`: 바깥을 `Card`(`border-0 bg-white/80 backdrop-blur-sm shadow-xl`)로 감싼다. `DateGroupSection` 이 이미 카드 모양(`bg-bg-elev rounded-md border`)이다.
- 구성원 이름: `frontend/src/services/family/family-service.ts` 의 `getFamilyMembers(familyUuid)` 가 `GET /families/{familyUuid}/members` 를 부른다. 이를 부르는 Server Action 이 없다(`calendar-service` 만 직접 쓴다). 작성자 이름과 색은 `buildMemberColorMap`, `getMemberColor`(`frontend/src/lib/utils/member-color.ts`)로 만든다.
- 내역 화면은 `frontend/src/app/(authenticated)/transactions/page.tsx` 가 Server Component 로 데이터를 받는다(ADR-F12: Page 는 Action 을 거친다).
- 브라우저 테스트의 가짜 백엔드(`frontend/browser/fake-backend.mjs`)는 지금 가족, 카테고리, 알림 경로만 응답한다.

## 의도 메모

- 구성원 조회는 새 Server Action(`frontend/src/actions/family/get-family-members-action.ts`)으로 만든다. 권한 검증은 ADR-F25 의 single-family 패턴(`getSelectedFamilyUuid`)을 따른다. 기존 액션 테스트 패턴(`frontend/src/__tests__/actions/`)으로 테스트를 둔다.
- 삭제 확인을 `EditTransactionDialog` 로 모으면 `DeleteExpenseDialog` 가 쓰이지 않는다. 다른 곳에서 쓰지 않으면 지운다(`grep -rn DeleteExpenseDialog frontend/src`).
- 바깥 `Card` 를 없애고 하드코딩 색을 토큰으로 바꾼다. 여백 값은 ADR-F35 를 따른다.

## 작업 항목

### 1. 구성원 조회 Server Action 과 그 테스트

- `frontend/src/actions/family/get-family-members-action.ts`, `frontend/src/__tests__/actions/family/get-family-members-action.test.ts`(인증 실패, 가족 미선택, service 실패, 성공). ADR-F25와 CODE-4부터 CODE-6까지 해당 항목을 확인한다.

### 2. 지출 탭

- `ExpenseListClient` 가 기본 행(`TransactionRow`)과 `onEdit` 만 쓴다. `ExpenseItem.tsx` 삭제. `DeleteExpenseDialog` 를 쓰지 않으면 삭제. `ExpenseList.tsx` 의 바깥 Card 와 하드코딩 색 정리.

### 3. 수입 탭

- `IncomeListClient` 가 `EditTransactionDialog` 하나를 부모에서 가진다. `IncomeItem.tsx` 삭제. `IncomeList.tsx` 정리. 행은 `kind="income"`.

### 4. 내역 화면이 구성원을 받아 행에 넘기기

- `frontend/src/app/(authenticated)/transactions/page.tsx`에서 구성원 조회 Action을 호출하고 구성원 배열을 `ExpenseList`, `IncomeList`를 거쳐 각 Client로 넘긴다. Client가 `buildMemberColorMap`과 `getMemberColor`로 행의 작성자를 만든다. `ExpenseTabContent`, `IncomeTabContent`는 추가 버튼을 소유하며 목록 전달 경로가 아니다.
- 구성원 조회 실패는 페이지에서 에러 메시지로 표시하고 조용히 빈 구성원 배열로 바꾸지 않는다. Action의 single-family 검증은 기존 인증·선택 가족 규칙을 따른다. 가족 미선택은 F002, 인증 실패는 인증 오류로 구분한다.
- 기존 `frontend/src/__tests__/app/transactions/page.test.tsx`에 구성원 조회 Action mock과 두 목록으로 전달되는 구성원 값을 검증한다. `ExpenseItem` 삭제 시 이를 직접 import하는 테스트는 삭제하고 해당 행의 사용자 동작은 공용 행과 브라우저 테스트로 검증한다.

### 5. 이 phase 를 검증하는 브라우저 테스트 `frontend/browser/transactions.spec.ts`

- 가짜 백엔드에 내역 화면이 부르는 경로(지출, 수입 목록, 구성원, 요약 등. 모르는 경로는 fixture 가 실패로 알려 준다)를 더한다.
- `/api/v1/families`와 `/api/v1/families/{uuid}/categories`의 기존 응답을 유지하고 `/members`, `/expenses`, `/incomes`, `/dashboard/expenses/by-category`를 경로만 덧붙인다. 실제 service와 types에 정의된 응답 타입을 따른다.
- 390px 에서 `/transactions` 의 첫 지출 행을 한 번 누르면 수정 시트(제목 「지출 수정」)가 열린다. 행 안에 「삭제」 버튼이 없다. 첫 날짜 머리의 href 가 `/calendar?month=...&date=...` 다. 행 보조 줄에 작성자 이름이 있다.
- 수입 탭에서도 행을 누르면 「수입 수정」 시트가 열린다.

## 검증

`frontend/` 에서 실행한다.

```bash
pnpm install --frozen-lockfile
pnpm exec playwright install chromium
pnpm tsc --noEmit && pnpm lint && pnpm lint:md
pnpm test -- src/__tests__/actions/family/get-family-members-action.test.ts src/__tests__/app/transactions/page.test.tsx
pnpm test
pnpm test:browser browser/transactions.spec.ts
pnpm test:browser
```

기대값: 모든 명령이 성공한다.

## 변경 파일

| 파일 | 변경 |
|---|---|
| `frontend/src/actions/family/get-family-members-action.ts` | 신규 |
| `frontend/src/__tests__/actions/family/get-family-members-action.test.ts` | 신규 |
| `frontend/src/components/expenses/list/ExpenseListClient.tsx` | 수정 |
| `frontend/src/components/expenses/list/ExpenseItem.tsx` | 삭제 |
| `frontend/src/components/expenses/list/ExpenseList.tsx` | 수정 |
| `frontend/src/components/expenses/dialogs/DeleteExpenseDialog.tsx` | 삭제 |
| `frontend/src/components/incomes/list/IncomeListClient.tsx` | 수정 |
| `frontend/src/components/incomes/list/IncomeItem.tsx` | 삭제 |
| `frontend/src/components/incomes/list/IncomeList.tsx` | 수정 |
| `frontend/src/app/(authenticated)/transactions/page.tsx` | 수정 |
| `frontend/src/__tests__/app/transactions/page.test.tsx` | 수정 |
| `frontend/src/__tests__/components/expenses/ExpenseItem.test.tsx` | 삭제 |
| `frontend/browser/fake-backend.mjs` | 수정 |
| `frontend/browser/transactions.spec.ts` | 신규 |
