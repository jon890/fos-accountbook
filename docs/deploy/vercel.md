# Vercel 배포 가이드

Next.js 프론트엔드를 Vercel에 배포하는 완전한 가이드입니다.

## 📋 목차

- [사전 준비](#-사전-준비)
- [환경변수 설정](#-환경변수-설정)
- [Vercel 배포](#-vercel-배포)
- [Google OAuth 설정](#-google-oauth-설정)
- [트러블슈팅](#-트러블슈팅)

---

## 🔧 사전 준비

### 1. 백엔드 URL 확인

Railway 백엔드가 배포되어 있어야 합니다:
```
https://fos-accountbook-backend-production.up.railway.app
```

Health Check:
```bash
curl https://fos-accountbook-backend-production.up.railway.app/api/v1/health
# 응답: {"status":"UP"}
```

### 2. Railway MySQL 연결 정보

Railway 대시보드 → MySQL 서비스 → Variables 탭에서 확인:
- `MYSQL_URL`: `mysql://root:password@mysql.railway.internal:3306/railway`

또는 Public URL (Vercel에서 접근):
- `MYSQL_PUBLIC_URL`: `mysql://root:password@monorail.proxy.rlwy.net:12345/railway`

### 3. 필요한 계정

- [Vercel 계정](https://vercel.com) (GitHub 연동)
- [Google Cloud Console](https://console.cloud.google.com) (OAuth용)

---

## 🔑 환경변수 설정

### Vercel 대시보드에서 설정

```
Vercel 대시보드 → 프로젝트 선택 → Settings → Environment Variables
```

### 필수 환경변수

| Variable Name | Value | Environment |
|---------------|-------|-------------|
| `AUTH_SECRET` | Auth.js 암호화 키 (아래 생성 방법 참고) | Production, Preview, Development |
| `NEXT_PUBLIC_API_URL` | `https://fos-accountbook-backend-production.up.railway.app/api/v1` | Production, Preview |
| `NEXT_PUBLIC_API_URL` | `http://localhost:8080/api/v1` | Development |
| `AUTH_GOOGLE_ID` | Google OAuth Client ID | Production, Preview, Development |
| `AUTH_GOOGLE_SECRET` | Google OAuth Client Secret | Production, Preview, Development |
| `DATABASE_URL` | Railway MySQL Public URL | Production, Preview, Development |

### 선택 환경변수

| Variable Name | Value | Environment |
|---------------|-------|-------------|
| `NEXTAUTH_URL` | `https://your-app.vercel.app` | Production (Vercel이 자동 설정) |
| `NODE_ENV` | `production` | Production (Vercel이 자동 설정) |

---

## 🔐 AUTH_SECRET 생성

### 방법 1: Auth.js CLI (권장)

```bash
cd /Users/nhn/personal/fos-accountbook
npx auth secret
```

출력:
```
AUTH_SECRET="gnZmUTovb2pCd3l5b2pCd3l5b2pCd3l5b2pCd3l5b2pCd3l5b2pCd3l5b2pCd3l5"
```

이 값을 복사하여 Vercel에 추가합니다.

### 방법 2: OpenSSL

```bash
openssl rand -base64 32
```

---

## 🔗 DATABASE_URL 설정

### Railway MySQL Public URL 가져오기

```bash
Railway 대시보드 → MySQL 서비스 → Variables 탭
→ MYSQL_PUBLIC_URL 복사
```

**예시**:
```
mysql://root:xYzAbC123@monorail.proxy.rlwy.net:54321/railway
```

**⚠️ 주의**: 
- **Internal URL** (`mysql.railway.internal`)은 Railway 내부에서만 접근 가능
- **Public URL** (`monorail.proxy.rlwy.net`)을 Vercel에서 사용해야 함

### Vercel에 설정

```
Vercel → Settings → Environment Variables

Variable Name: DATABASE_URL
Variable Value: mysql://root:xYzAbC123@monorail.proxy.rlwy.net:54321/railway
```

---

## 🎨 Google OAuth 설정

### 1. Google Cloud Console 접속

https://console.cloud.google.com/

### 2. 프로젝트 생성

1. "New Project" 클릭
2. 프로젝트 이름: "FOS Accountbook"
3. "Create" 클릭

### 3. OAuth 동의 화면 구성

```
APIs & Services → OAuth consent screen

1. User Type: External 선택
2. 앱 이름: "우리집 가계부"
3. 사용자 지원 이메일: your-email@example.com
4. 범위 추가: email, profile
5. 저장 및 계속
```

### 4. OAuth 2.0 Client ID 생성

```
APIs & Services → Credentials → Create Credentials → OAuth 2.0 Client IDs

1. Application type: Web application
2. Name: "FOS Accountbook Web"
3. Authorized redirect URIs:
   - http://localhost:3000/api/auth/callback/google (로컬)
   - https://your-app.vercel.app/api/auth/callback/google (프로덕션)
4. Create 클릭
```

### 5. Client ID와 Secret 복사

```
Client ID: 123456789-abcdefg.apps.googleusercontent.com
Client Secret: GOCSPX-xYzAbC123
```

이 값들을 Vercel 환경변수에 추가합니다.

---

## 🚀 Vercel 배포

### 1. GitHub 레포지터리 연결

```bash
# GitHub에 푸시
git add .
git commit -m "feat: Add Vercel deployment config"
git push origin main
```

### 2. Vercel 프로젝트 생성

```
Vercel 대시보드 → New Project
→ Import Git Repository
→ fos-accountbook 선택
→ Deploy
```

### 3. 환경변수 설정

```
프로젝트 → Settings → Environment Variables
→ 위에서 정리한 환경변수 모두 추가
```

**Production 환경변수**:
```
AUTH_SECRET=your-auth-secret
NEXT_PUBLIC_API_URL=https://fos-accountbook-backend-production.up.railway.app/api/v1
AUTH_GOOGLE_ID=your-google-client-id.apps.googleusercontent.com
AUTH_GOOGLE_SECRET=GOCSPX-your-google-secret
DATABASE_URL=mysql://root:password@monorail.proxy.rlwy.net:12345/railway
```

### 4. 재배포

환경변수 추가 후:
```
Deployments 탭 → 최신 배포 → "Redeploy" 클릭
```

### 5. 도메인 확인

```
Vercel 대시보드 → 프로젝트 → Domains
→ your-app.vercel.app 또는 커스텀 도메인
```

---

## ✅ 배포 확인

### 1. 프론트엔드 접속

```
https://your-app.vercel.app
```

### 2. Google 로그인 테스트

1. "Sign In with Google" 클릭
2. Google 계정 선택
3. 권한 승인
4. 대시보드로 리디렉션 확인

### 3. 백엔드 API 연동 확인

브라우저 개발자 도구 → Network 탭:
```
Request URL: https://fos-accountbook-backend-production.up.railway.app/api/v1/families
Status: 200 OK
```

---

## 🔧 로컬 개발 환경 설정

### .env.local 파일 생성

프로젝트 루트에 `.env.local` 파일 생성:

```bash
# Auth.js
AUTH_SECRET="your-local-auth-secret"
AUTH_GOOGLE_ID="your-google-client-id.apps.googleusercontent.com"
AUTH_GOOGLE_SECRET="GOCSPX-your-google-secret"

# 백엔드 API (로컬)
NEXT_PUBLIC_API_URL="http://localhost:8080/api/v1"

# 데이터베이스 (Auth.js 테이블용)
DATABASE_URL="mysql://root:password@monorail.proxy.rlwy.net:12345/railway"

# Next.js
NEXTAUTH_URL="http://localhost:3000"
NODE_ENV="development"
```

### Prisma Client 생성

```bash
cd /Users/nhn/personal/fos-accountbook
pnpm db:generate
```

### 로컬 개발 서버 실행

```bash
pnpm dev
```

브라우저에서 `http://localhost:3000` 접속

---

## 🐛 트러블슈팅

### 1. Google OAuth 오류

**에러**: `redirect_uri_mismatch`

**원인**: Authorized redirect URIs가 일치하지 않음

**해결**:
1. Google Cloud Console → OAuth 2.0 Client ID
2. Authorized redirect URIs 확인:
   ```
   https://your-app.vercel.app/api/auth/callback/google
   ```
3. Vercel 도메인과 정확히 일치하는지 확인

### 2. 백엔드 연결 실패

**에러**: `Failed to fetch from backend`

**원인**: CORS 설정 또는 잘못된 API URL

**해결**:
1. `NEXT_PUBLIC_API_URL` 확인:
   ```
   https://fos-accountbook-backend-production.up.railway.app/api/v1
   ```
2. 백엔드 CORS 설정 확인 (SecurityConfig.java):
   ```java
   .allowedOrigins("https://your-app.vercel.app")
   ```

### 3. DATABASE_URL 연결 실패

**에러**: `Can't reach database server`

**원인**: Internal URL 사용 또는 잘못된 연결 정보

**해결**:
1. Railway MySQL **Public URL** 사용:
   ```
   mysql://root:pass@monorail.proxy.rlwy.net:12345/railway
   ```
2. Railway MySQL → Networking → Public Networking 활성화 확인

### 4. Auth.js 세션 오류

**에러**: `[auth][error] SessionTokenVerificationError`

**원인**: AUTH_SECRET 불일치

**해결**:
1. `npx auth secret`로 새로운 secret 생성
2. Vercel 환경변수 업데이트
3. 재배포

### 5. Prisma Client 오류

**에러**: `PrismaClient is unable to run in the browser`

**원인**: 클라이언트 컴포넌트에서 Prisma 직접 사용

**해결**:
- Auth.js는 서버 사이드에서만 Prisma 사용
- 비즈니스 로직은 백엔드 API 호출

---

## 📊 환경별 설정 요약

### Production (Vercel)

```bash
AUTH_SECRET=production-secret
NEXT_PUBLIC_API_URL=https://fos-accountbook-backend-production.up.railway.app/api/v1
DATABASE_URL=mysql://root:pass@monorail.proxy.rlwy.net:12345/railway
AUTH_GOOGLE_ID=prod-client-id.apps.googleusercontent.com
AUTH_GOOGLE_SECRET=GOCSPX-prod-secret
```

### Preview (Vercel)

```bash
# Production과 동일하거나 별도 설정
AUTH_SECRET=preview-secret
NEXT_PUBLIC_API_URL=https://fos-accountbook-backend-production.up.railway.app/api/v1
DATABASE_URL=mysql://root:pass@monorail.proxy.rlwy.net:12345/railway
AUTH_GOOGLE_ID=prod-client-id.apps.googleusercontent.com
AUTH_GOOGLE_SECRET=GOCSPX-prod-secret
```

### Development (Local)

```bash
AUTH_SECRET=local-secret
NEXT_PUBLIC_API_URL=http://localhost:8080/api/v1
DATABASE_URL=mysql://root:pass@monorail.proxy.rlwy.net:12345/railway
AUTH_GOOGLE_ID=prod-client-id.apps.googleusercontent.com
AUTH_GOOGLE_SECRET=GOCSPX-prod-secret
NEXTAUTH_URL=http://localhost:3000
```

---

## 🔗 유용한 링크

- [Vercel 대시보드](https://vercel.com/dashboard)
- [Vercel 환경변수 가이드](https://vercel.com/docs/projects/environment-variables)
- [Auth.js v5 문서](https://authjs.dev/)
- [Google OAuth 설정](https://developers.google.com/identity/protocols/oauth2)
- [Railway Public Networking](https://docs.railway.app/reference/public-networking)

---

## 📞 지원

문제 발생 시:
1. Vercel 배포 로그 확인
2. 브라우저 개발자 도구 → Console 확인
3. 백엔드 API Health Check 확인
4. 이 가이드의 트러블슈팅 섹션 참조

---

## ✅ 배포 완료 체크리스트

- [ ] Railway 백엔드 배포 완료
- [ ] Railway MySQL Public URL 확인
- [ ] Google OAuth Client ID 생성
- [ ] Vercel 프로젝트 생성
- [ ] Vercel 환경변수 모두 설정
- [ ] 재배포 완료
- [ ] Google 로그인 테스트 성공
- [ ] 백엔드 API 연동 확인
- [ ] 지출 등록 테스트 성공

---

**축하합니다!** 🎉

이제 다음 URL에서 앱을 사용할 수 있습니다:
- **프론트엔드**: `https://your-app.vercel.app`
- **백엔드**: `https://fos-accountbook-backend-production.up.railway.app`

---

**마지막 업데이트**: 2025-10-10  
**작성자**: fos-accountbook Team

