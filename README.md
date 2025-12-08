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
- ✅ 모바일 최적화 UI

## 🏗️ 프로젝트 구조

```
src/
├── app/                          # Next.js App Router
│   ├── (authenticated)/          # 🔒 인증 필요 페이지
│   │   ├── layout.tsx            # 인증 체크 Layout
│   │   ├── dashboard/            # 대시보드
│   │   ├── transactions/         # 거래 내역
│   │   ├── categories/           # 카테고리 관리
│   │   ├── families/             # 가족 관리
│   │   ├── settings/             # 설정
│   │   └── invite/[token]/       # 초대 수락
│   ├── auth/                     # 🔓 인증 페이지
│   │   ├── signin/               # 로그인
│   │   ├── signout/              # 로그아웃
│   │   └── error/                # 에러
│   ├── actions/                  # Server Actions
│   │   ├── expense/              # 지출 관련
│   │   ├── income/               # 수입 관련
│   │   ├── category/             # 카테고리 관련
│   │   ├── family/               # 가족 관련
│   │   └── ...
│   └── api/auth/                 # NextAuth API Routes
│
├── components/                   # React 컴포넌트
│   ├── ui/                       # shadcn/ui 기본 컴포넌트
│   ├── common/                   # 공통 컴포넌트
│   ├── dashboard/                # 대시보드 컴포넌트
│   ├── expenses/                 # 지출 컴포넌트
│   ├── incomes/                  # 수입 컴포넌트
│   └── ...
│
├── lib/                          # 유틸리티
│   ├── client/                   # 클라이언트 전용
│   │   └── api/                  # 클라이언트 API 호출
│   ├── server/                   # 서버 전용
│   │   ├── api/                  # 서버 API 클라이언트 (ky)
│   │   │   ├── client.ts         # API 클라이언트
│   │   │   ├── logging.ts        # 요청/응답 로깅
│   │   │   └── types.ts          # 타입 정의
│   │   └── auth/                 # NextAuth 설정
│   ├── env/                      # 환경변수 (Zod 검증)
│   ├── errors/                   # 에러 처리
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

## 📦 API 클라이언트

### Server Actions에서 API 호출

```typescript
// ky 기반 서버 API 클라이언트
import { serverApiGet, serverApiPost } from "@/lib/server/api";

// GET 요청
const expenses = await serverApiGet<Expense[]>("/expenses");

// POST 요청
const newExpense = await serverApiPost<Expense>("/expenses", {
  amount: 50000,
  categoryUuid: "...",
  description: "점심",
});
```

### 클라이언트 컴포넌트에서 API 호출

```typescript
"use client";

import { apiGet, apiPost } from "@/lib/client/api";

// 쿠키 자동 전송
const families = await apiGet<Family[]>("/families");
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

## 🔗 관련 프로젝트

- **백엔드**: [fos-accountbook-backend](https://github.com/jon890/fos-accountbook-backend) (Spring Boot)

## 📄 라이센스

MIT License
