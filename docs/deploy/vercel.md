# Vercel 배포 가이드

## 🚀 Vercel 배포하기

### 1️⃣ 환경변수 설정 (필수!)

Vercel 대시보드에서 다음 환경변수를 **반드시** 설정해야 합니다.

#### 🔧 Vercel Dashboard → Settings → Environment Variables

| 환경변수                   | 설명                              | 예시 값                                   | 환경                             |
| -------------------------- | --------------------------------- | ----------------------------------------- | -------------------------------- |
| `DATABASE_URL`             | MySQL 데이터베이스 연결 문자열    | `mysql://user:pass@host:3306/db`          | Production, Preview, Development |
| `NEXTAUTH_URL`             | 배포된 앱의 URL                   | `https://your-app.vercel.app`             | Production, Preview              |
| `NEXTAUTH_SECRET`          | NextAuth 시크릿 (32자 이상)       | `openssl rand -base64 32` 실행 결과       | Production, Preview, Development |
| `GOOGLE_CLIENT_ID`         | Google OAuth Client ID            | `xxx.apps.googleusercontent.com`          | Production, Preview, Development |
| `GOOGLE_CLIENT_SECRET`     | Google OAuth Client Secret        | `GOCSPX-xxx`                              | Production, Preview, Development |
| `NEXT_PUBLIC_API_BASE_URL` | **백엔드 API URL (클라이언트용)** | `https://your-backend.railway.app/api/v1` | Production, Preview, Development |
| `BACKEND_API_URL`          | **백엔드 API URL (서버용)**       | `https://your-backend.railway.app/api/v1` | Production, Preview, Development |

> ⚠️ **중요**: `NEXT_PUBLIC_*` 환경변수는 빌드 시점에 번들에 포함됩니다.  
> 환경변수를 변경한 후에는 **반드시 재배포**해야 합니다!

---

### 2️⃣ 환경변수가 제대로 설정되었는지 확인

#### Vercel Build Logs 확인

```bash
# 빌드 로그에서 다음 메시지가 나와야 합니다:
✅ Environment variables validated successfully
```

만약 다음과 같은 에러가 나타나면 환경변수가 누락되었거나 잘못된 것입니다:

```bash
❌ Invalid server environment variables:
{
  "NEXT_PUBLIC_API_BASE_URL": {
    "_errors": ["Required"]
  }
}
Error: Invalid server environment variables
```

---

### 3️⃣ Google OAuth Redirect URI 설정

Google Cloud Console에서 Redirect URI를 추가해야 합니다:

1. [Google Cloud Console](https://console.cloud.google.com/apis/credentials) 접속
2. OAuth 2.0 클라이언트 ID 선택
3. **승인된 리디렉션 URI**에 다음 추가:
   ```
   https://your-app.vercel.app/api/auth/callback/google
   ```

---

### 4️⃣ 백엔드 API CORS 설정

백엔드 API에서 Vercel 도메인을 CORS 허용 목록에 추가해야 합니다.

**Spring Boot 예시:**

```java
@Configuration
public class SecurityConfig {
    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        configuration.setAllowedOrigins(Arrays.asList(
            "http://localhost:3000",
            "https://your-app.vercel.app"  // ← Vercel 도메인 추가
        ));
        configuration.setAllowedMethods(Arrays.asList("GET", "POST", "PUT", "DELETE", "OPTIONS"));
        configuration.setAllowCredentials(true);
        // ...
    }
}
```

---

### 5️⃣ 배포 전 체크리스트

- [ ] Vercel 환경변수 모두 설정됨
- [ ] `NEXT_PUBLIC_API_BASE_URL`이 실제 백엔드 URL로 설정됨
- [ ] `NEXTAUTH_URL`이 Vercel 도메인으로 설정됨
- [ ] Google OAuth Redirect URI에 Vercel 도메인 추가됨
- [ ] 백엔드 CORS 설정에 Vercel 도메인 추가됨
- [ ] 데이터베이스가 외부에서 접근 가능한지 확인

---

## 🔍 트러블슈팅

### 문제: API 요청이 localhost로 가는 경우

**원인**: `NEXT_PUBLIC_API_BASE_URL` 환경변수가 빌드 시점에 설정되지 않았거나, 환경변수 변경 후 재배포하지 않음

**해결방법**:

1. Vercel Dashboard → Settings → Environment Variables에서 `NEXT_PUBLIC_API_BASE_URL` 확인
2. 값이 없거나 잘못되었다면 수정
3. **Deployments 탭 → 최신 배포 → Redeploy → Use existing Build Cache 체크 해제**
4. 재배포 후 빌드 로그에서 "✅ Environment variables validated successfully" 확인

### 문제: 환경변수 검증 에러

**에러 메시지**:

```
Error: Invalid server environment variables
```

**해결방법**:

1. 빌드 로그에서 어떤 환경변수가 문제인지 확인
2. Vercel Dashboard에서 해당 환경변수 설정
3. 형식이 올바른지 확인 (URL은 http:// 또는 https://로 시작)
4. 재배포

### 문제: Google OAuth 로그인 실패

**원인**: Redirect URI가 설정되지 않음

**해결방법**:

1. Google Cloud Console에서 Redirect URI 확인
2. `https://your-app.vercel.app/api/auth/callback/google` 추가
3. 설정 저장 후 5-10분 대기 (Google에서 설정이 전파되는 시간)

---

## 📌 환경변수 관리 팁

### Development vs Production

```bash
# Development (로컬)
NEXT_PUBLIC_API_BASE_URL=http://localhost:8080/api/v1
BACKEND_API_URL=http://localhost:8080/api/v1

# Production (Vercel)
NEXT_PUBLIC_API_BASE_URL=https://api.production.com/api/v1
BACKEND_API_URL=https://api.production.com/api/v1

# Preview (Vercel Preview Deployments)
NEXT_PUBLIC_API_BASE_URL=https://api.staging.com/api/v1
BACKEND_API_URL=https://api.staging.com/api/v1
```

### 환경별 설정 방법

Vercel에서는 환경변수를 다음 3가지 환경에 따라 다르게 설정할 수 있습니다:

- **Production**: `main` 브랜치 배포 시 사용
- **Preview**: Pull Request 배포 시 사용
- **Development**: `vercel dev` 로컬 실행 시 사용

각 환경에 맞는 값을 설정하세요!

---

## 🔐 보안 주의사항

1. **절대 커밋하지 마세요**: `.env.local` 파일은 `.gitignore`에 포함되어 있습니다
2. **NEXTAUTH_SECRET 생성**: `openssl rand -base64 32`로 강력한 시크릿 생성
3. **환경변수 로테이션**: 정기적으로 시크릿 변경
4. **최소 권한 원칙**: 데이터베이스 사용자는 필요한 권한만 부여

---

## 📖 참고 자료

- [Vercel Environment Variables 공식 문서](https://vercel.com/docs/concepts/projects/environment-variables)
- [Next.js Environment Variables](https://nextjs.org/docs/app/building-your-application/configuring/environment-variables)
- [NextAuth.js Deployment](https://next-auth.js.org/deployment)
