# Flow — fos-accountbook 사용자 흐름

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
                    │                   └─ 가족 생성 → 기본 카테고리('미분류') 자동 생성
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

ADR-F21 에 따라 모든 진입점(달력의 「이 날짜에 추가」, BottomNav FAB, Transactions 의 지출·수입·고정지출 탭, Settings 고정지출)이 동일한 `AddTransactionDialog` 를 부른다.
진입점은 `defaultType` 과 `defaultDate` 를 넘긴다. 달력 화면의 FAB 와 「이 날짜에 추가」 는 선택한 날짜를, 나머지는 오늘을 넘긴다.

```
[진입점: defaultType, defaultDate 만 다름]
    │
    └─ AddTransactionDialog (responsive: mobile Sheet bottom / md+ Dialog 720px)
            │
            ├─ Segmented 3 토글: 지출 / 수입 / 고정지출
            │       (gradient-expense / gradient-income / gradient-budget)
            │
            ├─ TransactionFormFields (type 분기)
            │   ├─ AmountInput (₩ + 56/64px num, 빠른 추가 칩 +1k/+5k/+10k, md+ +50k)
            │   ├─ CategoryGrid (5×2 mobile / 10×1 desktop, role=radiogroup, --color-cat-*-bg/-fg 톤)
            │   ├─ Description input (메모, name="description")
            │   ├─ [expense/income 일 때] Date input (type="date", default: defaultDate ?? 오늘)
            │   └─ [recurring 일 때]  Name input + DayOfMonth (1~28)
            │
            └─ 저장 → type 분기
                    ├─ expense  → createExpenseAction()         → POST /families/{uuid}/expenses
                    ├─ income   → createIncomeAction()          → POST /families/{uuid}/incomes
                    └─ recurring→ createRecurringExpenseAction()→ POST /families/{uuid}/recurring-expenses
                            └─ revalidatePath → toast 성공 메시지
```

거래 종류를 바꿔도 금액, 카테고리, 설명과 선택한 날짜를 유지한다.
고정지출을 거쳐 지출이나 수입으로 돌아와도 날짜는 그대로다.
고정지출 이름과 결제일은 종류를 바꿀 때 초기화한다.

---

## 4. 지출·수입 수정/삭제 플로우

```
[달력 날짜 목록의 항목 탭] 또는 [내역 목록의 수정 버튼]
    │
    └─ EditTransactionDialog (type 잠금, 기존 값 pre-fill, 모바일 Sheet bottom)
            ├─ 저장 → updateExpenseAction() / updateIncomeAction()
            │       └─ PUT /expenses/{uuid} | /incomes/{uuid} → revalidatePath → UI 갱신
            └─ 삭제 버튼 (다이얼로그 하단 왼쪽, text-expense)
                    └─ 확인 AlertDialog → deleteExpenseAction() / deleteIncomeAction()
                            └─ DELETE (Soft Delete) → revalidatePath → 다이얼로그 닫고 목록에서 제거
```

가족 구성원이면 누가 등록했든 수정하고 삭제할 수 있다. 등록자만 허용하는 제한은 두지 않는다.
내역 목록의 기존 삭제 버튼은 그대로 둔다.
수정 창이 열린 동안에는 서버 조회 결과가 갱신돼도 작성 중인 폼 값을 유지한다. 창을 닫고 다시 열면 최신 거래 값으로 초기화한다. 수정 요청 중에는 같은 거래의 삭제를 막는다.

---

## 5. 달력 홈 (`/calendar`)

로그인 뒤 첫 화면이다. 부부가 각자 등록한 지출을 날짜별로 비교하고, 날짜를 골라 등록, 수정, 삭제한다. 결정 근거는 ADR-F32 다.

```
[/calendar?month=YYYY-MM&date=YYYY-MM-DD] (Server Component)
    │   month 없음 → 사용자 시간대의 이번 달. date 없음 → 오늘이 그 달이면 오늘, 아니면 그 달 1일
    │
    └─ getCalendarMonthAction(year, month)  ── Promise.all 5개 호출
            ├─ /dashboard/daily-stats?year&month       → 날짜별 합계, memberExpenses, memberExpenseTotals
            ├─ /expenses?startDate&endDate&size=1000   → 그 달 지출 목록 (날짜 목록 표시용)
            ├─ /incomes?startDate&endDate&size=1000    → 그 달 수입 목록
            ├─ /families/{uuid}/members                → 구성원 이름, 사진, 가입 순서
            └─ getCachedFamilyCategories              → categoryUuid로 카테고리 이름과 아이콘 연결
    │
    └─ CalendarHome ("use client")
            ├─ MonthHeader: ‹ 2026년 9월 ›  (월 이동 = URL month 변경, 서버 다시 조회)
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
- 실패: 다섯 호출 중 하나라도 실패하면 `(authenticated)/error.tsx` 로 간다. 401 은 ADR-F26 에 따라 로그인으로 보낸다.
- 등록, 수정, 삭제 뒤에는 Server Action 의 `revalidatePath("/calendar")` 로 같은 달을 다시 받는다.
- `/dashboard` 는 없앤다. 예전 주소로 들어오면 `/analytics` 로 보낸다. 대시보드의 예산 카드, 이번 달 수입·지출, 고정비 카드는 `/analytics` 위쪽으로 옮긴다(「5-3」). 최근 내역과 빠른 메뉴는 달력과 전체 메뉴가 대신하므로 옮기지 않는다.

---

## 5-2. /transactions 페이지 구조 (plan003)

```
[page.tsx (server) — searchParams { tab, categoryId, startDate, endDate, page, q, amountMin, amountMax }]
    ├─ TransactionsTabs (segmented role=tablist, bg-bg-muted / bg-bg-elev)
    ├─ FilterChips (카테고리 / 기간 / AmountRangeFilter / SearchBar)
    │     ├─ SearchBar (300ms debounce, ?q= URL 동기화, 모바일 expand)
    │     └─ AmountRangeFilter (Popover, amountMin/Max URL param)
    └─ ExpenseListClient / IncomeListClient / RecurringExpenseList (tab 별)
            └─ DateGroupSection<T> (날짜 헤더 + 합계, formatDateHeader 사용)
                    └─ TransactionRow variant=compact (모바일) / variant=full (md: 5-col grid 44/1fr/110/28/140)
```

helper: `services/transaction/transaction-service.ts` 의 `groupTransactionsWithTotal` (groupByDate wrap + 합계). `applyClientFilters` 는 amountMin/Max/q post-filter (현재 미사용 — 후속 plan 에서 wiring).

page.tsx 는 `tab` 에 해당하는 목록 하나만 서버에서 조회한다. 탭을 바꾸면 URL 이 바뀌고 서버가 그 탭만 다시 그린다.
세 탭을 모두 slot props 로 넘기면 RSC 가 보이지 않는 탭까지 렌더링해 조회가 매번 세 배로 나간다.
시간대는 세션의 `session.user.profile.timezone` 을 쓰고 프로필 API 를 따로 부르지 않는다.
검색어와 금액 필터는 백엔드 지출·수입 목록 API 가 받지 않아 아직 적용되지 않는다(`prd.md` 「후속 검토」).

---

## 5-3. /analytics 페이지 구조 (plan006)

```
[page.tsx (server) — searchParams { period: m1|m3|m6|y1 }]
    │
    └─ Promise.all 6 Action:
        ├─ getDashboardStatsAction()                          # /dashboard/stats/monthly
        ├─ getMonthlyDailyStatsAction(year, month)            # /dashboard/daily-stats
        ├─ getExpensesAction({ familyUuid, startDate, endDate, limit: 1000 })  # 지출 상위 5건 표시용
        ├─ getCategoryBreakdownWithDeltaAction(year, month)   # /dashboard/stats/category-breakdown?compareWithPrev=true + 두 달 monthly-trend
        ├─ getMonthlyTrendAction(period, year, month)         # /dashboard/stats/monthly-trend?from&to 한 번
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
            └─ CategoryDetailList (progress + 전월 delta % 2-col grid)
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
                    ├─ 해당 월 지출 합계 계산 (excludeFromBudget 제외)
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
            └─ 일반 카테고리 → Soft Delete
                    └─ 해당 카테고리의 모든 Expense → '미분류' 카테고리로 이동
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
    └─ "+ 고정지출 추가" 버튼
            └─ AddTransactionDialog (defaultType=recurring) 열림
                    ├─ 이름 (필수)
                    ├─ 카테고리 선택 (드롭다운)
                    ├─ 금액 입력 (숫자)
                    └─ 매월 N일 (1~28, 숫자 입력 또는 선택)
                            │
                            └─ 저장 → createRecurringExpenseAction()
                                    ├─ requireAuth()
                                    ├─ Zod 검증 (dayOfMonth 1~28 range check)
                                    └─ POST /families/{uuid}/recurring-expenses
                                            └─ "내일부터 매월 N일에 자동 등록됩니다" toast
                                            └─ revalidatePath("/transactions")
```

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
                                    ├─ ✓ 아이콘 — generatedThisMonth=true (생성 완료)
                                    ├─ ○ 아이콘 — generatedThisMonth=false (예정)
                                    └─ 항목 클릭 → 아코디언 펼침 (수정/삭제 버튼)
```

---

## 12. 반복 지출 수정/삭제

```
[RecurringExpenseItem 아코디언]
    │
    ├─ 수정 버튼 클릭
    │   └─ EditTransactionDialog (type=recurring, 잠금) 열림 (기존 값 pre-fill)
    │           └─ 수정 후 저장 → updateRecurringExpenseAction()
    │                   └─ PUT /families/{uuid}/recurring-expenses/{uuid}
    │                           └─ "다음 스케줄부터 반영됩니다" toast
    │                           └─ revalidatePath("/transactions")
    │
    └─ 삭제 버튼 클릭
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

`src/components/layout/Header.tsx` 가 `(authenticated)/layout.tsx` 의 sticky top bar — 전 인증 페이지에 일관 표시.

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
- `text-brand-fg` 로고 아이콘 + AvatarFallback (`text-white` 폐기, ADR-F23)

---

## 14-2. 빈 상태 / 에러 / 로딩 (plan012)

App Router 의 segment 경계에서 일관 표시:

- **Empty** (`src/components/empty/EmptyState.tsx`): 거래 0건 등 — 96px brand-50 round + inbox 아이콘 + 제목/부제 + (선택) CTA + (선택) 팁 박스
- **Error** (`src/app/error.tsx` + `src/app/global-error.tsx` + `src/app/(authenticated)/error.tsx`): 88px expense/10 round + AlertCircle + "문제가 발생했어요" + DEV ONLY 디버그 박스 (production 숨김) + 다시 시도 / 홈으로
- **Loading** (`src/app/(authenticated)/{calendar,transactions,analytics,*}/loading.tsx`): 페이지 구조에 맞춘 `Skel`을 표시한다. `globals.css`의 `ab-shimmer` 애니메이션과 `.ab-skel` 클래스를 재사용한다.

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
- `src/app/(authenticated)/not-found.tsx` (Header 보존 + StatusCard 404)
- `src/app/(authenticated)/forbidden.tsx` (Next.js 16 `forbidden()` 호출 시) — status=403
- 500 은 기존 `error.tsx` (plan012) 가 자동 처리 + 동일 StatusCard 사용

---

## 14-3. /budget 페이지 (plan013)

Dashboard BudgetHeroCard 의 확장 전용 페이지. 분석은 /analytics, 예산 소화는 /budget 으로 역할 분리.

```
[/budget (server) — Promise.all 3 Action]
    ├─ getDashboardStatsAction() → { budget, monthlyExpense, remainingBudget, year, month }
    ├─ getMonthlyDailyStatsAction(year, month) → { items: { date, expense, income }[] }
    └─ getMonthlyCategoryBreakdownAction() → { items: { categoryUuid, name, color?, totalAmount }[] }
            │
            └─ BudgetClient (use client)
                    ├─ 예산 현황 Hero 카드 (Dashboard 와 시각 일치)
                    ├─ 3-col 통계: 일 평균 지출 / 남은 일수 / 권장 일 예산 (남은예산÷남은일수)
                    ├─ BudgetCumulativeLine (recharts LineChart + ReferenceLine 예산선)
                    └─ BudgetCategoryBars (수평 bar top 5 + 예산 대비 % + ↑많음 라벨)
```

예산 0 시: EmptyState 카드 + "예산 설정하기" → /settings 로. 라인 차트 + 카테고리 bar 자체 미렌더.

---

## 14-4. Toast / AlertDialog 시각 시스템 (plan020)

sonner Toaster + Radix AlertDialog 의 색 토큰을 plan001 OKLCH 시스템 (ADR-F24) 으로 통일.

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

파괴적 AlertDialog 호출처 (4): `DeleteExpenseDialog` / `IncomeItem` 삭제 / `RecurringExpenseItem` 삭제 / `DeleteCategoryDialog`. 각 `<AlertDialogAction>` 에 destructive variant 명시.

---

## 14-5. /categories 페이지 구조 (plan024)

Teal 리디자인 + 인라인 style 제거 + Empty state 일관화.

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
                ├─ CategoryList (grid 2/3/4)
                │   └─ CategoryItem
                │       ├─ 아이콘 영역 정사각형 (w-10 h-10 / w-12 h-12)
                │       ├─ 동적 색은 CSS variable (--cat-color)
                │       └─ Edit / Delete (destructive variant, plan020)
                │
                └─ Empty → EmptyState 공용 (plan012)
```

핵심 변경:
- CategoriesHero 신설 — settings/budget Hero 패턴 일관
- `style={{ backgroundColor, color }}` 인라인 → `style={{ '--cat-color': color } as CSSProperties}` + Tailwind arbitrary class
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
                ├─ SettingsHero (Teal gradient)
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
                └─ [외부 연동 카드] ApiTokenSettingsCard — 외부 에이전트가 가계부를 기록할 때 쓰는 토큰 (backend ADR-B18)
                        ├─ 목록: 이름, 앞부분(fab_xxxxxxxx), 발급일, 마지막 사용(없으면 「사용 기록 없음」)
                        ├─ "토큰 발급" → 이름 입력 Dialog → createApiTokenAction(name)
                        │       └─ 성공: 같은 Dialog 에 원문 + 복사 버튼 + 「이 창을 닫으면 다시 볼 수 없어요」
                        │       └─ 5개를 넘으면 백엔드 400 메시지를 toast 로
                        └─ "폐기" → AlertDialog 확인 → revokeApiTokenAction(uuid) → 목록에서 사라짐
```

핵심 변경:
- `gradient-primary` (plan019 폐기 토큰) → `bg-brand-500` 단색
- DollarSign → Wallet (한국 원화 페이지 일관성)
- inline budget edit (Edit2/Save/X 3 버튼) → BudgetEditDialog (plan014 responsive 패턴 재사용)
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
    ├─ 가족: 가족 전환(Sheet), 구성원 초대(InviteFamilyDialog), 가족 설정 → /settings
    ├─ 알림 → /notifications
    └─ 설정 → /settings (프로필, 기본 가족, 예산, 외부 연동)
```

- 탭은 `Link` 로 만들고 현재 탭에 `aria-current="page"` 를 둔다. 탭 버튼은 칸 폭을 똑같이 나눠 쓰고 라벨은 12px 이다.
- 하위 화면(`/categories`, `/budget`, `/notifications`, `/settings`, `/invite/*`)은 Header 왼쪽에 뒤로 가기 버튼을 둔다. 누르면 `router.back()`, 이전 기록이 없으면 `/menu` 로 간다.
- 가족 생성, 선택, 초대 수락 화면(`/families/*`, `/invite/*`)에서는 하단 탭을 숨긴다. 가족이 없을 때 거래를 추가하지 못하게 하기 위해서다.
- 설정의 가족 「관리」 버튼은 없는 경로(`/families/{uuid}`)를 가리켜 404 가 났다. 버튼을 없애고 가족 정보는 설정 화면 안에서 보여 준다.
