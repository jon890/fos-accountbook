# Phase 04. 프론트엔드: 내역 화면 할부 탭과 전체 메뉴 연결

**Execution profile**: standard
**Domain**: app-router

## 목표

내역 화면 `/transactions` 에 네 번째 탭 「할부」(`?tab=installments`)를 더하고, 전체 메뉴에 「할부」 바로가기를 둔다.
phase 03 의 `InstallmentList` 를 그 탭에서 보여 준다.

**범위 외**: 하단 탭(`BottomNavigation`)과 하단 가운데 「거래 추가」 버튼이 여는 창은 바꾸지 않는다. 할부는 할부 탭의 「할부 추가」 버튼으로만 만든다.

## 컨텍스트

- 탭 정의: `frontend/src/app/(authenticated)/transactions/_components/TransactionsTabs.tsx` 의 `type TabType = "expenses" | "incomes" | "recurring"` 와 `TABS` 배열.
- 같은 `TabType` 이 `frontend/src/app/(authenticated)/transactions/_components/TransactionsPageClient.tsx` 에도 따로 선언돼 있다. 두 곳을 함께 바꾼다. 이 파일은 `activeTab !== "recurring"` 일 때 필터와 검색을 보이고, 목록 slot 을 삼항 연산으로 고른다.
- 서버 페이지: `frontend/src/app/(authenticated)/transactions/page.tsx`. `isSupportedTab` 허용 목록, 탭마다 slot prop 하나(`recurringListContent` 등), 맨 아래 `RecurringExpenseListWrapper` 가 있다. `currentMonth` 는 이미 `startDate.slice(0, 7)` 로 계산해 둔다. 이 페이지는 `tab` 에 해당하는 목록 하나만 서버에서 조회한다(`frontend/docs/flow.md` 「5-2」).
- 전체 메뉴: `frontend/src/app/(authenticated)/menu/_components/MenuPageClient.tsx` 의 `groups[0].items` 에 「고정지출」 → `/transactions?tab=recurring` 이 있다. 아이콘은 `lucide-react` 에서 가져온다.
- 브라우저 테스트: `frontend/browser/transactions.spec.ts` 와 가짜 백엔드 `frontend/browser/fake-backend.mjs`. 가짜 백엔드는 `GET /api/v1/families/${FAMILY_UUID}/recurring-expenses` 처럼 경로마다 분기한다(ADR-F34).

**근거 문서**: `frontend/docs/flow.md` 의 「5-2. /transactions 페이지 구조」, 「16. 하단 탭과 전체 메뉴」, 「17. 할부 탭」.

## 의도 메모

- 하단 탭에 넣지 않는다. 하단 탭에는 이미 탭 넷과 가운데 「거래 추가」 버튼이 있어서, 다섯째 탭을 더하면 모바일에서 칸이 좁아지고 ADR-F33 의 배치를 다시 정해야 한다.
- 탭 slot 을 하나 더 늘리지만 조회는 여전히 활성 탭 하나만 한다. 다른 slot 은 `null` 이다.

## 작업 항목

### 1. 탭과 페이지 클라이언트

- `TransactionsTabs.tsx`: `TabType` 에 `"installments"` 를 더하고 `TABS` 끝에 `{ id: "installments", label: "할부" }` 를 더한다. `TabType` 을 `export` 해 `TransactionsPageClient.tsx` 가 가져다 쓰게 하고, `TransactionsPageClient.tsx` 의 중복 선언은 지운다.
- `TransactionsPageClient.tsx`: prop `installmentListContent: ReactNode` 를 더한다. 필터와 검색 조건을 `(activeTab === "expenses" || activeTab === "incomes")` 로 바꾼다. 목록은 `activeTab` 별 객체 조회(`{ expenses: ..., incomes: ..., recurring: ..., installments: ... }[activeTab]`)로 고른다.

### 2. `page.tsx`

- 허용 목록에 `"installments"` 를 더한다.
- `installmentListContent`: `activeTab === "installments"` 일 때만 `Suspense` (fallback 은 반복지출 탭과 같은 카드와 `LoadingSpinner`) 안에 `<InstallmentListWrapper defaultStartMonth={defaultStartDate.slice(0, 7)} />`, 아니면 `null`. `currentMonth` 를 쓰지 않는다. `currentMonth` 는 URL 의 `startDate` 를 따르고, 탭을 바꿔도 검색 파라미터가 남아 이번 달이 아닐 수 있다. `defaultStartDate` 는 `getMonthRange(timezone)` 이 준 이번 달 1일이다.
- 파일 끝에 `async function InstallmentListWrapper({ defaultStartMonth }: { defaultStartMonth: string })`: `getInstallmentsAction()` 이 실패하면 반복지출과 같은 카드에 「할부를 불러올 수 없습니다」, 성공하면 `<InstallmentList items={result.data} defaultStartMonth={defaultStartMonth} />`.
- 할부 탭은 구성원을 조회하지 않는다(`shouldFetchMembers` 는 그대로 지출, 수입만).

### 3. 전체 메뉴

- `MenuPageClient.tsx` 의 가계부 그룹에서 「고정지출」 바로 뒤에 `{ name: "할부", href: "/transactions?tab=installments", icon: CreditCard }` 를 더한다.

### 4. jest 테스트

- `frontend/src/__tests__/app/transactions/page.test.tsx`: `@/actions/installment/get-installments-action` 와 `@/components/installment/InstallmentList` 를 기존 반복지출 mock 처럼 mock 한다. 탭별 `it.each` 에 `"installments"` 를 더하고 slot 매핑에 `installments: page.props.installmentListContent` 를 더한다. `tab: "installments"` 면 `installmentListContent` 만 `null` 이 아니고 구성원 조회 액션은 불리지 않는다(기존 「고정지출 탭에서는 구성원을 조회하지 않는다」 단언과 같은 꼴). 이 테스트는 `TransactionsPageClient` 를 mock 하므로 `getInstallmentsAction` 호출은 단언하지 않는다. 잘못된 탭 목록 케이스에서 `installmentListContent` 도 `null` 이다.
- `frontend/src/__tests__/components/transactions/TransactionsPageClient.test.tsx`: 렌더 props 에 `installmentListContent` 를 더한다. `activeTab="installments"` 면 할부 slot 이 보이고 필터와 검색이 없다. 이 테스트는 `TransactionsTabs` 를 mock 하므로 탭 개수는 여기서 단언하지 않는다.
- `frontend/src/__tests__/components/transactions/TransactionsTabs.test.tsx` (신규): 진짜 `TransactionsTabs` 를 그려 탭이 「지출」, 「수입」, 「반복지출」, 「할부」 네 개이고 `activeTab="installments"` 면 「할부」 가 `aria-selected="true"` 다. `next/navigation` 과 `@/lib/client/navigation` mock 은 `frontend/src/__tests__/components/transactions/NavigationPendingTriggers.test.tsx` 를 따른다.
- `frontend/src/__tests__/app/menu/page.test.tsx`: 링크 목록에 `["할부", "/transactions?tab=installments"]` 를 더하고, 링크 수를 말하는 테스트 이름(「다섯 주요 화면 링크」)을 「여섯 주요 화면 링크」 로 고친다.

### 5. 브라우저 테스트

- `fake-backend.mjs`: `recurringExpenses` 근처에 `installments` 배열을 둔다. 진행 중 한 건(이름 「노트북」, 총 1,200,000, 12개월, `currentRound` 3, `monthlyAmount` 100000, `firstMonthAmount` 100000, `thisMonthAmount` 100000, `remainingAmount` 900000, `progress` `"IN_PROGRESS"`)과 완료 한 건(이름 「청소기」, `progress` `"COMPLETED"`, `currentRound` 와 `installmentMonths` 6, `remainingAmount` 0)이다. 응답 스키마의 필드를 모두 채운다. `GET /api/v1/families/${FAMILY_UUID}/installments` 가 `{ success: true, data: installments }` 를 준다.
- `transactions.spec.ts` 에 테스트 하나를 더한다: 「할부 탭은 요약과 진행 중, 완료 목록을 보이고 항목을 눌러 수정 창을 연다」.
  - `/transactions?tab=installments` 로 간다. 「할부」 탭이 `aria-selected="true"` 다.
  - 「이번 달 할부」 와 「예산과 합계에는 포함되지 않아요」 가 보인다. 요약 금액 `₩100,000`, `₩900,000` 은 항목 문구에도 들어 있어 `getByText` 가 strict mode 로 실패한다. `exact: true` 로 찾고 `.first()` 로 하나만 고르거나, 「이번 달 할부」 문구의 부모 요소 안에서 찾는다.
  - 「노트북 할부 수정」 버튼이 `3/12회` 를 담는다. 「완료」 제목이 보이고 「청소기 할부 수정」 버튼이 있다.
  - 노트북 줄을 누르면 「할부 수정」 제목이 보이고 이름 입력값이 「노트북」 이다. `Escape` 로 창을 닫는다.
  - 「할부 추가」 를 누르면 「할부 추가」 제목이 보인다.
- 기존 「내역 탭은 추가 버튼 없이 하단 추가 시트를 연다」 의 탭 목록에는 `installments` 를 넣지 않는다. 할부 탭에는 「할부 추가」 버튼이 있기 때문이다.

## 검증

```bash
cd frontend && pnpm exec jest src/__tests__/app/transactions/page.test.tsx src/__tests__/components/transactions/TransactionsPageClient.test.tsx src/__tests__/components/transactions/TransactionsTabs.test.tsx src/__tests__/app/menu/page.test.tsx
cd frontend && pnpm tsc --noEmit && pnpm lint && pnpm lint:md && pnpm test
cd frontend && pnpm test:browser browser/transactions.spec.ts
```

브라우저 테스트는 Playwright 브라우저가 필요하다. 설치돼 있지 않으면 `pnpm exec playwright install chromium` 을 먼저 실행한다.

## 변경 파일

| 파일 | 변경 |
|---|---|
| `frontend/src/app/(authenticated)/transactions/_components/TransactionsTabs.tsx` | 수정 |
| `frontend/src/app/(authenticated)/transactions/_components/TransactionsPageClient.tsx` | 수정 |
| `frontend/src/app/(authenticated)/transactions/page.tsx` | 수정 |
| `frontend/src/app/(authenticated)/menu/_components/MenuPageClient.tsx` | 수정 |
| `frontend/src/__tests__/app/transactions/page.test.tsx` | 수정 |
| `frontend/src/__tests__/components/transactions/TransactionsPageClient.test.tsx` | 수정 |
| `frontend/src/__tests__/app/menu/page.test.tsx` | 수정 |
| `frontend/src/__tests__/components/transactions/TransactionsTabs.test.tsx` | 신규 |
| `frontend/browser/fake-backend.mjs` | 수정 |
| `frontend/browser/transactions.spec.ts` | 수정 |
