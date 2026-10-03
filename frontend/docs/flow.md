# fos-accountbook 사용자 흐름

## 1. 최초 사용자 온보딩

```
[앱 접속 = /]
    │
    ▼
세션 확인 (src/app/page.tsx)
    │
    ├─ 미로그인 → / (Landing 표시: Hero + Features 3 + CTA)
    │               └─ CTA "지금 시작하기" → /auth/signin
    │                       └─ Google / Naver OAuth 선택
    │                               └─ NextAuth 처리 → JWT 발급 → /
    │
    └─ 로그인됨 → /calendar redirect → defaultFamilyUuid 확인
                    │
                    ├─ 없음 → /families/create
                    │           └─ 가족 이름 + 월 예산 입력
                    │                   └─ 가족 생성 → 지출 11개, 수입 4개 카테고리 자동 생성
                    │                           └─ /calendar
                    │
                    └─ 있음 → /calendar
```

---

## 2. 가족 초대 플로우

```
[초대자 (OWNER)]
    │
    ├─ /settings → 가족 관리 탭
    │   └─ "초대 링크 생성" 클릭
    │           └─ createInvitationLinkAction()
    │                   └─ 토큰 생성 (UUID 기반 256bit)
    │                   └─ 만료: 72시간
    │                   └─ URL 복사: /invite/{token}
    │
    └─ 링크 공유 (카카오톡, 문자 등)

[수락자]
    │
    ├─ /invite/{token} 접속
    │   └─ (인증 안 한 상태면 callbackUrl 보존해 /auth/signin — 인증 후 invite 재진입)
    │   └─ getInvitationInfoAction(token) — skipAuth (로그인 전 미리보기 허용), token Zod uuid 검증 (ADR-F06)
    │           ├─ 만료/사용됨/취소 → /?error=invalid_invitation (단일 코드 — 토큰 상태 열거 차단, 상세 사유는 서버 로그만)
    │           └─ 유효 → InvitePageClient (plan015 centered card 패턴)
    │                   │
    │                   ├─ 96px 원형: 초대자가 있으면 초대자 아바타(사진이 없으면 이름 첫 글자), 없으면 gradient-family + Users 아이콘
    │                   ├─ 설명: 「{초대자}님이 가계부를 함께 관리하자고 초대했어요」. 초대자가 없으면 「가계부를 함께 관리하도록 초대받았어요」
    │                   ├─ 정보 칸: 가족 이름, 멤버 수(「현재 N명」, 값이 없으면 줄을 숨김), 만료 일시(24h 이내 시 expense/10 warning 배지)
    │                   │
    │                   └─ [수락 / 거절 CTA]
    │                           └─ 수락 → acceptInvitationAction(token) — requireAuth + token Zod uuid 검증 (ADR-F06)
    │                                   └─ FamilyMember 생성 (MEMBER 역할)
    │                                   └─ defaultFamilyUuid 설정
    │                                   └─ /calendar 리다이렉트

[초대 링크 삭제 (OWNER)]
    │
    └─ deleteInvitationAction(invitationUuid) — requireAuth + invitationUuid Zod uuid 검증 (ADR-F06) + 선택 가족 (ADR-F25 패턴 C)
            └─ assertInvitationOwnership(familyUuid, invitationUuid): 선택 가족의 활성 초대에 없으면 entityNotFound
            └─ deleteInvitation → revalidatePath("/")
```

---

## 3. 거래 등록 플로우 (plan014 통합)

달력의 「이 날짜에 추가」와 하단 탭 가운데 추가 버튼이 동일한 `AddTransactionDialog`를 부른다(ADR-F21, ADR-F37).
달력의 추가 버튼은 선택한 날짜를 넘긴다. 하단 탭 가운데 버튼은 지출을 기본으로 열며, 달력에서는 선택 날짜를, 그 밖에서는 오늘을 사용한다. 두 진입점 모두 시트 안에서 거래 종류를 바꿀 수 있다.

```
[진입점: defaultType, defaultDate 만 다름]
    │
    └─ AddTransactionDialog (responsive: mobile Sheet bottom / md+ Dialog 720px)
            │
            ├─ Segmented 3 토글: 지출 / 수입 / 고정지출 (role=radiogroup)
            │       (gradient-expense / gradient-income / gradient-primary)
            │
            ├─ TransactionFormFields (type 분기)
            │   ├─ AmountInput (₩ + 56/64px num, 빠른 추가 칩 +1k/+5k/+10k, md+ +50k, 문구는 종류별)
            │   │   └─ md 미만: 시트 안 숫자패드(1~9, 00, 0, 지우기), 기기 키보드 없음 (ADR-F40)
            │   ├─ CategoryGrid (5×2 mobile / 10×1 desktop, role=radiogroup, 방향키 이동, 칸 44px 이상, --color-cat-*-bg/-fg 톤)
            │   │   └─ 지출·고정지출은 EXPENSE, 수입은 INCOME만 표시
            │   ├─ [expense 일 때] 예산에서 제외 스위치
            │   ├─ Description input (메모, name="description")
            │   ├─ [expense/income 일 때] Date input (type="date", default: defaultDate ?? 오늘) + 「오늘」「어제」 칩
            │   └─ [recurring 일 때]  Name input + DayOfMonth (1~28, 비우면 빈 칸 유지)
            │
            ├─ 저장 버튼 위 안내: 첫 번째로 빠진 값 (금액, 카테고리, 날짜 또는 이름, 결제일). 빠진 값이 있으면 버튼 비활성
            │
            └─ 저장 (요청 중 fieldset disabled) → type 분기
                    ├─ expense  → createExpenseAction()         → POST /families/{uuid}/expenses
                    ├─ income   → createIncomeAction()          → POST /families/{uuid}/incomes
                    └─ recurring→ createRecurringExpenseAction()→ POST /families/{uuid}/recurring-expenses
                            └─ revalidatePath → toast 성공 메시지
```

거래 종류를 바꿔도 금액, 설명과 선택한 날짜를 유지한다.
고정지출을 거쳐 지출이나 수입으로 돌아와도 날짜는 그대로다.
카테고리 선택, 고정지출 이름과 결제일은 종류를 바꿀 때 초기화한다.
새 종류의 첫 카테고리를 자동으로 선택하지 않는다.

예산 제외 카테고리는 선택 타일의 배지와 접근 이름으로 구분한다.
지출의 「예산에서 제외」 스위치는 카테고리가 제외되면 켜진 상태로 잠긴다.
잠금 중에도 지출 자체 플래그는 사용자가 고른 값을 그대로 전송한다.
카테고리를 바꾸면 스위치는 사용자가 고른 이전 값으로 돌아간다.
수입과 고정지출에는 이 스위치를 표시하지 않는다.

---

## 4. 지출·수입 수정/삭제 플로우

```
[달력 날짜 목록 또는 내역 목록의 행 탭]
    │
    └─ EditTransactionDialog (type 잠금, 기존 값 pre-fill, 모바일 Sheet bottom)
            ├─ 저장 → updateExpenseAction() / updateIncomeAction()
            │       └─ PUT /expenses/{uuid} | /incomes/{uuid} → revalidatePath → UI 갱신
            └─ 삭제 버튼 (다이얼로그 하단 왼쪽, text-expense)
                    └─ 확인 AlertDialog → deleteExpenseAction() / deleteIncomeAction()
                            └─ DELETE (Soft Delete) → revalidatePath → 다이얼로그 닫고 목록에서 제거
```

가족 구성원이면 누가 등록했든 수정하고 삭제할 수 있다. 등록자만 허용하는 제한은 두지 않는다.
행 안에는 수정이나 삭제 버튼을 두지 않는다. 삭제는 수정 시트 안의 확인창에서만 수행한다.
수정 창이 열린 동안에는 서버 조회 결과가 갱신돼도 작성 중인 폼 값을 유지한다. 창을 닫고 다시 열면 최신 거래 값으로 초기화한다. 수정 요청 중에는 같은 거래의 삭제를 막는다.

지출 수정 스위치는 기존 지출의 예산 제외 값으로 초기화한다.
켜기와 끄기 모두 저장할 수 있으며, 카테고리 제외에 따른 잠금은 등록과 같다.
카테고리 제외로 스위치가 잠겨 있어도 지출 자체의 제외 값은 그대로 보낸다. 나중에 카테고리 제외를 풀어도 지출의 값이 남는다.

---

## 5. 달력 홈 (`/calendar`)

로그인 뒤 첫 화면이다. 부부가 각자 등록한 지출을 날짜별로 비교하고, 날짜를 골라 등록, 수정, 삭제한다. 결정 근거는 ADR-F32 다.

```
[/calendar?month=YYYY-MM&date=YYYY-MM-DD] (Server Component)
    │   month 없음 → 사용자 시간대의 이번 달. date 없음 → 오늘이 그 달이면 오늘, 아니면 그 달 1일
    │
    └─ getCalendarMonthAction(year, month)  ── Promise.all 6개 호출
            ├─ /dashboard/daily-stats?year&month       → 날짜별 합계, memberExpenses, memberExpenseTotals
            ├─ /expenses?startDate&endDate&size=1000   → 그 달 지출 목록 (날짜 목록 표시용)
            ├─ /incomes?startDate&endDate&size=1000    → 그 달 수입 목록
            ├─ /families/{uuid}/members                → 구성원 이름, 사진, 가입 순서
            ├─ getCachedFamilyCategories              → 카테고리 이름, 아이콘과 예산 제외 정보 연결
            └─ /dashboard/budget-summary?year&month    → 전체 예산, 생활비, 예산 항목별 쓴 금액과 한도
    │
    └─ CalendarHome ("use client")
            ├─ MonthHeader: ‹ 2026년 9월 ›  (월 이동 = URL month 변경, 서버 다시 조회)
            ├─ BudgetSummaryCard: 예산, 생활비, 예산 항목마다 이름, 쓴 금액 / 한도, 진행 막대. 카드를 누르면 /budget
            ├─ MemberTotals: 구성원별 이번 달 지출 (색 점, 이름, 금액), 가족 합계
            ├─ CalendarGrid: 7열. 칸마다 날짜, 구성원별 지출 한 줄씩(색 점과 줄인 금액)
            │       └─ 날짜 탭 → 선택 날짜 변경 (클라이언트 상태와 history.replaceState, 서버 호출 없음)
            └─ DayTransactionList: 선택 날짜의 지출과 수입 (등록자 색 점, 카테고리, 메모, 금액)
                    ├─ 항목 탭 → EditTransactionDialog (「4. 지출·수입 수정/삭제 플로우」)
                    └─ 「이 날짜에 추가」 → AddTransactionDialog(defaultDate = 선택 날짜)
```

- 구성원 색은 가입 순서로 정한다. 첫 구성원 `member-1`, 다음 `member-2` 순서이고 네 가지 색을 돌려 쓴다. 토큰은 `globals.css` 의 `--color-member-{1..4}`.
- 칸의 금액 표기: 1만 이상은 `3.2만`, 1천 이상은 `9.8천`, 그 밖은 숫자 그대로. 글자는 11px 이상.
- 칸에는 지출이 큰 구성원 두 명을 표시하고, 나머지는 `+N`으로 줄인다. 버튼의 접근성 이름에는 모든 구성원의 이름과 지출을 담는다.
- 구성원 목록에서 찾지 못한 `userUuid`(가족을 떠난 사람)는 회색 점과 「이전 구성원」 으로 표시한다.
- 빈 상태: 그 달 거래가 없으면 달력은 그대로 두고 날짜 목록에 「이 날 기록이 없어요」 와 추가 버튼을 둔다.
- 지출 또는 수입의 `totalElements`가 1000을 넘으면 서버에 종류, 조회 연월, 전체 건수와 받은 건수를 경고로 남긴다. 거래 내용과 가족 식별자는 기록하지 않는다.
- 예산 요약 카드는 보고 있는 달의 값을 보인다. 한 줄은 이름, 「쓴 금액 / 한도」, 진행 막대와 퍼센트다.
  「예산」 줄이 맨 위, 「생활비」 줄이 그다음이고 항목은 만든 순서다. 생활비 한도는 월 예산에서 항목 한도를 뺀 값이다.
  항목 한도 합이 월 예산을 넘으면(`allocationExceeded`) 생활비 줄 아래에 「항목 한도가 예산을 넘었어요」 를 지출 색으로 보인다. 한도가 0 이면 쓴 금액만 보이고 막대와 퍼센트는 그리지 않는다.
  쓴 금액이 한도를 넘으면 금액과 퍼센트를 지출 색(`text-expense`)으로 보이고 막대는 100% 로 채운다. 퍼센트는 실제 값(예: 103%)을 쓴다.
- 예산 요약의 빈 상태: 월 예산이 0 이고 항목도 없으면 카드 안에 「예산 항목을 만들면 여기서 볼 수 있어요」 한 줄과 /budget 으로 가는 링크만 둔다.
- 실패: 여섯 호출 중 하나라도 실패하면 `(authenticated)/error.tsx` 로 간다. 401은 ADR-F26에 따라 로그인으로, 유효하지 않은 기본 가족의 403/404는 `/families/select`로 보낸다.
- 등록, 수정, 삭제 뒤에는 Server Action 의 `revalidatePath("/calendar")` 로 같은 달을 다시 받는다.
- 같은 달을 다시 받아도 초기 날짜가 같으면 선택 날짜를 유지한다. 초기 날짜가 바뀌면 선택을 초기화해 서버가 지정한 날짜로 돌아간다.
- 하단 달력 탭으로 돌아와 URL의 `date`가 제거되면, 초기 날짜가 같아도 선택 날짜를 초기화한다.
- 내역과 달력의 지출 행은 지출 자체 플래그나 카테고리 플래그가 켜지면 보조 줄에 「예산 제외」를 표시한다.
- `/dashboard` 는 없앤다. 예전 주소로 들어오면 `/analytics` 로 보낸다. 대시보드의 예산 카드, 이번 달 수입·지출, 고정비 카드는 `/analytics` 위쪽으로 옮긴다(「5-3」). 최근 내역과 빠른 메뉴는 달력과 전체 메뉴가 대신하므로 옮기지 않는다.

---

## 5-2. /transactions 페이지 구조 (plan003)

```
[page.tsx (server) — searchParams { tab, categoryId, startDate, endDate, limit, q, amountMin, amountMax }]
    ├─ getFamilyMembersAction() → 선택된 가족 구성원 → 목록 Client의 작성자 이름과 색 점
    ├─ TransactionsTabs (segmented role=tablist, bg-bg-muted / bg-bg-elev)
    ├─ FilterChips (카테고리 / 기간 / AmountRangeFilter / SearchBar)
    ├─ FilterSheet (모바일, 「필터」 버튼과 적용 개수 배지, 하단 시트)
    ├─ ExpenseSummaryWrapper → CategoryExpenseSummary (접힌 채 시작, 걸러 보는 카테고리가 있으면 펼친 채 시작하고 그 행이 6위 아래면 전체를 보임, 머리에 총액과 비중 막대, 펼치면 한 줄씩 상위 5개와 「전체 N개 보기」, 행 탭 → ?categoryId=)
    │     ├─ SearchBar (300ms debounce, ?q= URL 동기화, 모바일 expand)
    │     └─ AmountRangeFilter (Popover, amountMin/Max URL param)
    └─ ExpenseListClient / IncomeListClient / RecurringExpenseList (tab 별)
            ├─ LoadMoreButton (더 보기, 3000건 상한 안내)
            └─ DateGroupSection<T> (날짜 링크와 거래 종류별 합계, 반복 목록은 날짜 그룹 없이 표시)
                    └─ TransactionRow (설명, 카테고리·작성자·시각, 금액)
                            └─ 행 탭 → EditTransactionDialog
```

`services/transaction/transaction-service.ts`의 `groupTransactionsWithTotal`은 날짜별로 묶고 합계를 계산한다.
지출과 수입은 선택한 기간을 300건씩 받는다(`limit` 300, 600, ...). 더 있으면 목록 끝에 「더 보기」 가 뜨고 쪽 넘김 버튼은 없다 (ADR-F41).
한 번에 최대 3000건까지 받으며, 그 뒤에도 내역이 남으면 조회 기간을 줄이라는 안내를 보인다. 필터가 바뀌면 다시 300건부터 받는다.
검색어와 금액 범위는 받은 목록에 `applyClientFilters` 를 적용해 화면이 거른다. 검색어는 메모와 카테고리 이름에서 찾는다. 받지 않은 건이 남으면 「불러온 N건 안에서 찾았어요」 를 함께 보인다.
검색 결과가 없어도 미수신 건이 남으면 빈 상태와 범위 안내, 더 보기를 함께 보인다.
모바일에서는 기간, 카테고리, 금액 필터를 「필터」 버튼(적용 개수 배지)이 여는 하단 시트에 모은다.
시트에서 바꾼 값은 적용할 때 한 번에 반영한다. 초기화는 이번 달·전체 카테고리·금액 없음으로 되돌리며, 취소하면 주소를 바꾸지 않는다. 잘못된 날짜나 금액 범위는 안내하고 적용하지 않는다.
카테고리별 지출 요약에서 걸러 보는 행을 다시 누르면 카테고리 필터가 풀린다.

page.tsx 는 `tab` 에 해당하는 목록 하나만 서버에서 조회한다. 탭을 바꾸면 URL 이 바뀌고 서버가 그 탭만 다시 그린다.
세 탭을 모두 slot props 로 넘기면 RSC 가 보이지 않는 탭까지 렌더링해 조회가 매번 세 배로 나간다.
시간대는 세션의 `session.user.profile.timezone` 을 쓰고 프로필 API 를 따로 부르지 않는다.
날짜 머리를 누르면 해당 날짜를 선택한 달력으로 이동한다. 지출은 지출 색, 수입은 수입 색과 `+` 부호로 표시한다.
지출·수입 탭만 구성원을 조회한다.
구성원 조회의 인증 오류는 로그인으로 이동하고, 일반 조회 실패는 빈 목록으로 처리해 작성자를 「이전 구성원」으로 표시한다.
내역 화면의 추가 진입은 하단 탭 가운데 버튼 하나다. 현재 탭과 관계없이 지출을 기본으로 열며, 시트에서 수입이나 고정지출로 바꿀 수 있다.

---

## 5-3. /analytics 페이지 구조 (plan006)

```
[page.tsx (server) — searchParams { period: m1|m3|m6|y1 }]
    │
    └─ Promise.all 7 Action:
        ├─ getDashboardStatsAction()                          # /dashboard/stats/monthly
        ├─ getMonthlyDailyStatsAction(year, month)            # /dashboard/daily-stats
        ├─ getExpensesAction({ familyUuid, startDate, endDate, limit: 1000 })  # 지출 상위 5건 표시용
        ├─ getCategoryBreakdownWithDeltaAction(year, month)   # /dashboard/stats/category-breakdown?compareWithPrev=true + 두 달 monthly-trend
        ├─ getMonthlyTrendAction(period, year, month)         # /dashboard/stats/monthly-trend?from&to 한 번
        ├─ getFamilyCategoriesAction(familyUuid)             # TOP 5 카테고리 표시용
        └─ getRecurringExpensesTotalAction()                 # /recurring-expenses/monthly-total
    │
    ├─ 「이번 달 YYYY년 M월」 제목: 아래 차트의 월 이동과 관계없이 이번 달 기준
    │   ├─ 예산 카드 → /budget
    │   ├─ 이번 달 수입·지출 카드
    │   └─ 이달 고정비 카드 → /transactions?tab=recurring
    └─ AnalyticsClient (use client)
            ├─ AnalyticsPeriodToggle (segmented role=tablist, URL ?period= 단방향)
            ├─ AnalyticsCategoryDonut (172/160px Donut + 중앙 totalDelta ↑/↓)
            ├─ MonthlyTrendBar (순수 CSS bar, 마지막 막대 bg-brand-500 강조)
            ├─ CategoryDetailList (progress + 전월 delta % 2-col grid)
            └─ 지출 TOP 5: categoryUuid 로 카테고리 목록에서 아이콘과 이름을 찾는다. 전체 건수가 받은 건수보다 많으면 「최근 1000건 안에서 골랐어요」 를 보인다
```

데이터 흐름 핵심 (ADR-F30):
- 합계는 모두 백엔드 집계 API 가 계산한다. 프론트는 목록을 받아 더하지 않는다.
- `getCategoryBreakdownWithDelta`: `category-breakdown?compareWithPrev=true` 로 카테고리별 `deltaPercent` 를 받는다. 전체 합계의 전월 대비(`totalDelta`)는 같은 호출과 병렬로 직전 달부터 이번 달까지 `monthly-trend` 를 받아 계산한다. 직전 달 합계가 0 이면 null
- `getMonthlyTrend`: m1/m3/m6/y1 → `monthly-trend?from=YYYY-MM&to=YYYY-MM` 한 번. 응답에 없는 달은 0 으로 채워 개월 수만큼 점을 만든다
- 비율과 전월 대비는 백엔드가 소수 둘째 자리까지 주고 프론트가 정수로 반올림한다

분석 화면 위쪽에는 예전 대시보드의 예산 카드(`BudgetHeroCard`, 누르면 `/budget`), 이번 달 수입·지출(`IncomeExpenseStats`), 고정비 카드(「14」)를 둔다.
그 아래가 기간 토글과 차트다.
통계, 분석과 예산의 현재 연월은 세션 프로필의 시간대를 쓴다.
시간대가 없거나 잘못되면 `Asia/Seoul` 을 쓴다.
명시한 조회 연월은 바꾸지 않는다.
예산의 남은 일수도 같은 시간대의 오늘로 계산한다.
분석 Page의 일반 조회 실패는 오류 화면으로 전달하고 인증 실패는 로그인으로 보낸다.

---

## 6. 예산 알림 플로우 (백엔드)

```
[지출 등록/수정]
    │
    └─ ExpenseCreatedEvent / ExpenseUpdatedEvent 발행
            │
            └─ BudgetAlertService 수신
                    │
                    ├─ 해당 월 예산 합계 계산 (예산 제외와 반복 지출이 만든 지출을 뺀다. 예산 항목의 지출은 포함한다. ADR-B26)
                    │
                    ├─ 80% 이상 → BUDGET_WARNING Notification 생성
                    │               (yearMonth 기준 중복 방지)
                    │
                    └─ 100% 이상 → BUDGET_EXCEEDED Notification 생성
                                    (yearMonth 기준 중복 방지)

[프론트엔드 — plan017]
    └─ Header 의 NotificationBell (Popover trigger)
            ├─ getUnreadCountAction() (1분 폴링) → bg-expense Badge (count > 99 시 "99+")
            └─ 클릭 → Popover (NotificationList, max-h-[500px])
                    │
                    ├─ 최근 10개 + "전체보기" 링크 → /notifications
                    │
                    └─ NotificationItem 톤 매핑 (2 단계):
                            ├─ BUDGET_50_EXCEEDED / BUDGET_80_EXCEEDED → warning 톤 (bg-warning/10 + text-warning)
                            ├─ BUDGET_100_EXCEEDED                       → expense 톤 (bg-expense/10 + text-expense)
                            └─ default                                    → brand 톤 (bg-brand-50 + text-brand-700)
                    └─ 항목 탭 → 읽음 처리, 예산 알림(BUDGET_*)이면 /budget 으로 이동

[/notifications 전용 페이지 — plan017]
    └─ 전체 알림 목록 + segmented (전체 / 안 읽음) + pagination
            ├─ Skel skeleton (plan012 .ab-skel 재사용) — loading 상태
            ├─ EmptyState (plan012 EmptyState 재사용) — "알림이 없어요"
            └─ "모두 읽음" 버튼 (페이지 최상단)
```

---

## 7. 카테고리 삭제 플로우

```
[CategoryItem] → 삭제 클릭
    │
    └─ deleteCategoryAction(categoryUuid)
            │
            ├─ 기본 카테고리(isDefault=true) → 삭제 불가 오류
            │
            └─ 일반 카테고리 → 종류별 거래 이관 후 Soft Delete. 예산 항목에 속해 있었으면 그 항목에서도 빠진다
                    ├─ EXPENSE → 삭제 이력을 포함한 지출과 ACTIVE 고정지출을 '미분류'로 이동
                    ├─ INCOME → 삭제 이력을 포함한 수입을 '기타 수입'으로 이동
                    └─ revalidatePath → 목록 갱신
```

---

## 8. 인증 토큰 갱신 플로우 (NextAuth)

```
[모든 API 요청]
    │
    └─ NextAuth JWT callback
            │
            ├─ 토큰 만료 5분 전?
            │   └─ Yes → refreshBackendToken()
            │               └─ POST /auth/refresh
            │                       └─ 새 accessToken + refreshToken → JWT 갱신
            │
            └─ No → 기존 accessToken 사용
                    └─ Authorization: Bearer {token} 헤더 추가
```

---

## 9. 가족 선택 플로우 (다중 가족)

```
[Header의 FamilySelector]
    │
    └─ 가족 드롭다운 클릭
            └─ getFamiliesAction() → 내 가족 목록
                    └─ 가족 선택
                            └─ setDefaultFamilyAction(familyUuid)
                                    └─ PUT /users/me/profile { defaultFamilyUuid }
                                            └─ 세션 업데이트 → 전체 페이지 revalidate
```

---

## 10. 반복 지출 등록

```
[거래내역 > 고정지출 탭]
    │
    └─ 하단 탭 가운데 추가 버튼
            └─ AddTransactionDialog 열림 → 고정지출 종류 선택
                    └─ TransactionFormFields의 공용 입력
                            ├─ AmountInput: 금액
                            ├─ CategoryGrid: 카테고리
                            ├─ 이름 (필수)
                            └─ 매월 N일 (1~28, 비우면 빈 칸 유지)
                            │
                            └─ 저장 → createRecurringExpenseAction()
                                    ├─ requireAuth()
                                    ├─ Zod 검증 (dayOfMonth 1~28 range check)
                                    └─ POST /families/{uuid}/recurring-expenses
                                            └─ "내일부터 매월 N일에 자동 등록됩니다" toast
                                            └─ revalidatePath("/transactions")
```

금액 입력, 저장 안내와 요청 중 잠금은 「3. 거래 등록 플로우」의 공용 규칙을 따른다.

---

## 11. 고정지출 탭 조회

```
[거래내역 > 고정지출 탭 접근] (Server Component)
    │
    └─ getRecurringExpensesAction(month)
            └─ GET /families/{uuid}/recurring-expenses?month=YYYY-MM
                    └─ { totalMonthlyAmount, items[] }
                            │
                            ├─ 이달 합계 카드: "이번달 고정비 OOO원"
                            │
                            └─ 템플릿 목록 (day_of_month 오름차순)
                                    ├─ TransactionRow: 이름, 카테고리와 매월 N일, 금액
                                    ├─ generatedThisMonth=true → 「이번 달 반영됨」 배지
                                    └─ 항목 클릭 → EditTransactionDialog
```

---

## 12. 반복 지출 수정/삭제

```
[반복 지출 공용 행 탭 → EditTransactionDialog]
    │
    ├─ 수정 시트 (type=recurring, 잠금, 기존 값 pre-fill)
    │           └─ 수정 후 저장 → updateRecurringExpenseAction()
    │                   └─ PUT /families/{uuid}/recurring-expenses/{uuid}
    │                           └─ "다음 스케줄부터 반영됩니다" toast
    │                           └─ revalidatePath("/transactions")
    │
    └─ 시트의 종료 버튼 클릭
            └─ AlertDialog: "고정지출을 종료하시겠어요? 기존 등록된 지출은 유지됩니다."
                    └─ 확인 → deleteRecurringExpenseAction()
                            └─ DELETE /families/{uuid}/recurring-expenses/{uuid} (ENDED)
                                    └─ "고정지출이 종료되었습니다" toast
                                    └─ revalidatePath("/transactions")
```

---

## 13. 스케줄러 자동 생성 (백엔드)

```
[매일 새벽 1시 — @Scheduled(cron = "0 0 1 * * ?")]
    │
    └─ RecurringExpenseScheduler.generateRecurringExpenses()
            │
            └─ 오늘 day_of_month인 ACTIVE 템플릿 전체 조회
                    │
                    └─ 각 템플릿에 대해:
                            ├─ Expense INSERT 시도
                            │   ├─ recurring_expense_uuid + year_month UNIQUE 위반 → log.warn 후 skip
                            │   └─ 성공 → RefreshCw 배지용 recurring_expense_uuid, year_month 저장
                            │
                            └─ ApplicationEvent 발행 (AFTER_COMMIT)
                                    └─ RECURRING_EXPENSE_CREATED 알림 생성 (가족 전체)
```

---

## 14-1. Header / TopBar 구조 (plan019)

`src/components/layout/Header.tsx`는 `(authenticated)/layout.tsx`의 sticky top bar로, 모든 인증 페이지에 표시한다.

```
[Header sticky top-0 z-50 backdrop-blur-xl bg-bg-elev/95 border-b border-border]
    ├─ 좌: 로고 (brand-500 Wallet 아이콘 + "우리집 가계부" text-fg 단색)
    │      → /calendar 링크
    │      (하위 화면에서는 로고 자리에 뒤로 가기 버튼. 「16. 하단 탭과 전체 메뉴」)
    │
    └─ 우 (md+ 전용 / 모바일 별도 진입점):
            ├─ FamilySelectorDropdown (md+ 전용 표시, 모바일은 Avatar dropdown 안 진입)
            ├─ NotificationBell (Popover trigger — plan017)
            └─ Avatar dropdown
                    ├─ 프로필 (이름 + 이메일)
                    ├─ [모바일 전용] 가족 전환 → Sheet bottom + FamilySelectorList
                    ├─ 설정 → /settings
                    └─ 로그아웃 (text-expense — variant=destructive 폐기)
```

토큰 적용:
- `bg-bg-elev/95` backdrop-blur (light/dark 자동)
- `border-border` (하드 회색 폐기)
- `ring-brand-100` Avatar (`ring-blue-100` 폐기)
- `text-fg-muted` 보조 텍스트 (`text-muted-foreground` 폐기)
- 로고 아이콘과 AvatarFallback은 `text-brand-fg`를 쓴다(`text-white` 폐기, ADR-F23).

---

## 14-2. 빈 상태 / 에러 / 로딩 (plan012)

App Router 의 segment 경계에서 일관 표시:

- **Empty** (`src/components/empty/EmptyState.tsx`): 거래가 없을 때 96px brand-50 원형 배경, inbox 아이콘, 제목과 부제를 표시한다. CTA와 팁 박스는 선택적으로 둔다.
- **Error** (`src/app/error.tsx`, `src/app/global-error.tsx`, `src/app/(authenticated)/error.tsx`): 88px expense/10 원형 배경, AlertCircle, "문제가 발생했어요" 문구와 다시 시도 또는 홈으로 버튼을 표시한다. 디버그 박스는 개발 환경에서만 보인다.
- **Loading** (`src/app/(authenticated)/{calendar,transactions,analytics,*}/loading.tsx`): 페이지 구조에 맞춘 `Skel`을 표시한다. `globals.css`의 `ab-shimmer` 애니메이션과 `.ab-skel` 클래스를 재사용한다.

- **전환 대기** (ADR-F39): 다른 화면으로 가는 링크는 `loading.tsx` 스켈레톤이 바로 뜬다. 클라이언트에서 `useAppRouter` 의 `push`, `replace`, `refresh` 를 호출하면 150ms 뒤 화면 맨 위에 진행 막대가 뜬다. `back` 은 history 이동의 완료 시점을 알 수 없어 제외한다.
  - 같은 화면에서 주소 값만 바꾸는 전환(내역 탭, 필터, 검색, 더 보기, 카테고리 요약 행, 달력 월 이동, 분석 기간)은 바뀔 영역이 `aria-busy="true"` 와 흐림으로 대기를 보인다.
  - 서버 액션 뒤 이동하는 버튼(가족 선택, 가족 전환, 가족 만들기, 초대 수락)은 이동이 끝날 때까지 비활성이고 진행 표시를 유지한다.
  - 헤더의 가족 전환 시트는 누르면 바로 열리고, 목록을 받는 동안 행 스켈레톤을 보인다.

`error.tsx` 는 모두 `"use client"` 첫 줄 필수 (App Router 규약). `loading.tsx` 는 Server Component OK.

---

## 14-2-2. 404 / 403 / 500 상태 카드 (plan018)

`StatusCard` 공용 helper 가 3 상태를 톤으로 구분:

| status | 톤 | 아이콘 | 메시지 | CTA |
|---|---|---|---|---|
| 404 | brand (bg-brand-50 + text-brand-500) | Compass | "찾을 수 없어요" | public: "홈으로" → `/` / authenticated: "홈으로" → `/calendar` |
| 403 | warning (bg-warning/10 + text-warning) | Lock | "권한이 없어요" | "홈으로" → `/calendar` (+ 보조: "로그인 다시 시도" → `/auth/signin`) |
| 500 | expense (bg-expense/10 + text-expense) | AlertCircle | "문제가 발생했어요" | "다시 시도" → reset() + "홈으로" |

라우팅:
- `src/app/not-found.tsx` (전역, public 라우트용)
- `src/app/(authenticated)/not-found.tsx`는 Header를 유지하고 StatusCard 404를 표시한다.
- `src/app/(authenticated)/forbidden.tsx` (Next.js 16 `forbidden()` 호출 시) — status=403
- 500은 기존 `error.tsx`가 자동 처리하며 같은 StatusCard를 사용한다.

---

## 14-3. /budget 페이지 (plan013)

Dashboard BudgetHeroCard 의 확장 전용 페이지. 분석은 /analytics, 예산 소화는 /budget 으로 역할 분리.

```
[/budget (server) — Promise.all 5 Action]
    ├─ getDashboardStatsAction() → { budget, monthlyExpense, remainingBudget, year, month }  (monthlyExpense 는 예산 합계)
    ├─ getBudgetItemsAction() → 예산 항목 목록
    ├─ getFamilyCategoriesAction() → 항목에 넣을 지출 카테고리 선택지
    ├─ getMonthlyDailyStatsAction(year, month) → { items: { date, expense, income }[] }
    └─ getMonthlyCategoryBreakdownAction() → { items: { categoryUuid, name, color?, totalAmount }[] }
            │
            └─ BudgetClient (use client)
                    ├─ 예산 현황 Hero 카드 (Dashboard 와 시각 일치)
                    ├─ 3-col 통계: 일 평균 지출 / 남은 일수 / 권장 일 예산 (남은예산÷남은일수)
                    ├─ BudgetCumulativeLine (recharts LineChart + ReferenceLine 예산선)
                    ├─ BudgetCategoryBars (수평 bar top 5 + 예산 대비 % + ↑많음 라벨)
                    └─ BudgetItemsSection: 예산 항목 목록(이름, 월 한도, 카테고리 이름들)과 「항목 추가」
                            ├─ 추가, 수정 → BudgetItemDialog (이름, 월 한도, 지출 카테고리 여러 개 선택)
                            │       └─ 다른 항목에 이미 속한 카테고리는 고를 수 없게 비활성으로 보인다
                            └─ 삭제 → AlertDialog 확인 뒤 deleteBudgetItemAction
```

- 예산 항목 구역은 월 예산이 0 이어도 보인다. 항목이 없으면 「용돈처럼 따로 관리할 지출을 예산 항목으로 만들어 보세요」 와 「항목 추가」 버튼을 둔다.
- 저장과 삭제가 성공하면 sonner 토스트를 띄우고 `revalidatePath` 로 `/budget`, `/calendar`, `/analytics` 를 다시 받는다.
- 저장 실패: 이름 중복(BI004), 카테고리 충돌(BI002), 10개 초과(BI003)는 백엔드 메시지를 토스트로 보이고 대화상자를 닫지 않는다.
- 누적 선과 카테고리 막대는 고정지출을 포함한 모든 지출을 더한 값을 쓴다. 위쪽 카드의 예산 합계와 기준이 다르다(ADR-B25 의 「감당할 것」).
- 예산 항목 구역 위에 「생활비 한도 = 예산 − 항목 한도 합」 을 금액으로 한 줄 보인다(예: 「생활비 1,000,000 = 예산 1,800,000 − 항목 800,000」). 월 예산이 0 이면 이 줄을 그리지 않는다.

예산이 0이면 EmptyState 카드와 /settings로 가는 "예산 설정하기"를 표시한다. 라인 차트와 카테고리 bar는 렌더링하지 않는다.

---

## 14-4. Toast / AlertDialog 시각 시스템 (plan020)

sonner Toaster와 Radix AlertDialog의 색 토큰은 OKLCH 시스템을 따른다(ADR-F24).

```
Toast 타입 매핑 (richColors OFF — 토큰 직접):
    success  → brand-500 (Teal h=188)
    error    → expense
    warning  → warning
    info     → brand-400

AlertDialog:
    overlay   → bg-fg/60 (light=검은 톤, dark=흰 톤 자동)
    content   → bg-bg-elev + border-border
    title     → text-fg
    description → text-fg-muted
    Action    기본=brand / 파괴적 호출처는 variant="destructive" (= expense)
```

거래 삭제와 반복 지출 종료의 확인창은 `EditTransactionDialog`가 갖고, 카테고리 삭제는 `DeleteCategoryDialog`가 갖는다. 각 `<AlertDialogAction>`에 destructive variant를 명시한다.

---

## 14-5. /categories 페이지 구조 (plan024)

Teal 디자인을 적용하고 인라인 style을 제거하며 빈 상태 표시를 통일한다.

```
[/categories (server)]
    ├─ getSelectedFamilyAction() → familyUuid
    └─ getFamilyCategoriesAction(familyUuid) → CategoryResponse[]
        │
        └─ CategoryPageClient (use client)
                │
                ├─ CategoriesHero (gradient-category Teal)
                │   ├─ 가족명 + 총 카테고리 수
                │   └─ 카테고리 추가 CTA
                │
                ├─ SegmentedToggle (지출 / 수입)
                │   └─ 선택한 종류로 목록 필터링, 추가 대화상자에 같은 종류 전달
                │
                ├─ CategoryList (grid 2/3/4)
                │   └─ CategoryItem
                │       ├─ 아이콘 영역 정사각형 (w-10 h-10 / w-12 h-12)
                │       ├─ 동적 색은 CSS variable (--cat-color)
                │       ├─ 카드 탭 → 수정 창 (Edit 버튼과 같은 동작)
                │       └─ Edit / Delete (destructive variant, plan020)
                │
                ├─ 추가, 수정 창: md 미만 Sheet bottom / md+ Dialog (ADR-F40)
                │   └─ 이모지 격자 8열, 색은 견본 원과 접근 이름으로만 보이고 색 문자열은 숨김
                │
                └─ Empty → EmptyState 공용 (plan012)
```

핵심 변경:
- CategoriesHero 신설 — settings/budget Hero 패턴 일관
- 인라인 `style={{ backgroundColor, color }}` 대신 `style={{ '--cat-color': color } as CSSProperties}`와 Tailwind arbitrary class를 사용한다.
- 색 코드 oklch 문자열 노출 제거 (dot 미리보기만)
- 사용 통계 (이번 달 지출 금액) — 별도 plan 후보

---

## 15. /settings 페이지 구조 (plan021)

```
[/settings (server)]
    ├─ getUserProfileAction() → { defaultFamilyUuid, name, email }
    ├─ getFamiliesAction() → Family[]
    └─ getApiTokensAction() → ApiToken[] (실패하면 null 을 넘기고 카드에 「연동 토큰을 불러오지 못했어요」, 다른 카드는 그대로)
        │
        └─ SettingsPageClient (use client)
                │
                ├─ SettingsHero (gradient-primary)
                │   ├─ 사용자 이름 + email
                │   ├─ 현재 기본 가족명
                │   └─ 월 예산
                │
                ├─ [기본 가족 설정 카드] — radio 선택 + "현재 기본" 배지만
                │   └─ Save → setDefaultFamilyAction
                │
                ├─ [가족별 예산 카드]
                │   └─ 각 row "수정" 클릭 → BudgetEditDialog (responsive)
                │           ├─ mobile: Sheet bottom
                │           └─ md+:    Dialog centered
                │       Amount input + 빠른 입력 칩 (+10만/+50만/+100만)
                │       저장 → updateFamilyAction({ monthlyBudget })
                │
                ├─ [내 가족 목록 카드]: 구성원 수, 카테고리 수, 지출 수
                │
                ├─ [화면 테마 카드] — 시스템 / 라이트 / 다크 radio, 고르면 바로 바뀌고 그 기기에 저장 (ADR-F38)
                │
                └─ [외부 연동 카드] ApiTokenSettingsCard — 외부 에이전트가 가계부를 기록할 때 쓰는 토큰 (backend ADR-B18)
                        ├─ 목록: 이름, 앞부분(fab_xxxxxxxx), 발급일, 마지막 사용(없으면 「사용 기록 없음」)
                        ├─ "토큰 발급" → 이름 입력 Dialog → createApiTokenAction(name)
                        │       └─ 성공: 같은 Dialog 에 원문 + 복사 버튼 + 「이 창을 닫으면 다시 볼 수 없어요」
                        │       └─ 5개를 넘으면 백엔드 400 메시지를 toast 로
                        └─ "폐기" → AlertDialog 확인 → revokeApiTokenAction(uuid) → 목록에서 사라짐
```

핵심 변경:
- 설정 화면의 강조 버튼은 `bg-brand-500` 단색을 쓴다.
- DollarSign → Wallet (한국 원화 페이지 일관성)
- 예산 수정은 인라인 버튼 대신 반응형 `BudgetEditDialog`를 쓴다.
- 기본 가족 카드 ↔ 내 가족 목록 카드 정보 분리 (radio vs 통계)

---

## 14. 고정비 카드 (분석 화면 위쪽)

```
[/analytics 접속] (Server Component)
    │
    └─ getRecurringExpensesTotalAction()
            └─ GET /families/{uuid}/recurring-expenses/monthly-total
                    └─ { totalMonthlyAmount }
                            │
                            └─ "이달 고정비 OOO원" 카드 렌더링
                                    └─ 클릭 → /transactions?tab=recurring
```

고정지출을 등록, 수정하거나 삭제하면 내역과 분석 화면을 다시 조회한다.

---

## 16. 하단 탭과 전체 메뉴

결정 근거는 ADR-F33 이다.

```
[BottomNavigation]  모든 인증 화면 하단, 안전 영역만큼 아래 여백
    ├─ 달력  → /calendar       (홈)
    ├─ 내역  → /transactions
    ├─ ＋ FAB → AddTransactionDialog (/calendar 에서는 URL date, 그 밖에는 오늘)
    ├─ 분석  → /analytics
    └─ 전체  → /menu

[/menu] 전체 메뉴 (Server Component, 목록형)
    ├─ 가계부: 카테고리 → /categories, 예산 → /budget, 고정지출 → /transactions?tab=recurring
    ├─ 가족: 가족 전환(Sheet), 구성원 초대(InviteFamilyDialog)
    ├─ 알림 → /notifications
    └─ 설정 → /settings (프로필, 기본 가족, 예산, 외부 연동)
```

- 탭은 `Link` 로 만들고 현재 탭에 `aria-current="page"` 를 둔다. 탭 버튼은 칸 폭을 똑같이 나눠 쓰고 라벨은 12px 이다.
- 하위 화면(`/categories`, `/budget`, `/notifications`, `/settings`, `/invite/*`)은 Header 왼쪽에 뒤로 가기 버튼을 둔다. `document.referrer`의 origin이 현재 사이트와 같으면 `router.back()`으로 돌아가고, 비었거나 외부 사이트이면 `/menu`로 간다.
- 가족 생성, 선택, 초대 수락 화면(`/families/*`, `/invite/*`)에서는 하단 탭을 숨긴다. 가족이 없을 때 거래를 추가하지 못하게 하기 위해서다.
- 설정의 가족 「관리」 버튼은 없는 경로(`/families/{uuid}`)를 가리켜 404 가 났다. 버튼을 없애고 가족 정보는 설정 화면 안에서 보여 준다.
