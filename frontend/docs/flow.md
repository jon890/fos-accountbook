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
    └─ 로그인됨 → /dashboard redirect → defaultFamilyUuid 확인
                    │
                    ├─ 없음 → /families/create
                    │           └─ 가족 이름 + 월 예산 입력
                    │                   └─ 가족 생성 → 기본 카테고리('미분류') 자동 생성
                    │                           └─ /dashboard
                    │
                    └─ 있음 → /dashboard
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
    │                   ├─ 96px gradient-family round + Users 아이콘 (Auth 톤 일치)
    │                   ├─ 가족 이름 + 만료 일시 (24h 이내 시 expense/10 warning 배지)
    │                   ├─ (plan016 — backend #127 머지 후) 초대자 이름·아바타 + 멤버 수
    │                   │
    │                   └─ [수락 / 거절 CTA]
    │                           └─ 수락 → acceptInvitationAction(token) — requireAuth + token Zod uuid 검증 (ADR-F06)
    │                                   └─ FamilyMember 생성 (MEMBER 역할)
    │                                   └─ defaultFamilyUuid 설정
    │                                   └─ /dashboard 리다이렉트
```

---

## 3. 거래 등록 플로우 (plan014 통합)

ADR-F21 에 따라 6 진입점 (Dashboard QuickActions / BottomNav FAB / Transactions 의 지출·수입·고정지출 탭 / Settings 고정지출) 이 동일한 `AddTransactionDialog` 호출.

```
[6 진입점 — defaultType 만 다름]
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
            │   ├─ [expense/income 일 때] Date input (type="date", default: 오늘)
            │   └─ [recurring 일 때]  Name input + DayOfMonth (1~28)
            │
            └─ 저장 → type 분기
                    ├─ expense  → createExpenseAction()         → POST /families/{uuid}/expenses
                    ├─ income   → createIncomeAction()          → POST /families/{uuid}/incomes
                    └─ recurring→ createRecurringExpenseAction()→ POST /families/{uuid}/recurring-expenses
                            └─ revalidatePath → toast 성공 메시지
```

type 전환 시: amount / category / description 은 유지, type-specific 필드 (date vs name+dayOfMonth) 만 초기화.

---

## 4. 지출 수정/삭제 플로우

```
[ExpenseItem]
    │
    ├─ 수정 아이콘 클릭
    │   └─ EditTransactionDialog (type=expense, 잠금) 열림 (기존 값 pre-fill)
    │           └─ 수정 후 저장 → updateExpenseAction()
    │                   └─ 검증 → updateExpense() → PUT /expenses/{uuid}
    │                           └─ revalidatePath → UI 갱신
    │
    └─ 삭제 아이콘 클릭
            └─ 확인 AlertDialog
                    └─ 확인 → deleteExpenseAction()
                            └─ DELETE /expenses/{uuid} (Soft Delete)
                                    └─ revalidatePath → 목록에서 제거
```

---

## 5. 대시보드 데이터 흐름

```
[/dashboard 접속] (Server Component, page.tsx 가 모든 섹션 직접 배치)
    │
    ├─ getDashboardStatsAction() → /dashboard/stats/monthly
    │       └─ { monthlyExpense, monthlyIncome, remainingBudget, budget, year, month }
    │
    ├─ getRecentExpensesAction(10) → /expenses?limit=10
    │       └─ [ { amount, memo, date, category, createdBy? } × 10 ]
    │
    ├─ getFamiliesAction() → /families
    │       └─ [ { uuid, name, members? } ]
    │
    └─ getMonthlyCategoryBreakdownAction() — ADR-F16 server-side 집계
            └─ /expenses?startDate=...&endDate=... 응답을 service 측에서 카테고리별 합산
                    └─ { year, month, totalExpense, items: CategoryBreakdownItem[] }

[page.tsx 7요소 직접 배치 (DashboardClient wrapper 없음)]
    ├─ DashboardHeader: 가족명 + "{year}년 {month}월" + Bell + CoupleAvatars
    ├─ BudgetHeroCard: Teal gradient + 잔여 예산 + progress + daysRemaining
    ├─ IncomeExpenseStats: 월 수입 / 월 지출 (text-income/expense 토큰)
    ├─ CategoryDistribution ("use client"): recharts Donut + top 5/6 리스트
    ├─ RecentActivity ("use client"): TransactionRow variant=compact (category-tone 36px + memo + .num amount + createdBy 16px)
    ├─ QuickActions ("use client"): 지출/수입/가족초대/카테고리 4-grid
    └─ CalendarView: 일별 수입·지출 바 차트
```

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

---

## 5-3. /analytics 페이지 구조 (plan006)

```
[page.tsx (server) — searchParams { period: m1|m3|m6|y1 }]
    │
    └─ Promise.all 5 Action:
        ├─ getDashboardStatsAction()
        ├─ getMonthlyDailyStatsAction(year, month)
        ├─ getExpensesAction({ familyUuid, startDate, endDate, limit: 1000 })
        ├─ getCategoryBreakdownWithDeltaAction(year, month)   # 이번 달 vs 직전 달 비교
        └─ getMonthlyTrendAction(period, year, month)         # period 기반 월별 추이
    │
    └─ AnalyticsClient (use client)
            ├─ AnalyticsPeriodToggle (segmented role=tablist, URL ?period= 단방향)
            ├─ AnalyticsCategoryDonut (172/160px Donut + 중앙 totalDelta ↑/↓)
            ├─ MonthlyTrendBar (순수 CSS bar, 마지막 막대 bg-brand-500 강조)
            └─ CategoryDetailList (progress + 전월 delta % 2-col grid)
```

데이터 흐름 핵심:
- `services/analytics/analytics-service.ts` 가 `services/dashboard/getMonthlyCategoryBreakdown` 직접 재사용 (service→service, ADR-F04 위반 아님)
- `getCategoryBreakdownWithDelta`: 이번 달 + 직전 달 두 번 fetch → uuid 매칭 후 `((cur-prev)/prev)*100` delta 계산. prev=0 시 null
- `getMonthlyTrend`: m1/m3/m6/y1 → 1~12개월 시점 누적 fetch → 합계 + 평균
- backend `monthly-trend` endpoint 분리는 후속 (issue #126) — 클라 집계 임계 (월 500건 / TTI 700ms) 도달 시 plan007+ 전환

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
    │      → /dashboard 링크
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
- **Loading** (`src/app/(authenticated)/{dashboard,transactions,analytics,*}/loading.tsx`): `Skel` shimmer (ab-shimmer keyframe + .ab-skel class in globals.css) — 페이지별 구조 매치

`error.tsx` 는 모두 `"use client"` 첫 줄 필수 (App Router 규약). `loading.tsx` 는 Server Component OK.

---

## 14-2-2. 404 / 403 / 500 상태 카드 (plan018)

`StatusCard` 공용 helper 가 3 상태를 톤으로 구분:

| status | 톤 | 아이콘 | 메시지 | CTA |
|---|---|---|---|---|
| 404 | brand (bg-brand-50 + text-brand-500) | Compass | "찾을 수 없어요" | public: "홈으로" → `/` / authenticated: "대시보드로" → `/dashboard` |
| 403 | warning (bg-warning/10 + text-warning) | Lock | "권한이 없어요" | "홈으로" → `/dashboard` (+ 보조: "로그인 다시 시도" → `/auth/signin`) |
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
    └─ getFamiliesAction() → Family[]
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
                └─ [내 가족 목록 카드] — 멤버/카테고리/지출 통계
                        └─ "관리" → /families/{uuid}
```

핵심 변경:
- `gradient-primary` (plan019 폐기 토큰) → `bg-brand-500` 단색
- DollarSign → Wallet (한국 원화 페이지 일관성)
- inline budget edit (Edit2/Save/X 3 버튼) → BudgetEditDialog (plan014 responsive 패턴 재사용)
- 기본 가족 카드 ↔ 내 가족 목록 카드 정보 분리 (radio vs 통계)

---

## 14. 대시보드 고정비 카드

```
[/dashboard 접속] (Server Component)
    │
    └─ getRecurringExpensesTotalAction()
            └─ GET /families/{uuid}/recurring-expenses/monthly-total
                    └─ { totalMonthlyAmount }
                            │
                            └─ "이달 고정비 OOO원" 카드 렌더링
                                    (기존 4개 요약 카드 아래 새 행)
                                    └─ 클릭 → /transactions?tab=recurring
```
