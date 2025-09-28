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

# Database URLs (중요: 용도별로 다른 URL 사용)
# Connection Pool URL - 애플리케이션 런타임에서 사용 (port 6543)
# prepared statement 충돌 방지를 위한 파라미터 추가
DATABASE_URL=postgresql://postgres:your_password@db.your-project.supabase.co:6543/postgres?pgbouncer=true&connection_limit=1

# Direct Connection URL - 마이그레이션/스키마 변경 시에만 사용 (port 5432)
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
# .env.local 파일이 있는지 확인 후 실행 (마이그레이션 사용)
pnpm db:migrate
```

> **중요**: 
> - 개발 시 **마이그레이션**을 사용하여 스키마를 관리합니다
> - Supabase Shadow Database 문제 해결을 위해 `--skip-seed` 옵션 사용
> - Prisma는 자동으로 용도에 맞는 URL을 사용합니다:
>   - **애플리케이션 런타임**: `DATABASE_URL` (Connection Pool)
>   - **마이그레이션/스키마 작업**: `DIRECT_URL` (Direct Connection)
> - Vercel 배포 시 자동으로 `prisma generate`가 실행됩니다

### 🔧 Supabase Shadow Database 문제 해결

Supabase에서 마이그레이션 시 Shadow Database 생성 권한 문제가 발생할 수 있습니다:

```bash
# 문제: database "prisma_migrate_shadow_db_xxx" does not exist
# 해결: --skip-seed 옵션으로 Shadow Database 검증 건너뛰기

pnpm db:migrate  # 이미 --skip-seed 옵션이 포함되어 있음
```

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
- **snake_case 컨벤션**: 모든 테이블명과 컬럼명
- **UUID 기반 조인**: 테이블 간 관계는 UUID로 연결
- **Soft Delete**: `deleted_at` 컬럼을 통한 논리 삭제
- **관계 설정**: 완전한 외래키 관계
- **인덱스 최적화**: 성능을 위한 적절한 인덱스

### 스키마 예시
```sql
-- 가족 구성원 테이블
CREATE TABLE family_members (
  id          BIGSERIAL PRIMARY KEY,
  uuid        UUID UNIQUE DEFAULT gen_random_uuid(),
  family_uuid UUID NOT NULL,
  user_id     TEXT NOT NULL,
  role        VARCHAR(20) DEFAULT 'member',
  joined_at   TIMESTAMPTZ DEFAULT NOW(),
  deleted_at  TIMESTAMPTZ,
  
  FOREIGN KEY (family_uuid) REFERENCES families(uuid),
  FOREIGN KEY (user_id) REFERENCES users(id),
  UNIQUE (family_uuid, user_id)
);
```

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

# Prisma Client 생성 (.env.local 자동 로드)
pnpm db:generate

# 개발 환경 마이그레이션 (.env.local 자동 로드)
pnpm db:migrate

# 프로덕션 마이그레이션 배포 (.env.local 자동 로드)
pnpm db:migrate:deploy

# 데이터베이스 스키마 푸시 (.env.local 자동 로드)
pnpm db:push

# Prisma Studio 실행 (.env.local 자동 로드)
pnpm db:studio

# 데이터베이스 시드 (.env.local 자동 로드)
pnpm db:seed

# 데이터베이스 리셋 (.env.local 자동 로드)
pnpm db:reset

# 스키마 검증 (.env.local 자동 로드)
pnpm db:validate
```

## 🚀 배포

### Vercel 배포

1. Vercel에 프로젝트 연결
2. 환경 변수 설정 (위의 `.env.local` 내용)
3. `NEXTAUTH_URL`을 배포된 도메인으로 변경
4. Google OAuth 리디렉션 URI에 배포된 도메인 추가

> **배포 주의사항**:
> - `postinstall` 스크립트가 자동으로 `prisma generate`를 실행합니다
> - 환경 변수가 제대로 설정되어 있는지 확인하세요
> - Supabase 연결 풀링 URL(`DATABASE_URL`)을 사용하세요

## 📊 데이터베이스 진화 히스토리

### 주요 변경사항

| 버전 | 변경 내용 | 설명 |
|------|-----------|------|
| v1.0 | Drizzle ORM → Prisma ORM | 더 나은 NextAuth 호환성과 타입 안전성을 위해 전환 |
| v2.0 | BigInt ID → UUID 조인 | 테이블 간 관계를 UUID 기반으로 변경하여 확장성 개선 |
| v3.0 | camelCase → snake_case | 모든 테이블명과 컬럼명을 snake_case로 통일 |

### 스키마 관리 명령어

```bash
# 스키마 변경사항을 데이터베이스에 적용
pnpm db:push

# Prisma Studio에서 데이터베이스 확인
pnpm db:studio

# 개발용 마이그레이션 생성 및 적용
pnpm db:migrate

# 프로덕션용 마이그레이션 배포
pnpm db:migrate:deploy

# 스키마 검증
pnpm db:validate

# Prisma Client 재생성
pnpm db:generate

# 데이터베이스 리셋 (모든 데이터 삭제 후 스키마 재적용)
pnpm db:reset
```

### 🔄 현재 스키마 특징

- **snake_case 컨벤션**: 모든 테이블과 컬럼명
- **UUID 기반 조인**: `family_uuid`, `category_uuid` 등
- **Soft Delete**: `deleted_at` 컬럼 활용
- **관계명 명시**: Prisma relation 이름으로 관계 명확화

## 📄 라이센스

MIT License