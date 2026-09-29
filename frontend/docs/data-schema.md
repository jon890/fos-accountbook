# Data Schema — fos-accountbook (프론트엔드 타입)

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
{ success: false, message: string, error?: ErrorDetails, timestamp: string }
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
  defaultFamilyUuid: string;
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
  members?: FamilyMember[];
}

interface FamilyMember {
  uuid: string;
  userUuid: string;
  role: "OWNER" | "MEMBER";
  userName?: string;
  userEmail?: string;
  userImage?: string;
}
```

### Category

```typescript
interface Category {
  uuid: string;
  familyUuid: string;
  name: string;
  color?: string; // hex color (#6366f1)
  icon?: string; // 이모지 또는 아이콘 이름
  excludeFromBudget?: boolean;
  isDefault?: boolean; // true = 삭제 불가 ('미분류')
  createdAt: string;
  updatedAt: string;
}

// Zod 스키마 (Server Action 입력 검증)
const createCategorySchema = z.object({
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
  categoryUuid: string;
  category: CategoryInfo | null;
  amount: number; // 백엔드 BigDecimal → 문자열 → Number 변환
  description: string | null;
  date: string; // ISO 8601
  createdAt: string;
  updatedAt: string;
}

interface CreateExpenseRequest {
  categoryUuid: string;
  amount: number;
  description?: string;
  date: string; // ISO 8601 (YYYY-MM-DDTHH:mm:ss)
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

interface RecentExpense {
  uuid: string;
  amount: string;
  description: string | null;
  date: string;
  category: CategoryInfo;
}
```

### Invitation

```typescript
interface InvitationResponse {
  uuid: string;
  familyUuid: string;
  token: string;
  status: "PENDING" | "ACCEPTED" | "EXPIRED" | "CANCELLED";
  expiresAt: string;
  createdAt: string;
  isExpired: boolean;
  isUsed: boolean;
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

### 공통 타입

```typescript
interface CategoryInfo {
  uuid: string;
  name: string;
  color: string;
  icon: string;
}

interface ApiErrorResponse {
  success: false;
  message: string;
  error?: ErrorDetails;
  timestamp: string;
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
                   GET  /families/{uuid}/dashboard/expenses/by-category
Invitation:        POST /invitations/families/{uuid}
                   GET  /invitations/token/{token}
                   POST /invitations/accept
Notification:      GET/PATCH /families/{uuid}/notifications[/{uuid}]
Profile:           GET/PUT /users/me/profile
RecurringExpense:  POST /families/{uuid}/recurring-expenses
                   GET  /families/{uuid}/recurring-expenses          (month=YYYY-MM)
                   GET  /families/{uuid}/recurring-expenses/monthly-total
                   PUT  /families/{uuid}/recurring-expenses/{uuid}
                   DELETE /families/{uuid}/recurring-expenses/{uuid}
```

> Breaking Change 시 `/api/v2/` 신설. 자세한 버전 정책은 [`backend/docs/adr.md`](../../backend/docs/adr.md) 의 ADR-B11 참고.
