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
NEXTAUTH_SECRET="your-nextauth-secret-change-in-production"

# Google OAuth
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"

# 백엔드 API
NEXT_PUBLIC_API_BASE_URL="http://localhost:8080/api/v1"
BACKEND_API_URL="http://localhost:8080/api/v1"
```

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

## 🔐 인증 흐름

```
1. 사용자가 Google OAuth로 로그인
2. NextAuth가 User 정보를 MySQL에 저장
3. 백엔드 /auth/register API 호출
4. 백엔드에서 JWT 토큰 발급
5. NextAuth Session에 JWT 토큰 저장
6. 모든 API 요청에 JWT 토큰 자동 주입
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

1. Vercel에 프로젝트 연결
2. 환경 변수 설정:
   ```
   DATABASE_URL (프로덕션 MySQL)
   NEXTAUTH_URL (배포 도메인)
   NEXTAUTH_SECRET
   GOOGLE_CLIENT_ID
   GOOGLE_CLIENT_SECRET
   NEXT_PUBLIC_API_BASE_URL (백엔드 프로덕션 URL)
   BACKEND_API_URL (백엔드 프로덕션 URL)
   ```
3. Google OAuth 리디렉션 URI에 배포 도메인 추가
4. 배포!

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
│   │   ├── actions/           # Server Actions (백엔드 API 호출)
│   │   ├── api/auth/          # NextAuth API Routes
│   │   └── (pages)/           # 페이지 컴포넌트
│   ├── components/            # React 컴포넌트
│   │   ├── ui/               # shadcn/ui 컴포넌트
│   │   ├── common/           # 공통 컴포넌트
│   │   └── (features)/       # 기능별 컴포넌트
│   ├── lib/
│   │   ├── api-client.ts     # 백엔드 API 클라이언트
│   │   ├── auth.ts           # NextAuth 설정
│   │   └── prisma.ts         # Prisma Client
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

### 3. 개발자 경험
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
