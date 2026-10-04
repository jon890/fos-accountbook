# fos-accountbook 프론트엔드 타입

> **소유권**: DB 스키마·API 스펙의 canonical 소스는 `backend/`.
> → [`backend/docs/data-schema.md`](../../backend/docs/data-schema.md) 참고
>
> 이 문서는 **프론트엔드가 사용하는 TypeScript 타입**과 **API 컨트랙트 요약**만 기록한다.
> 백엔드가 스키마를 변경하면 이 파일도 함께 업데이트해야 한다.

---

## API 기본 구조

### 응답 공통

```typescript
// 성공
{ success: true, message: string, data: T, timestamp: string }

// 실패
{ success: false, message: string, errors?: ErrorDetails[], timestamp: string }
```

### 페이지네이션

```typescript
interface PaginationResponse<T> {
  items: T[];
  totalElements: number;
  totalPages: number;
  currentPage: number; // 1부터 시작 (백엔드 0-based → 서비스 레이어에서 변환)
}
```

### 인증 응답

```typescript
interface AuthResponse {
  accessToken: string; // 15분 만료
  refreshToken: string; // 7일 만료
  issuedAt: string;
  expiredAt: string;
  user: UserInfo;
}
```

---

## 도메인 타입

### User / UserProfile

```typescript
interface UserInfo {
  uuid: string;
  name?: string;
  email: string;
  image?: string;
}

type UserProfile = {
  timezone: string; // 'Asia/Seoul'
  language: string; // 'ko' | 'en' | 'ja'
  currency: string; // 'KRW' | 'USD' | 'JPY'
  defaultFamilyUuid: string | null; // 가족을 고르기 전에는 null
};

// NextAuth JWT 확장
interface JWT {
  userUuid: string;
  backendAccessToken: string;
  backendRefreshToken: string;
  backendTokenExpiredAt: string;
  profile: UserProfile | null;
}
```

### Family

```typescript
interface Family {
  uuid: string;
  name: string;
  monthlyBudget: number;
  createdAt: string;
  updatedAt: string;
  memberCount: number;
  expenseCount: number;
  categoryCount: number;
  role?: "OWNER" | "MEMBER";
}

// GET /families/{uuid}/members. 가입 순서(joinedAt 오름차순). ACTIVE 구성원만
interface FamilyMemberSummary {
  userUuid: string;
  name: string | null;
  email: string | null;
  image: string | null;
  role: "OWNER" | "MEMBER";
  joinedAt: string;
}
```

### Category

```typescript
interface Category {
  uuid: string;
  familyUuid: string;
  type: "EXPENSE" | "INCOME";
  name: string;
  color?: string; // #RRGGBB(기존 값, 기본 카테고리) 또는 oklch(L C H)(팔레트에서 고른 값)
  icon: string | null; // 이모지 또는 아이콘 이름. 컬럼이 null 을 허용한다
  excludeFromBudget?: boolean;
  isDefault?: boolean; // true = 삭제 불가 (지출 '미분류', 수입 '기타 수입')
  createdAt: string;
  updatedAt: string;
}

// Zod 스키마 (Server Action 입력 검증)
const createCategorySchema = z.object({
  type: z.enum(["EXPENSE", "INCOME"]),
  name: z.string().trim().min(1, "이름은 필수입니다"),
  color: z.string().optional(),
  icon: z.string().optional(),
  excludeFromBudget: z.boolean().optional(),
});
```

### Expense

```typescript
interface Expense {
  uuid: string;
  familyUuid: string;
  userUuid: string; // 등록한 사용자. 이름은 FamilyMemberSummary 에서 찾는다
  categoryUuid: string;
  category: (CategoryInfo & { excludeFromBudget?: boolean }) | null;
  amount: number; // 백엔드 BigDecimal 이 JSON 숫자로 온다. 변환하지 않는다
  description: string | null;
  date: string; // ISO 8601
  excludeFromBudget: boolean; // 이 지출만 예산에서 뺀다. 카테고리가 제외면 이 값과 관계없이 제외된다
  createdAt: string;
  updatedAt: string;
}

interface CreateExpenseRequest {
  categoryUuid: string;
  amount: number;
  description?: string;
  date: string; // ISO 8601 (YYYY-MM-DDTHH:mm:ss)
  excludeFromBudget?: boolean;
}

interface UpdateExpenseRequest {
  categoryUuid?: string;
  amount?: number;
  description?: string;
  date?: string;
  excludeFromBudget?: boolean; // false도 변경값이다. 누락하면 기존 값을 유지한다
}

interface GetExpensesParams {
  familyUuid: string;
  categoryId?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}
```

### Income

```typescript
interface Income {
  uuid: string;
  familyUuid: string;
  userUuid: string; // 등록한 사용자
  categoryUuid: string;
  category: CategoryInfo;
  amount: number;
  description: string | null;
  date: string;
  createdAt: string;
  updatedAt: string;
}

interface CreateIncomeRequest {
  categoryUuid: string;
  amount: number;
  description?: string;
  date: string;
}
```

### Dashboard

이 API의 월 통계는 분석 위쪽 카드와 예산 화면이 사용한다.
현재 연월은 사용자 시간대로 선택하고 시간대가 없거나 잘못되면 서울을 사용한다.
공유 일별 조회는 분석과 예산에 날짜, 수입과 지출만 전달하며 달력 홈은 날짜별 구성원 지출도 받는다.
홈은 구성원별 월 누적 금액을 보이지 않는다. 예산 카드와 예산 항목이 같은 정보를 더 쓸모 있게 보여 주기 때문이다.

```typescript
interface DashboardStats {
  monthlyExpense: number;
  monthlyIncome: number;
  remainingBudget: number;
  familyMembers: number;
  budget: number;
  year: number;
  month: number;
}

interface DailyTransactionSummary {
  date: string;
  income: number;
  expense: number;
}

interface MemberAmount {
  userUuid: string;
  amount: number;
}

// GET /dashboard/daily-stats. 달력 홈이 쓴다
interface DailyStatsWithMembers {
  year: number;
  month: number;
  dailyStats: Array<DailyTransactionSummary & { memberExpenses: MemberAmount[] }>;
  totalIncome: number;
  totalExpense: number;
}

interface RecentExpense {
  uuid: string;
  amount: string;
  description: string | null;
  date: string;
  category: CategoryInfo;
}
```

`RecentExpense` 는 보존된 서비스의 반환 타입이며 현재 화면에서는 사용하지 않는다.

`DashboardStats.monthlyExpense` 는 예산 합계다. 고정지출(예산 제외, 반복 지출이 만든 지출)을 빼고 예산 항목의 지출은 포함한다([ADR-B26](../../backend/docs/adr/ADR-B26-monthly-budget-is-total.md)).

집계 API 의 금액은 JSON 숫자로 오며 `number` 로 받는다.
카테고리가 삭제되면 `name`, `icon`, `color` 는 null 이다.

| 집계 | 요청 인자 | 응답 `data` | 서비스 변환 |
| --- | --- | --- | --- |
| 일별 합계 | `year`, `month` | `year`, `month`, `dailyStats: DailyTransactionSummary[]`, `totalIncome`, `totalExpense` | 거래가 있는 날의 날짜 오름차순 배열을 반환한다. |
| 카테고리 월 분포 | `year`, `month`, `compareWithPrev` | `year`, `month`, `totalExpense`, `items`<br>항목은 `categoryUuid`, `name`, `icon`, `color`, `totalAmount`, `percentage`, `deltaPercent`, `previousAmount` 를 포함한다. | 이름과 아이콘이 null 이면 기본값을 쓰고 색상 null 은 undefined 로 바꾼다. 비율과 전월 대비는 반올림하며 null 전월 대비는 유지한다. `previousAmount` 가 0 이고 이번 달 금액이 있으면 `isNew` 를 참으로 둔다. |
| 월별 추이 | `from`, `to` (`YYYY-MM`) | `points: { year, month, totalExpense }[]`, `average` | 없는 달은 0 으로 채운다. 평균은 빈 달도 포함한 요청 개월 수로 다시 계산한다. |

카테고리 항목은 금액 내림차순이다.
`deltaPercent` 는 비교를 요청하지 않았거나 전월 금액이 없거나 0 이면 null 이다.
`previousAmount` 는 직전 달 같은 카테고리 금액이다. 비교를 요청하지 않으면 오지 않고, 직전 달 지출이 없으면 0 이다. 분석 화면은 이 값이 0 인 항목을 전월 대비 칸에 「신규」 로 보인다.
추이 응답에는 지출이 있는 달만 날짜 오름차순으로 포함된다.

### BudgetItem

규칙과 에러 코드는 `backend/docs/data-schema.md` 의 「예산 항목 요청과 응답」, 「예산 요약과 생활비 합계」 가 소유한다.

```typescript
interface BudgetItem {
  uuid: string;
  name: string;
  monthlyLimit: number; // 0 = 한도 없음
  categoryUuids: string[];
  createdAt: string;
  updatedAt: string;
}

// 생성과 수정의 입력. Zod 스키마 budgetItemInputSchema 가 검증한다
interface BudgetItemInput {
  name: string; // trim 뒤 1~30자
  monthlyLimit: number; // 0 이상 정수
  categoryUuids: string[]; // UUID 1개 이상
}

// GET /dashboard/budget-summary. 달력 홈이 쓴다
interface BudgetSummary {
  year: number;
  month: number;
  total: { spent: number; limit: number }; // limit = 월 예산. 0 = 미설정
  living: { spent: number; limit: number }; // limit = 월 예산 - 항목 한도 합. 0 미만이면 0
  allocationExceeded: boolean; // 항목 한도 합이 월 예산보다 크다
  items: Array<{ budgetItemUuid: string; name: string; limit: number; spent: number }>;
}
```

`CalendarMonth` 는 `budgetSummary: BudgetSummary` 를 함께 담는다.

### Invitation

```typescript
interface InvitationResponse {
  uuid: string;
  familyUuid: string;
  token: string;
  status: "PENDING" | "ACCEPTED" | "EXPIRED" | "CANCELLED";
  expiresAt: string;
  createdAt: string;
  familyName: string | null;
  // 만료와 사용 여부는 응답 키가 아니라 status 와 expiresAt 으로 서비스가 계산한다
  // GET /invitations/token/{token} 에서만 온다. 로그인 전 공개 경로라 이름과 아바타만 싣는다
  inviter: { name: string | null; avatarUrl: string | null } | null;
  memberCount: number | null; // ACTIVE 멤버 수
}
```

### Notification

```typescript
interface NotificationResponse {
  notificationUuid: string;
  familyUuid: string;
  userUuid: string | null;
  type: "BUDGET_WARNING" | "BUDGET_EXCEEDED" | "RECURRING_EXPENSE_CREATED";
  title: string;
  message: string;
  referenceUuid?: string;
  referenceType?: string; // 'EXPENSE' | 'CATEGORY'
  isRead: boolean;
  createdAt: string;
}
```

### RecurringExpense

```typescript
interface RecurringExpense {
  uuid: string;
  familyUuid: string;
  categoryUuid: string;
  category: CategoryInfo;
  name: string;
  amount: number;
  dayOfMonth: number; // 1~28
  status: "ACTIVE" | "ENDED";
  generatedThisMonth: boolean; // 이번달 자동 생성 여부 (✓/○ 표시용)
  createdAt: string;
  updatedAt: string;
}

interface GetRecurringExpensesResponse {
  totalMonthlyAmount: number;
  items: RecurringExpense[];
}

interface CreateRecurringExpenseRequest {
  name: string;
  categoryUuid: string;
  amount: number;
  dayOfMonth: number; // 1~28만 허용 (29~31 불가)
}
```

### Installment

할부 한 건이다. 계산 필드는 백엔드가 업무 날짜의 이번 달로 채운다. 규칙은 `backend/docs/data-schema.md` 「할부 요청과 응답」 이 소유한다.

```typescript
type InstallmentProgress = "UPCOMING" | "IN_PROGRESS" | "COMPLETED";

interface Installment {
  uuid: string;
  userUuid: string;          // 등록한 사람
  name: string;
  totalAmount: number;
  installmentMonths: number; // 2~60
  startMonth: string;        // YYYY-MM
  endMonth: string;          // YYYY-MM
  memo: string | null;
  monthlyAmount: number;
  firstMonthAmount: number;
  currentRound: number;      // 0 ~ installmentMonths
  thisMonthAmount: number;
  remainingAmount: number;
  progress: InstallmentProgress;
  createdAt: string;
  updatedAt: string;
}

// 생성과 수정의 입력
interface InstallmentInput {
  name: string;
  totalAmount: number;
  installmentMonths: number;
  startMonth: string;
  memo?: string;
}
```

### ApiToken

외부 에이전트 연동 토큰 (backend ADR-B18). 원문은 발급 응답에만 실린다.

```typescript
interface ApiToken {
  uuid: string;
  name: string;
  tokenPrefix: string; // 표시용 앞부분 (fab_ + 8자)
  lastUsedAt: string | null;
  createdAt: string;
}

interface CreatedApiToken extends ApiToken {
  token: string; // 원문. 이 응답에서만 받는다
}
```

### 공통 타입

```typescript
interface CategoryInfo {
  uuid: string;
  name: string;
  color: string;
  icon: string | null;
}

interface ApiErrorResponse {
  success: false;
  message: string;
  errors?: ErrorDetails[]; // @Valid 검증 실패(400)일 때 필드마다 하나
  timestamp: string;
}

interface ErrorDetails {
  code: string;          // 검증 실패는 "VALIDATION_ERROR"
  field: string;
  rejectedValue: unknown;
  message: string;       // 그 필드의 검증 메시지. Action 이 사용자에게 그대로 보여 준다
}
```

---

## API 엔드포인트 요약

```
Base URL: /api/v1

Auth:              POST /auth/social-login, /auth/refresh
Family:            CRUD /families[/{uuid}]
Category:          CRUD /families/{uuid}/categories[/{uuid}]
Expense:           CRUD /families/{uuid}/expenses[/{uuid}]
Income:            CRUD /families/{uuid}/incomes[/{uuid}]
Dashboard:         GET  /families/{uuid}/dashboard/stats/monthly
                   GET  /families/{uuid}/dashboard/daily-stats
                   GET  /families/{uuid}/dashboard/stats/category-breakdown
                   GET  /families/{uuid}/dashboard/stats/monthly-trend
                   GET  /families/{uuid}/dashboard/expenses/by-category
                   GET  /families/{uuid}/dashboard/budget-summary    (year, month)
BudgetItem:        CRUD /families/{uuid}/budget-items[/{uuid}]
Installment:       CRUD /families/{uuid}/installments[/{uuid}]
Invitation:        POST /invitations/families/{uuid}
                   GET  /invitations/token/{token}
                   POST /invitations/accept
Notification:      GET/PATCH /families/{uuid}/notifications[/{uuid}]
Profile:           GET/PUT /users/me/profile
ApiToken:          POST/GET /users/me/api-tokens, DELETE /users/me/api-tokens/{uuid}
RecurringExpense:  POST /families/{uuid}/recurring-expenses
                   GET  /families/{uuid}/recurring-expenses          (month=YYYY-MM)
                   GET  /families/{uuid}/recurring-expenses/monthly-total
                   PUT  /families/{uuid}/recurring-expenses/{uuid}
                   DELETE /families/{uuid}/recurring-expenses/{uuid}
```

> Breaking Change 시 `/api/v2/` 신설. 자세한 버전 정책은 [ADR-B11](../../backend/docs/adr/ADR-B11-api-versioning-strategy.md) 참고.
