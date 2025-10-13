# 우리집 가계부 - 프론트엔드 📱💰

가족과 함께 관리하는 스마트 가계부 앱 (Next.js 15 + TypeScript)

## 🏗️ 아키텍처

이 프로젝트는 **프론트엔드와 백엔드가 완전히 분리**되어 있습니다:

```
프론트엔드 (Next.js 15)        백엔드 (Spring Boot)
├── NextAuth 인증 전용    ←→   ├── 모든 비즈니스 로직
├── UI/UX 담당                 ├── RESTful API
└── 백엔드 API 호출            └── MySQL 데이터베이스
```

**프론트엔드 역할:**

- ✅ NextAuth.js를 통한 Google OAuth 인증
- ✅ 사용자 인터페이스 (UI/UX)
- ✅ 백엔드 API 호출
- ✅ Prisma는 인증 테이블만 사용

**백엔드 역할:**

- ✅ 모든 비즈니스 로직 처리
- ✅ Family, Category, Expense, Invitation 관리
- ✅ JWT 기반 인증
- ✅ MySQL 데이터베이스 관리

## 🚀 기술 스택

- **Framework**: Next.js 15 + React 19 + TypeScript
- **Styling**: Tailwind CSS v3 + shadcn/ui
- **Auth**: NextAuth.js (Google OAuth)
- **Database**: MySQL (인증 테이블만)
- **ORM**: Prisma (NextAuth 전용)
- **API Client**: Custom fetch-based client
- **Package Manager**: pnpm

## 📋 빠른 시작

### 1. 프로젝트 클론 및 의존성 설치

```bash
git clone <repository-url>
cd fos-accountbook
pnpm install
```

### 2. 백엔드 설정 (필수!)

먼저 백엔드 프로젝트를 설정하고 실행해야 합니다:

```bash
cd ../fos-accountbook-backend

# MySQL 시작
docker compose up -d

# IntelliJ에서 Application.java 실행 (Active profiles: local)
```

백엔드가 실행되면:

- API: http://localhost:8080/api/v1
- Swagger UI: http://localhost:8080/api/v1/swagger-ui.html

### 3. 환경 변수 설정

`.env.local` 파일을 생성하고 다음 내용을 입력:

```bash
# 데이터베이스 (MySQL - 백엔드와 동일한 DB 사용)
DATABASE_URL="mysql://accountbook_user:accountbook_password@localhost:3306/accountbook"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-nextauth-secret-change-in-production-must-be-at-least-32-characters"

# Google OAuth
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"

# 백엔드 API
NEXT_PUBLIC_API_BASE_URL="http://localhost:8080/api/v1"  # 클라이언트 사이드용
BACKEND_API_URL="http://localhost:8080/api/v1"           # 서버 사이드용
```

> 💡 **환경변수 타입 안전성**: 이 프로젝트는 Zod를 사용하여 환경변수를 검증합니다.  
> 필수 환경변수가 없거나 잘못된 형식이면 앱이 시작되지 않습니다.
>
> 환경변수 스키마: `src/lib/env/server.env.ts`, `src/lib/env/client.env.ts`

### 4. Google OAuth 설정

1. [Google Cloud Console](https://console.cloud.google.com)에서 프로젝트 생성
2. APIs & Services > Credentials > Create Credentials > OAuth 2.0 Client IDs
3. Authorized redirect URIs 추가:
   - `http://localhost:3000/api/auth/callback/google`
   - `https://your-domain.vercel.app/api/auth/callback/google` (배포 시)

### 5. Prisma 설정

```bash
# Prisma Client 생성
pnpm db:generate

# 스키마 검증
pnpm db:validate
```

**참고:** 백엔드 Spring Boot의 JPA가 모든 테이블을 자동으로 생성합니다.

### 6. 개발 서버 실행

```bash
pnpm dev
```

브라우저에서 http://localhost:3000 접속

## 🗄️ 데이터베이스 스키마

프론트엔드는 **NextAuth 인증 테이블만** 관리합니다:

### 인증 테이블 (Prisma)

- ✅ `users` - 사용자 정보 (백엔드와 동기화)
- ✅ `accounts` - OAuth 계정 정보
- ✅ `sessions` - 세션 정보
- ✅ `verification_tokens` - 이메일 인증 토큰

### 비즈니스 테이블 (백엔드 전용)

- ❌ `families`, `family_members` - 백엔드 API로 접근
- ❌ `categories` - 백엔드 API로 접근
- ❌ `expenses` - 백엔드 API로 접근
- ❌ `invitations` - 백엔드 API로 접근

## 📱 주요 기능

- ✅ Google OAuth 로그인 (NextAuth)
- ✅ 모바일 최적화 UI
- ✅ 백엔드 API를 통한 모든 비즈니스 로직
- ✅ JWT 토큰 자동 관리
- ✅ 실시간 데이터 동기화

## 🔐 인증 시스템

### 인증 보호 방식: Route Groups Layout 패턴

**모든 인증이 필요한 페이지는 `(authenticated)` 폴더 내부에 위치**하며, 이 폴더의 `layout.tsx`에서 **자동으로 인증을 체크**합니다.

```typescript
// src/app/(authenticated)/layout.tsx
export default async function AuthenticatedLayout({ children }) {
  const session = await auth();

  // 로그인하지 않은 사용자는 자동으로 로그인 페이지로 리다이렉트
  if (!session?.user) {
    redirect("/auth/signin");
  }

  return <>{children}</>;
}
```

**장점:**

- ✅ **중복 제거**: 각 페이지에서 인증 체크 반복 불필요
- ✅ **자동 보호**: `(authenticated)` 폴더에 추가하면 자동으로 인증 필요
- ✅ **URL 영향 없음**: Route Groups는 URL에 포함되지 않음 (`/expenses`, `/families`)
- ✅ **Edge Function 크기 제한 회피**: Middleware 대신 Layout 사용

### 인증 흐름

```
1. 사용자가 Google OAuth로 로그인
2. NextAuth가 User 정보를 MySQL에 저장
3. NextAuth가 JWT 세션 토큰을 httpOnly 쿠키에 저장 (JWS, HS256 서명)
   - 쿠키명: authjs.session-token (HTTP) 또는 __Secure-authjs.session-token (HTTPS)
   - 암호화 없이 서명만 사용 (백엔드 호환)
   - AUTH_SECRET으로 서명
4. 모든 `(authenticated)` 페이지 접근 시:
   - Layout에서 자동으로 세션 체크 ✅
   - 로그인하지 않은 사용자는 /auth/signin으로 리다이렉트
5. 클라이언트에서 백엔드 API 호출 시 쿠키 자동 전송
   - fetch(..., { credentials: 'include' })
   - httpOnly 쿠키가 자동으로 포함됨
6. 백엔드의 NextAuthTokenFilter가 쿠키에서 JWT 토큰 추출 및 검증
   - HS256 알고리즘으로 서명 검증
   - 동일한 AUTH_SECRET 사용
   - Spring Security Authentication 설정
```

**핵심 개선사항:**

- ✅ **NextAuth JWT를 암호화 없이 서명만 사용 (JWS)**
  - 백엔드에서 표준 JWT 라이브러리로 검증 가능
- ✅ **쿠키 기반 자동 인증**
  - httpOnly 쿠키로 XSS 공격 방어
  - `credentials: 'include'`로 쿠키 자동 전송
  - 클라이언트 코드에서 토큰 관리 불필요
- ✅ **간단한 API 호출**
  - `apiGet('/families')` - 토큰 처리 없이 간단하게 호출
  - `apiPost('/families', data)` - 쿠키가 자동으로 전송됨
- ✅ **프론트엔드와 백엔드 동일한 `AUTH_SECRET` 공유**
  - 별도의 백엔드 JWT 발급 불필요
  - NextAuth 토큰을 그대로 검증

## 💻 API 호출 예시

### 클라이언트 컴포넌트에서 간단하게 API 호출

```typescript
"use client";

import { apiGet, apiPost } from "@/lib/client";

// GET 요청 - 쿠키 자동 전송
const families = await apiGet<Family[]>("/families");

// POST 요청 - 쿠키 자동 전송
await apiPost("/families", {
  name: "우리가족",
  description: "가족 가계부",
});

// ✅ Authorization 헤더나 토큰 관리 불필요!
// ✅ NextAuth 쿠키가 자동으로 전송됨
// ✅ 백엔드가 쿠키에서 토큰 추출 및 검증
```

### API 클라이언트 내부 구현

```typescript
// src/lib/client/api.ts
export async function apiClient<T>(
  endpoint: string,
  options: RequestInit = {}
) {
  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
    credentials: "include", // ✅ httpOnly 쿠키 자동 전송
  });

  return response.json();
}
```

### 백엔드에서 쿠키 파싱

```java
// NextAuthTokenFilter.java
private String extractTokenFromRequest(HttpServletRequest request) {
    // 쿠키에서 NextAuth 세션 토큰 추출
    Cookie[] cookies = request.getCookies();
    if (cookies != null) {
        for (Cookie cookie : cookies) {
            // Auth.js v5 (NextAuth v5)
            if ("authjs.session-token".equals(cookie.getName()) ||
                "__Secure-authjs.session-token".equals(cookie.getName())) {
                return cookie.getValue(); // ✅ JWT 토큰 반환
            }

            // 하위 호환: NextAuth v4
            if ("next-auth.session-token".equals(cookie.getName()) ||
                "__Secure-next-auth.session-token".equals(cookie.getName())) {
                return cookie.getValue();
            }
        }
    }
    return null;
}
```

## 🛠️ 개발 명령어

```bash
# 개발 서버 실행
pnpm dev

# 프로덕션 빌드
pnpm build

# 프로덕션 서버 실행
pnpm start

# 린팅
pnpm lint

# 테스트
pnpm test

# Prisma (NextAuth 전용)
pnpm db:generate      # Prisma Client 생성
pnpm db:validate      # 스키마 검증

# 참고: 테이블 생성은 백엔드(Spring Boot JPA)에서 자동 처리
```

## 🚀 배포

### Vercel 배포

> 📖 **상세 가이드**: [Vercel 배포 가이드 문서](./docs/deploy/VERCEL.md)

**⚠️ 필수 확인사항**

1. **환경변수 설정 필수**: Vercel Dashboard에서 모든 환경변수 설정
2. **`NEXT_PUBLIC_*` 환경변수는 빌드 시점에 포함됨** → 변경 후 재배포 필요!
3. **환경변수 검증**: 빌드 로그에서 "✅ Environment variables validated successfully" 확인

**빠른 배포 체크리스트:**

- [ ] Vercel에 프로젝트 연결
- [ ] **모든 환경변수 설정** (아래 참조)
- [ ] Google OAuth Redirect URI 추가
- [ ] 백엔드 CORS 설정에 Vercel 도메인 추가
- [ ] 배포 후 빌드 로그 확인

**필수 환경변수:**

```bash
# ⚠️ Vercel Dashboard → Settings → Environment Variables에서 설정!

# 데이터베이스
DATABASE_URL="mysql://..."  # 프로덕션 MySQL

# NextAuth
NEXTAUTH_URL="https://your-domain.vercel.app"
NEXTAUTH_SECRET="your-secret-at-least-32-characters"  # openssl rand -base64 32

# Google OAuth
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"

# 백엔드 API (⚠️ 중요!)
NEXT_PUBLIC_API_BASE_URL="https://your-backend.railway.app/api/v1"  # 클라이언트용
BACKEND_API_URL="https://your-backend.railway.app/api/v1"           # 서버용
```

**트러블슈팅:**

- **API가 localhost로 요청되는 경우**:
  - Vercel에서 `NEXT_PUBLIC_API_BASE_URL` 환경변수 확인
  - 환경변수 변경 후 **재배포** (Use existing Build Cache 체크 해제)
- **환경변수 검증 에러**:
  - 빌드 로그에서 어떤 환경변수가 문제인지 확인
  - 형식 확인 (URL은 `https://`로 시작, SECRET은 32자 이상)

자세한 내용은 [Vercel 배포 가이드](./docs/deploy/VERCEL.md)를 참조하세요.

**빌드 최적화 확인:**

```bash
pnpm build

# Middleware 크기 확인
ƒ Middleware    39.1 kB  ✅ (1MB 제한 준수)
```

## 🧪 테스트

### 전체 테스트 실행

```bash
pnpm test
```

### 특정 테스트만 실행

```bash
pnpm test:unit        # 단위 테스트
pnpm test:integration # 통합 테스트
pnpm test:watch       # Watch 모드
```

## 🤝 프로젝트 구조

```
fos-accountbook/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── (authenticated)/   # 인증 필요 페이지 (Layout으로 자동 인증 체크) 🔒
│   │   │   ├── layout.tsx    # 인증 체크 Layout
│   │   │   ├── page.tsx      # 대시보드
│   │   │   ├── expenses/     # 지출 관리
│   │   │   ├── families/     # 가족 관리
│   │   │   └── invite/       # 초대 수락
│   │   ├── auth/             # 인증 페이지 (로그인, 로그아웃) 🔓
│   │   ├── actions/          # Server Actions (백엔드 API 호출)
│   │   └── api/auth/         # NextAuth API Routes
│   ├── components/            # React 컴포넌트
│   │   ├── ui/               # shadcn/ui 컴포넌트
│   │   ├── common/           # 공통 컴포넌트
│   │   └── (features)/       # 기능별 컴포넌트
│   ├── lib/                  # 유틸리티 및 설정 (client/server 명확히 분리) 📦
│   │   ├── client/           # 클라이언트 안전 모듈 ✅
│   │   │   ├── api.ts        # 백엔드 API 호출 함수
│   │   │   ├── utils.ts      # Tailwind 병합 등 범용 함수
│   │   │   └── index.ts      # 통합 export
│   │   └── server/           # 서버 전용 모듈 ⚠️
│   │       ├── api/          # API 응답 헬퍼
│   │       │   ├── responses.ts
│   │       │   ├── utils.ts
│   │       │   └── index.ts
│   │       ├── auth/         # NextAuth 설정
│   │       │   ├── config.ts
│   │       │   ├── utils.ts
│   │       │   └── index.ts
│   │       ├── database/     # Prisma 클라이언트
│   │       │   ├── prisma.ts
│   │       │   ├── serialization.ts
│   │       │   ├── utils.ts
│   │       │   └── index.ts
│   │       └── config/       # 환경 설정
│   │           ├── env.ts
│   │           └── index.ts
│   └── types/
│       ├── api.ts            # 백엔드 API 타입
│       └── next-auth.d.ts    # NextAuth 타입 확장
├── prisma/
│   └── schema.prisma         # Prisma Schema (NextAuth 전용)
└── public/                   # 정적 파일
```

## 🔗 관련 프로젝트

**백엔드 레포지터리:** fos-accountbook-backend

- Spring Boot 3.5 + Java 21
- MySQL + JPA
- RESTful API + Swagger

## 🎯 주요 특징

### 1. 완전한 프론트-백 분리

- 프론트엔드: UI + 인증만
- 백엔드: 비즈니스 로직 전체

### 2. 타입 안전성

- TypeScript 엄격 모드
- 백엔드 API 타입 정의
- Prisma 타입 생성

### 3. lib 폴더 사용법 📦

**권장 import 방식:**

```typescript
// ✅ 클라이언트 안전 모듈 (브라우저에서 실행 가능)
import { apiGet, apiPost, apiPut, apiDelete, ApiError } from "@/lib/client";
import { cn } from "@/lib/client";
import { clientEnv } from "@/lib/env"; // 클라이언트 환경변수

// ⚠️ 서버 전용 모듈 (Node.js 환경에서만 실행)
import { auth, signIn, signOut, handlers } from "@/lib/server/auth";
import { prisma } from "@/lib/server/database";
import { apiResponse, successResponse, errorResponse } from "@/lib/server/api";
import { withAuth, handlePrismaError } from "@/lib/server/api";
import { serverEnv } from "@/lib/env/server.env"; // 서버 환경변수 (직접 import)
import { isDev, isProduction } from "@/lib/env"; // 환경 유틸리티
```

**💡 핵심 개선: import 경로로 즉시 구분!**

- `@/lib/client` → 클라이언트 안전 ✅ ('use client'에서 사용 가능)
- `@/lib/server` → 서버 전용 ⚠️ (절대 'use client'에서 사용 금지!)
- `@/lib/env` → **환경변수 관리** (타입 안전, Zod 검증)

**각 모듈의 역할:**

- `@/lib/client` - 백엔드 API 호출, Tailwind 유틸리티 (클라이언트 안전 ✅)
- `@/lib/server/auth` - NextAuth 설정, 인증 유틸리티 (서버 전용 ⚠️)
- `@/lib/server/database` - Prisma 클라이언트, 데이터 직렬화 (서버 전용 ⚠️)
- `@/lib/server/api` - API 응답 헬퍼, 서버 유틸리티 (서버 전용 ⚠️)
- `@/lib/env` - **타입 안전한 환경변수 관리** (Zod 검증, 빌드 시 검사)

**개발 가이드라인:**

1. **클라이언트 컴포넌트 (`'use client'`)** - `@/lib/client`만 사용!

   ```typescript
   "use client";

   // ✅ 사용 가능
   import { apiGet, apiPost, cn } from "@/lib/client";
   import { useToast } from "@/hooks/use-toast";

   // ❌ 절대 금지 - Prisma 번들링 에러!
   import { prisma } from "@/lib/server/database";
   import { auth } from "@/lib/server/auth";
   ```

2. **Server Components (기본)** - 모든 lib 모듈 사용 가능

   ```typescript
   // ✅ 모두 가능
   import { apiGet } from "@/lib/client";
   import { auth } from "@/lib/server/auth";
   import { prisma } from "@/lib/server/database";
   ```

3. **Server Actions** - 모든 lib 모듈 사용 가능

   ```typescript
   "use server";

   // ✅ 모두 가능
   import { apiPost } from "@/lib/client";
   import { auth } from "@/lib/server/auth";
   import { prisma } from "@/lib/server/database";
   import { revalidatePath } from "next/cache";
   ```

4. **API Routes** - 서버 모듈 + 응답 헬퍼

   ```typescript
   import { NextRequest } from "next/server";

   // ✅ 서버 전용 헬퍼 사용
   import { apiResponse, errorResponse } from "@/lib/server/api";
   import { withAuth } from "@/lib/server/api";
   import { prisma } from "@/lib/server/database";
   ```

**🎯 간단한 규칙:**

- `'use client'` 있음 → `@/lib/client`만!
- `'use client'` 없음 → 모든 lib 사용 가능!

### 4. 개발자 경험

- Hot Reload
- TypeScript 지원
- Tailwind CSS IntelliSense
- Prisma Studio

### 4. 성능

- Next.js 15 최적화
- Server Components 활용
- 이미지 최적화

## 📄 라이센스

MIT License

---

**개발:**

- Frontend: Next.js 15 + Auth.js v5 + Prisma
- Backend: Spring Boot 3.5 + JPA + MySQL
- Full-Stack: TypeScript + Java 21
