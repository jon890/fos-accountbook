# 우리집 가계부 - 프론트엔드 📱💰

가족과 함께 관리하는 스마트 가계부 앱 (Next.js 16 + React 19)

## 🚀 기술 스택

| 카테고리            | 기술                                 |
| ------------------- | ------------------------------------ |
| **Framework**       | Next.js 16 + React 19 + TypeScript   |
| **Styling**         | Tailwind CSS v4 + shadcn/ui          |
| **Auth**            | NextAuth.js v5 (Google, Naver OAuth) |
| **HTTP Client**     | ky (hooks 기반 로깅)                 |
| **Form**            | React Hook Form + Zod                |
| **Package Manager** | pnpm                                 |

## 📱 주요 기능

- ✅ Google/Naver OAuth 로그인
- ✅ 가족 기반 가계부 관리
- ✅ 지출/수입 기록 및 분석
- ✅ 카테고리별 통계
- ✅ 가족 초대 시스템
- ✅ 알림 시스템 (예산 초과 알림)
- ✅ 월별 지출/수입 분석 페이지
- ✅ 모바일 최적화 UI

## 🏗️ 프로젝트 구조

```
src/
├── app/                          # Next.js App Router
│   ├── (authenticated)/          # 🔒 인증 필요 페이지
│   │   ├── layout.tsx            # 인증 체크 Layout
│   │   ├── dashboard/            # 대시보드
│   │   ├── transactions/         # 거래 내역
│   │   ├── analytics/            # 지출/수입 분석
│   │   ├── categories/           # 카테고리 관리
│   │   ├── families/             # 가족 관리
│   │   ├── settings/             # 설정
│   │   └── invite/[token]/       # 초대 수락
│   ├── auth/                     # 🔓 인증 페이지
│   │   ├── signin/               # 로그인
│   │   ├── signout/              # 로그아웃
│   │   └── error/                # 에러
│   └── api/auth/                 # NextAuth API Routes
│
├── actions/                      # Server Actions (Controller) — 인증·검증·revalidatePath
│   ├── expense/
│   ├── income/
│   ├── category/
│   ├── family/
│   ├── dashboard/
│   ├── invitation/
│   ├── notification/
│   └── user/
│
├── services/                     # 비즈니스 로직 — API 호출·쿼리 빌딩·데이터 변환
│   ├── expense/
│   ├── income/
│   ├── category/
│   ├── family/
│   ├── dashboard/
│   ├── invitation/
│   ├── notification/
│   └── user/
│
├── components/                   # React 컴포넌트
│   ├── ui/                       # shadcn/ui 기본 컴포넌트
│   ├── common/                   # 공통 컴포넌트
│   ├── dashboard/                # 대시보드 컴포넌트
│   ├── expenses/                 # 지출 컴포넌트
│   ├── incomes/                  # 수입 컴포넌트
│   ├── notifications/            # 알림 컴포넌트
│   └── ...
│
├── lib/                          # 유틸리티
│   ├── client/                   # 클라이언트 전용
│   │   └── api/                  # 클라이언트 API 호출
│   ├── server/                   # 서버 전용
│   │   ├── api/                  # 서버 API 클라이언트 (ky)
│   │   │   ├── client.ts         # API 클라이언트 + 타입 안전 wrapper
│   │   │   ├── logging.ts        # 요청/응답 로깅
│   │   │   └── types.ts          # ApiResponse<T> 판별 유니온 타입
│   │   └── auth/                 # NextAuth 설정
│   ├── env/                      # 환경변수 (Zod 검증)
│   ├── errors/                   # 에러 처리 (ActionError, ActionResult)
│   └── utils/                    # 유틸리티 함수
│
├── types/                        # TypeScript 타입
│   ├── expense.ts
│   ├── income.ts
│   ├── category.ts
│   ├── family.ts
│   └── ...
│
├── proxy.ts                      # Next.js 16 Proxy (구 Middleware)
└── __tests__/                    # 테스트
```

## 🔐 인증 시스템

### Route Groups 패턴

`(authenticated)` 폴더의 Layout에서 **자동으로 인증 체크**:

```typescript
// src/app/(authenticated)/layout.tsx
export default async function AuthenticatedLayout({ children }) {
  const session = await auth();

  if (!session?.user) {
    redirect("/auth/signin");
  }

  return <>{children}</>;
}
```

**장점:**

- ✅ 각 페이지에서 인증 체크 중복 제거
- ✅ 폴더에 추가하면 자동으로 보호
- ✅ URL에 영향 없음 (`/dashboard`, `/transactions`)

### 인증 흐름

```
1. Google/Naver OAuth 로그인
2. NextAuth JWT 세션 생성
3. 백엔드 JWT 토큰 발급 → HTTP-only 쿠키 저장
4. API 호출 시 쿠키에서 토큰 자동 추출
```

## 🏗️ 아키텍처 — 데이터 흐름

계층형 아키텍처(Layered Architecture)를 따릅니다.

```
Page (app/)
  → Action (actions/) — 인증, Zod 검증, revalidatePath
    → Service (services/) — API 호출, 쿼리 빌딩, 데이터 변환
      → lib/server/api — HTTP 클라이언트 (ky)
```

| 레이어 | 책임 | 금지 |
|--------|------|------|
| `actions/` | `"use server"`, 인증, Zod 검증, revalidatePath | API 직접 호출, 비즈니스 로직 |
| `services/` | API 호출, 쿼리 빌딩, 변환, 오케스트레이션 | `"use server"`, revalidatePath, requireAuth |

## 🔒 Server Actions 보안 패턴

모든 Server Action은 다음 순서로 보안 검증을 수행합니다:

```typescript
// actions/expense/delete-expense-action.ts
export async function deleteExpenseAction(
  familyUuid: string,
  expenseUuid: string
): Promise<ActionResult<void>> {
  try {
    // 1. 인증 확인
    await requireAuth();

    // 2. familyUuid 소유권 검증 (IDOR 방지)
    const sessionFamilyUuid = await getSelectedFamilyUuid();
    if (!sessionFamilyUuid || familyUuid !== sessionFamilyUuid) {
      throw ActionError.unauthorized("권한이 없습니다.");
    }

    // 3. 비즈니스 로직은 service에 위임
    await expenseService.deleteExpense(familyUuid, expenseUuid);

    revalidatePath("/transactions");
    return successResult(undefined);
  } catch (error) {
    return handleActionError(error, "지출 삭제에 실패했습니다");
  }
}
```

## 📦 API 클라이언트

### ApiResponse<T> 타입 시스템

백엔드 응답은 판별 유니온(discriminated union) 타입으로 타입 안전하게 처리합니다:

```typescript
// src/lib/server/api/types.ts
type ApiResponse<T> =
  | { success: true; data: T }
  | { success: false; message?: string; code?: string };
```

### Server Actions에서 API 호출

```typescript
// ky 기반 서버 API 클라이언트 (타입 안전 wrapper)
import { serverApiGet, serverApiPost, serverApiPut, serverApiDelete } from "@/lib/server/api/client";

// GET 요청 — 성공 시 T 반환, 실패 시 ServerApiError throw
const expenses = await serverApiGet<Expense[]>("/families/{uuid}/expenses");

// POST 요청
const newExpense = await serverApiPost<Expense>("/families/{uuid}/expenses", {
  amount: 50000,
  categoryUuid: "...",
  description: "점심",
});

// 에러는 try/catch로 처리 후 ActionResult로 변환
try {
  const data = await serverApiGet<T>(url);
  return { success: true, data };
} catch (error) {
  return handleActionError(error, "실패 메시지");
}
```

### 클라이언트 컴포넌트에서 API 호출

```typescript
"use client";

import { apiGet, apiPost } from "@/lib/client/api";

// 쿠키 자동 전송
const families = await apiGet<Family[]>("/families");
```

## 🎨 스타일링 컨벤션

Tailwind CSS v4를 사용하며, 하드코딩 색상 대신 **시맨틱 CSS 클래스**를 사용합니다:

| 시맨틱 클래스       | 용도               |
| ------------------- | ------------------ |
| `gradient-expense`  | 지출 (로즈-레드)   |
| `gradient-income`   | 수입 (에메랄드)    |
| `gradient-budget`   | 예산 (앰버)        |
| `gradient-family`   | 가족 (바이올렛)    |
| `gradient-category` | 카테고리 (인디고)  |
| `gradient-primary`  | 기본 액션 (블루)   |
| `text-destructive`  | 삭제/오류 텍스트   |
| `bg-card`           | 카드 배경          |
| `border-border`     | 테두리             |

```typescript
// ❌ 하드코딩 색상 금지
<div className="from-blue-500 to-purple-600 text-red-500 bg-white" />

// ✅ 시맨틱 클래스 사용
<div className="gradient-primary text-destructive bg-card" />
```

## 🛠️ 개발 환경 설정

### 환경변수

`.env.local` 파일 생성:

```bash
# NextAuth
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-key

# OAuth Providers
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
NAVER_CLIENT_ID=your-naver-client-id
NAVER_CLIENT_SECRET=your-naver-client-secret

# Backend API
BACKEND_API_URL=http://localhost:8080/api
```

### 실행

```bash
# 의존성 설치
pnpm install

# 개발 서버 (Turbopack 기본)
pnpm dev

# 프로덕션 빌드
pnpm build

# 테스트
pnpm test

# 린트
pnpm lint
```

## 🧪 테스트

```bash
# 전체 테스트
pnpm test

# 커버리지
pnpm test:coverage

# Watch 모드
pnpm test:watch
```

테스트 파일은 `src/__tests__/` 하위에 위치하며, Server Actions 단위 테스트를 포함합니다.

```typescript
// Server Action 테스트 패턴
/** @jest-environment node */
jest.mock("@/lib/server/auth/auth-helpers");
jest.mock("@/lib/server/api/client");

const mockRequireAuth = requireAuth as jest.MockedFunction<typeof requireAuth>;
const mockGetSelectedFamilyUuid = getSelectedFamilyUuid as jest.MockedFunction<typeof getSelectedFamilyUuid>;

beforeEach(() => {
  mockRequireAuth.mockResolvedValue(mockSession);
  mockGetSelectedFamilyUuid.mockResolvedValue("family-1");
});
```

## 🤖 CI/CD — 자동 코드 리뷰

PR이 생성되면 Claude가 자동으로 코드 리뷰를 수행합니다 (`.github/workflows/claude-code-review.yml`):

- **리뷰 하나로 게시**: 요약은 리뷰 본문에, 발견사항은 변경 라인의 인라인 댓글로 묶는다
- **등급**: 🔴 P1 치명부터 ⚪ P5 참고까지 다섯 단계
- **위험 라벨**: `scripts/pr-risk-labels.sh` 가 바뀐 경로로 `위험:인증`, `위험:권한`, `위험:배포설정` 라벨을 단다
- 다시 돌리려면 PR 에 `/review` 댓글을 단다 (저장소 주인과 협업자만)

설계와 근거는 [ADR-F11](docs/adr/ADR-F11-ci-code-review.md) 에 있다.

## 🔗 관련 프로젝트

- **백엔드**: 같은 저장소의 [`backend/`](../backend/) (Spring Boot)

## 📄 라이센스

MIT License
