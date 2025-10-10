# NextAuth (Auth.js) 통합 가이드

## 🎯 개요

백엔드에서 NextAuth v5 세션 토큰을 검증하여 프론트엔드와 통합합니다.

## 🔐 인증 흐름

```
1. 사용자 Google 로그인 (프론트엔드)
   ↓
2. NextAuth 세션 생성 (JWT 토큰)
   ↓
3. 세션 토큰이 쿠키에 저장
   next-auth.session-token (로컬)
   __Secure-next-auth.session-token (HTTPS)
   ↓
4. API 요청 시 쿠키 자동 포함
   ↓
5. NextAuthTokenFilter가 토큰 검증 (백엔드)
   ↓
6. Spring Security Authentication 설정
   ↓
7. API 요청 처리
```

## 🛠 구현 내용

### 백엔드

#### 1. AbstractJwtTokenProvider (새로 추가) 🆕
- 위치: `src/main/java/com/bifos/accountbook/infra/security/AbstractJwtTokenProvider.java`
- 역할: JWT 토큰 검증/추출을 위한 **추상 클래스** (공통 로직 제공)
- 공통 기능:
  - `validateToken()`: 토큰 유효성 검증
  - `getClaimsFromToken()`: Claims 추출
  - `getUserIdFromToken()`: 사용자 ID (subject) 추출
  - `getEmailFromToken()`: 이메일 추출
  - `getNameFromToken()`: 사용자 이름 추출
  - `createSigningKey()`: 문자열 비밀키를 SecretKey로 변환
- **추상 메서드**: `getSigningKey()` - 하위 클래스에서 각자의 비밀키 제공

#### 2. NextAuthTokenProvider (새로 추가)
- 위치: `src/main/java/com/bifos/accountbook/infra/security/NextAuthTokenProvider.java`
- **`AbstractJwtTokenProvider`를 상속**하여 NextAuth 세션 토큰 검증
- NextAuth SECRET KEY만 주입받아 공통 로직 재사용
- 코드: 단 **10줄** (비밀키 주입 + getSigningKey() 구현만)

#### 3. JwtTokenProvider (수정)
- 위치: `src/main/java/com/bifos/accountbook/infra/security/JwtTokenProvider.java`
- **`AbstractJwtTokenProvider`를 상속**하여 백엔드 자체 JWT 관리
- 공통 검증 로직은 부모 클래스에서 상속
- 백엔드 전용 기능 추가:
  - `generateToken()`: JWT 토큰 생성
  - `generateRefreshToken()`: Refresh 토큰 생성
  - `getAuthoritiesFromToken()`: 권한(roles) 추출
  - `getAuthentication()`: Spring Security Authentication 생성

#### 4. NextAuthTokenFilter (새로 추가)
- 위치: `src/main/java/com/bifos/accountbook/infra/security/NextAuthTokenFilter.java`
- 역할: NextAuth JWT 세션 토큰 추출 및 Spring Security Authentication 설정
- `NextAuthTokenProvider`를 주입받아 JWT 검증 로직 위임

#### 5. SecurityConfig (수정)
- NextAuthTokenFilter를 JWT 필터보다 먼저 실행
- CORS 설정에 프론트엔드 도메인 추가

#### 6. application.yml (환경변수 통합)
```yaml
# JWT 설정 (백엔드 자체 JWT + NextAuth 세션 검증 공통 사용)
jwt:
  secret: ${AUTH_SECRET}
  
# NextAuth 설정 (Auth.js 세션 검증용) - JWT와 동일한 SECRET 사용
nextauth:
  secret: ${AUTH_SECRET}
```
**✅ 핵심**: `AUTH_SECRET` 하나로 통일하여 관리 간소화!

### 🎨 리팩토링 효과

**Before (중복 코드)**:
- `JwtTokenProvider`: 150줄 (검증 + 생성 로직)
- `NextAuthTokenProvider`: 131줄 (검증 로직만)
- **중복**: `validateToken()`, `getUserIdFromToken()`, `getEmailFromToken()` 등

**After (상속 구조)**:
- `AbstractJwtTokenProvider`: 119줄 (공통 검증 로직)
- `JwtTokenProvider`: 107줄 (**43줄 감소**)
- `NextAuthTokenProvider`: 37줄 (**94줄 감소**)
- **총 코드량**: 43줄 중복 제거 ✨
- **유지보수성**: Secret Key만 다르고 검증 로직 통일

### 프론트엔드

#### 1. API 클라이언트 (새로 추가)
- 위치: `src/lib/api-client.ts`
- 역할: 백엔드 API 호출 시 NextAuth 세션 쿠키 자동 포함

#### 2. 가족 생성/조회 (수정)
- `src/app/families/create/page.tsx`
- `src/components/families/FamilySelector.tsx`
- `apiPost`, `apiGet` 함수 사용으로 간소화

## 🔧 환경변수 설정

### 프론트엔드 (.env.local)

```bash
# Auth.js 세션 암호화 키 (필수)
AUTH_SECRET="your-auth-secret-generated-by-npx-auth-secret"

# Google OAuth
AUTH_GOOGLE_ID="your-google-client-id.apps.googleusercontent.com"
AUTH_GOOGLE_SECRET="GOCSPX-your-google-secret"

# 백엔드 API URL
NEXT_PUBLIC_API_URL="http://localhost:8080/api/v1"

# 데이터베이스 (Auth.js용)
DATABASE_URL="mysql://root:password@localhost:3306/accountbook"
```

### 백엔드 (Railway 환경변수)

Railway 대시보드 → Backend 서비스 → Variables 탭:

| 변수명 | 값 | 설명 |
|--------|------|------|
| `AUTH_SECRET` | (프론트엔드와 동일한 값) | **JWT + NextAuth 공통 비밀키** 🔑 |
| `SPRING_DATASOURCE_URL` | `jdbc:mysql://${{MySQL.MYSQLHOST}}:${{MySQL.MYSQLPORT}}/${{MySQL.MYSQLDATABASE}}?...` | MySQL 연결 |
| `SPRING_DATASOURCE_USERNAME` | `${{MySQL.MYSQLUSER}}` | MySQL 사용자 |
| `SPRING_DATASOURCE_PASSWORD` | `${{MySQL.MYSQLPASSWORD}}` | MySQL 비밀번호 |
| `SPRING_PROFILES_ACTIVE` | `prod` | 프로파일 |

**✅ 통합 완료**: `AUTH_SECRET` 하나로 백엔드 JWT와 NextAuth 세션을 모두 검증합니다!
**⚠️ 중요**: `AUTH_SECRET`은 프론트엔드와 백엔드에서 **동일한 값**을 사용해야 합니다!

### AUTH_SECRET 생성 방법

```bash
cd /Users/nhn/personal/fos-accountbook
npx auth secret
```

출력된 값을:
1. 프론트엔드 `.env.local`에 `AUTH_SECRET=...` 추가
2. Railway 백엔드 서비스에 `AUTH_SECRET` 환경변수로 추가

## 🚀 배포 및 테스트

### 1. 백엔드 배포

```bash
cd /Users/nhn/personal/fos-accountbook-backend
git add .
git commit -m "feat: NextAuth 세션 검증 추가"
git push origin main
```

Railway가 자동으로 배포합니다.

### 2. Railway 환경변수 설정

```
Railway 대시보드 → Backend 서비스 → Variables 탭
→ AUTH_SECRET 추가 (프론트엔드와 동일한 값)
→ Redeploy
```

### 3. 프론트엔드 배포

```bash
cd /Users/nhn/personal/fos-accountbook
git add .
git commit -m "feat: 백엔드 API 통합 (NextAuth 세션 사용)"
git push origin main
```

Vercel이 자동으로 배포합니다.

### 4. Vercel 환경변수 확인

```
Vercel 대시보드 → 프로젝트 → Settings → Environment Variables
→ NEXT_PUBLIC_API_URL 확인/업데이트
→ AUTH_SECRET 확인
→ Redeploy
```

## 🧪 테스트

### 로컬 테스트

1. **백엔드 시작**:
```bash
cd /Users/nhn/personal/fos-accountbook-backend
# .env.local에 AUTH_SECRET 추가 (프론트엔드와 동일)
export AUTH_SECRET="your-auth-secret"
./gradlew bootRun
```

2. **프론트엔드 시작**:
```bash
cd /Users/nhn/personal/fos-accountbook
# .env.local에 AUTH_SECRET 확인
pnpm dev
```

3. **테스트 시나리오**:
   - http://localhost:3000 접속
   - Google 로그인
   - 가족 생성 시도
   - 브라우저 개발자 도구 → Network 탭
   - 요청 헤더에 `Cookie: next-auth.session-token=...` 확인
   - 응답 `201 Created` 확인

### 프로덕션 테스트

1. https://your-app.vercel.app 접속
2. Google 로그인
3. 가족 생성 시도
4. 성공 메시지 확인

### 디버깅

**백엔드 로그 확인 (Railway)**:
```
Railway 대시보드 → Backend 서비스 → Deployments → View Logs
```

로그에서 확인할 내용:
```
✅ "NextAuth 세션 검증 성공: user=user@example.com"
✅ "Creating family for user: {userId}"
✅ "가족이 생성되었습니다"

❌ "NextAuth 토큰 검증 실패: JWT signature does not match"
   → AUTH_SECRET이 프론트엔드와 다름
   
❌ "NextAuth 토큰 만료"
   → 세션 만료, 다시 로그인 필요
```

## 🐛 트러블슈팅

### 1. 401 Unauthorized

**원인**: NextAuth 세션 토큰이 없거나 검증 실패

**해결**:
1. 프론트엔드 로그인 확인
2. 쿠키에 `next-auth.session-token` 있는지 확인
3. `AUTH_SECRET`이 프론트엔드와 백엔드에서 동일한지 확인

### 2. JWT signature does not match

**원인**: `AUTH_SECRET` 불일치

**해결**:
1. 프론트엔드 `.env.local`의 `AUTH_SECRET` 확인
2. Railway 백엔드의 `AUTH_SECRET` 환경변수 확인
3. 동일한 값으로 설정 후 재배포

### 3. CORS 오류

**원인**: 백엔드 CORS 설정에 프론트엔드 URL 없음

**해결**:
`SecurityConfig.java`의 `allowedOrigins`에 추가:
```java
configuration.setAllowedOrigins(Arrays.asList(
    "http://localhost:3000",
    "https://your-app.vercel.app"  // 프로덕션 URL 추가
));
```

### 4. 쿠키가 전달되지 않음

**원인**: `credentials: 'include'` 설정 누락 또는 SameSite 정책

**해결**:
- API 클라이언트에서 `credentials: 'include'` 확인 (✅ 이미 설정됨)
- HTTPS 사용 (프로덕션)
- CORS `allowCredentials: true` 확인 (✅ 이미 설정됨)

## 📊 아키텍처 다이어그램

```
┌─────────────────────────────────────────────────┐
│           프론트엔드 (Vercel)                    │
├─────────────────────────────────────────────────┤
│  NextAuth v5                                     │
│  ├─ Google OAuth 로그인                         │
│  ├─ JWT 세션 생성                               │
│  └─ 쿠키 저장: next-auth.session-token          │
│                                                  │
│  API 클라이언트 (api-client.ts)                 │
│  └─ credentials: 'include' → 쿠키 자동 포함     │
└─────────────────────────────────────────────────┘
                        ↓ HTTP Request
                        ↓ Cookie: next-auth.session-token=...
┌─────────────────────────────────────────────────┐
│          백엔드 (Railway)                        │
├─────────────────────────────────────────────────┤
│  NextAuthTokenFilter                             │
│  ├─ 쿠키에서 세션 토큰 추출                     │
│  ├─ JJWT로 토큰 검증 (AUTH_SECRET)              │
│  ├─ 사용자 조회 (users 테이블)                  │
│  └─ Spring Security Authentication 설정         │
│                                                  │
│  FamilyController                                │
│  └─ @PostMapping("/families")                   │
│      ↓                                           │
│  FamilyService                                   │
│      ↓                                           │
│  JPA Repository → MySQL                          │
└─────────────────────────────────────────────────┘
```

## 🔗 관련 파일

### 백엔드
- `NextAuthTokenFilter.java` - 세션 검증 필터
- `SecurityConfig.java` - Security 설정
- `application.yml` - 환경변수 설정

### 프론트엔드
- `api-client.ts` - API 클라이언트
- `families/create/page.tsx` - 가족 생성
- `FamilySelector.tsx` - 가족 목록

---

**마지막 업데이트**: 2025-10-10  
**작성자**: FOS Accountbook Team

