# 우리집 가계부 📱💰

가족과 함께 관리하는 스마트 가계부 앱입니다.

## 🚀 기술 스택

- **Framework**: Next.js 15 + TypeScript
- **Styling**: Tailwind CSS v3 + shadcn/ui
- **Database**: Supabase (PostgreSQL) + Prisma ORM
- **Auth**: NextAuth.js (Google OAuth)
- **Package Manager**: pnpm

## 📋 설정 가이드

### 1. 프로젝트 클론 및 의존성 설치

```bash
git clone <repository-url>
cd family-budget
pnpm install
```

### 2. Supabase 프로젝트 생성

1. [supabase.com](https://supabase.com)에서 새 프로젝트 생성
2. 데이터베이스 비밀번호 설정
3. 프로젝트 설정 > API에서 다음 정보 확인:
   - Project URL
   - anon public key
   - service_role key

### 3. Google OAuth 설정

1. [Google Cloud Console](https://console.cloud.google.com)에서 프로젝트 생성
2. APIs & Services > Credentials > Create Credentials > OAuth 2.0 Client IDs
3. Application type: Web application
4. Authorized redirect URIs 추가:
   - `http://localhost:3000/api/auth/callback/google`
   - `https://your-domain.vercel.app/api/auth/callback/google` (배포 시)

### 4. 환경 변수 설정

`.env.local` 파일을 생성하고 다음 값들을 설정하세요:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Database URLs (중요: 두 개의 다른 URL 필요)
# Connection Pool URL for application runtime (port 6543)
DATABASE_URL=postgresql://postgres:your_password@db.your-project.supabase.co:6543/postgres

# Direct Connection URL for migrations and schema operations (port 5432)
DIRECT_URL=postgresql://postgres:your_password@db.your-project.supabase.co:5432/postgres

# NextAuth
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your_random_secret_key

# Google OAuth
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
```

### 5. 데이터베이스 스키마 적용

```bash
# .env.local 파일이 있는지 확인 후 실행 (Prisma 사용)
pnpm exec dotenv -e .env.local -- npx prisma db push
```

> **참고**: Prisma는 `DIRECT_URL`을 사용하여 마이그레이션을 수행하고, 애플리케이션 런타임에서는 `DATABASE_URL` (connection pool)을 사용합니다.

### 6. 개발 서버 실행

```bash
pnpm dev
```

브라우저에서 `http://localhost:3000`을 열어 확인하세요.

## 🗄️ 데이터베이스 스키마

### 주요 테이블

- **families**: 가족 정보
- **family_members**: 가족 구성원
- **categories**: 지출 카테고리
- **expenses**: 지출 내역

### 특징

- **이중 식별자**: bigint autoincrement PK + UUID
- **Row Level Security**: Supabase RLS 정책 적용
- **관계 설정**: 완전한 외래키 관계
- **인덱스 최적화**: 성능을 위한 적절한 인덱스

## 📱 주요 기능

- ✅ Google OAuth 로그인
- ✅ 모바일 최적화 UI
- ✅ 가족 구성원 관리
- ✅ 지출 카테고리 관리
- ✅ 지출 내역 추가/수정/삭제
- ✅ 실시간 통계 대시보드

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

# 데이터베이스 스키마 생성 (.env.local 자동 로드)
pnpm db:generate

# 데이터베이스 마이그레이션 (.env.local 자동 로드)
pnpm db:migrate

# 데이터베이스 스키마 푸시 (.env.local 자동 로드)
pnpm db:push

# Drizzle Studio 실행 (.env.local 자동 로드)
pnpm db:studio
```

## 🚀 배포

### Vercel 배포

1. Vercel에 프로젝트 연결
2. 환경 변수 설정 (위의 `.env.local` 내용)
3. `NEXTAUTH_URL`을 배포된 도메인으로 변경
4. Google OAuth 리디렉션 URI에 배포된 도메인 추가

## 📊 마이그레이션 히스토리

| 파일명 | 설명 | 주요 변경사항 |
|--------|------|---------------|
| `0000_living_silver_sable.sql` | Initial schema setup | 초기 테이블 생성 (families, family_members, categories, expenses) |
| `0001_brief_silhouette.sql` | Add NextAuth tables | NextAuth 인증 테이블 추가 (users, accounts, sessions, verificationTokens) |
| `0002_quick_sleeper.sql` | Add soft delete support | 모든 테이블에 deleted_at 컬럼 추가, cascade 제약조건 제거 |
| `0003_groovy_lorna_dane.sql` | Fix NextAuth compatibility | NextAuth 테이블에서 deleted_at 제거, auth 테이블에 cascade 복원 |

### 마이그레이션 명령어

```bash
# 자동 이름으로 마이그레이션 생성
pnpm db:generate

# 커스텀 이름으로 마이그레이션 생성
pnpm db:generate:named "설명적인-마이그레이션-이름"

# 마이그레이션 적용
pnpm db:migrate

# 개발 환경에서 스키마 직접 푸시 (주의: 프로덕션에서 사용 금지)
pnpm db:push
```

## 📄 라이센스

MIT License