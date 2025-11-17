# 우리집 가계부 - 프론트엔드 📱💰

가족과 함께 관리하는 스마트 가계부 앱 (Next.js 15 + TypeScript)

## 🏗️ 아키텍처

이 프로젝트는 **프론트엔드와 백엔드가 분리**되어 있습니다:

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
- ✅ JWT 세션 관리

## 🚀 기술 스택

- **Framework**: Next.js 15 + React 19 + TypeScript
- **Styling**: Tailwind CSS v3 + shadcn/ui
- **Auth**: NextAuth.js (Google OAuth, JWT 세션)
- **API Client**: Custom fetch-based client
- **Package Manager**: pnpm

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
│   │   │   ├── api/          # 백엔드 API 호출
│   │   │   │   ├── types.ts      # API 타입 (ApiError, ApiResponse 등)
│   │   │   │   ├── client.ts     # API 함수 (apiGet, apiPost 등)
│   │   │   │   └── index.ts      # 통합 export
│   │   │   ├── utils.ts      # Tailwind 병합 등 범용 함수
│   │   │   └── index.ts      # 통합 export
│   │   ├── server/           # 서버 전용 모듈 ⚠️
│   │   │   ├── api/          # 서버 API 클라이언트
│   │   │   │   ├── types.ts        # 서버 API 타입
│   │   │   │   ├── client.ts       # 서버 API 함수
│   │   │   │   ├── backend-auth.ts # 백엔드 인증 API
│   │   │   │   └── index.ts        # 통합 export
│   │   │   ├── auth/         # NextAuth 설정
│   │   │   │   ├── config.ts
│   │   │   │   └── index.ts
│   │   │   └── config/       # 환경 설정
│   │   │       ├── env.ts
│   │   │       └── index.ts
│   │   └── env/              # 환경변수 관리
│   │       ├── client.env.ts   # 클라이언트 환경변수
│   │       ├── server.env.ts   # 서버 환경변수
│   │       └── index.ts
│   └── types/
│       ├── api.ts            # 백엔드 API 타입
│       └── next-auth.d.ts    # NextAuth 타입 확장
└── public/                   # 정적 파일
```

## 🔗 관련 프로젝트

**백엔드 레포지터리:** [fos-accountbook-backend](https://github.com/jon890/fos-accountbook-backend)

## 📄 라이센스

MIT License

---

**개발:**

- Frontend: Next.js 15 + Auth.js v5 (JWT 세션)
