# 백엔드 API 통합 가이드

## 🎯 현재 상태

### ✅ 완료된 작업
- [x] `CreateFamilyPage`: 백엔드 `POST /families` 호출로 변경
- [x] `FamilySelector`: 백엔드 `GET /families` 호출로 변경
- [x] 환경변수 `NEXT_PUBLIC_API_URL` 사용

### ⚠️ 해결 필요: 인증 문제

**문제**: 프론트엔드와 백엔드가 다른 인증 방식을 사용합니다.

| 항목 | 프론트엔드 | 백엔드 |
|------|------------|--------|
| **인증 방식** | NextAuth (Auth.js) | Spring Security + JWT |
| **세션 관리** | NextAuth 세션 쿠키 | JWT Bearer Token |
| **사용자 DB** | Prisma (MySQL - users 테이블) | JPA (MySQL - 동일한 users 테이블) |

**현재 API 호출 상태**:
```typescript
// ❌ JWT 토큰 없이 호출 - 401 Unauthorized 오류 발생
const response = await fetch(`${apiUrl}/families`, {
  credentials: 'include', // NextAuth 쿠키만 포함
})
```

---

## 🔧 해결 방안

### 방안 1: 백엔드에 Auth.js 세션 검증 추가 (권장 ⭐)

**장점**:
- NextAuth 세션만으로 백엔드 API 사용 가능
- 추가 로그인 불필요
- 사용자 경험 단순화

**단점**:
- 백엔드 Security 설정 변경 필요

**구현 방법**:
1. 백엔드에 NextAuth 세션 검증 필터 추가
2. 쿠키에서 NextAuth 세션 토큰 읽기
3. 세션 검증 후 `Authentication` 객체 생성

```java
// Spring Security 필터 체인에 NextAuth 검증 추가
@Bean
public SecurityFilterChain filterChain(HttpSecurity http) {
    http
        .addFilterBefore(new NextAuthSessionFilter(), 
                         UsernamePasswordAuthenticationFilter.class)
        // ...
}
```

### 방안 2: 프론트엔드에서 백엔드 JWT 받기

**장점**:
- 백엔드 변경 최소화

**단점**:
- 이중 인증 필요 (NextAuth + 백엔드 JWT)
- 복잡한 인증 흐름

**구현 방법**:
1. NextAuth 로그인 콜백에서 백엔드 로그인 API 호출
2. JWT 토큰 받아서 localStorage 저장
3. API 요청 시 Authorization 헤더에 JWT 포함

```typescript
// NextAuth callbacks
callbacks: {
  async signIn({ user }) {
    // 백엔드 로그인 API 호출
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/login`, {
      method: 'POST',
      body: JSON.stringify({ email: user.email })
    })
    const { accessToken } = await response.json()
    // 토큰 저장 (localStorage 또는 쿠키)
    return true
  }
}

// API 호출 시
const response = await fetch(`${apiUrl}/families`, {
  headers: {
    'Authorization': `Bearer ${localStorage.getItem('jwt')}`
  }
})
```

---

## 🚀 권장 솔루션: Auth.js + Spring Security 통합

### 1단계: API 유틸리티 함수 생성

```typescript
// src/lib/api-client.ts
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api/v1'

export async function apiClient(
  endpoint: string, 
  options: RequestInit = {}
) {
  const session = await getServerSession(authOptions)
  
  if (!session?.user?.email) {
    throw new Error('인증이 필요합니다')
  }

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
      // NextAuth 세션 정보 전달 (백엔드에서 검증)
      'X-User-Email': session.user.email,
    },
    credentials: 'include',
  })

  if (!response.ok) {
    const error = await response.json().catch(() => null)
    throw new Error(error?.message || `API 오류: ${response.status}`)
  }

  return response.json()
}
```

### 2단계: 백엔드에 Custom Filter 추가

```java
// NextAuthSessionFilter.java
public class NextAuthSessionFilter extends OncePerRequestFilter {
    
    @Override
    protected void doFilterInternal(
            HttpServletRequest request, 
            HttpServletResponse response, 
            FilterChain filterChain
    ) throws ServletException, IOException {
        
        String userEmail = request.getHeader("X-User-Email");
        
        if (userEmail != null) {
            // 사용자 조회 및 Authentication 설정
            User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new UsernameNotFoundException("User not found"));
            
            UsernamePasswordAuthenticationToken authentication = 
                new UsernamePasswordAuthenticationToken(
                    user.getId(), 
                    null, 
                    Collections.emptyList()
                );
            
            SecurityContextHolder.getContext().setAuthentication(authentication);
        }
        
        filterChain.doFilter(request, response);
    }
}
```

### 3단계: Security 설정 업데이트

```java
@Configuration
@EnableWebSecurity
public class SecurityConfig {
    
    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
            .csrf(csrf -> csrf.disable())
            .cors(cors -> cors.configurationSource(corsConfigurationSource()))
            .authorizeHttpRequests(auth -> auth
                .requestMatchers("/api/v1/auth/**", "/api/v1/health").permitAll()
                .anyRequest().authenticated()
            )
            // NextAuth 세션 필터 추가
            .addFilterBefore(nextAuthSessionFilter(), 
                             UsernamePasswordAuthenticationFilter.class)
            // 기존 JWT 필터는 헤더에 Authorization이 있을 때만 작동
            .addFilterBefore(jwtAuthenticationFilter(), 
                             UsernamePasswordAuthenticationFilter.class);
        
        return http.build();
    }
    
    @Bean
    public NextAuthSessionFilter nextAuthSessionFilter() {
        return new NextAuthSessionFilter(userRepository);
    }
}
```

---

## 📝 환경변수 설정

### 로컬 개발 (.env.local)

```bash
# 백엔드 API URL
NEXT_PUBLIC_API_URL=http://localhost:8080/api/v1

# Auth.js 설정
AUTH_SECRET=your-auth-secret
AUTH_GOOGLE_ID=your-google-client-id
AUTH_GOOGLE_SECRET=your-google-secret

# 데이터베이스 (Auth.js용)
DATABASE_URL=mysql://root:password@localhost:3306/accountbook
```

### Vercel 프로덕션

```bash
# 백엔드 API URL
NEXT_PUBLIC_API_URL=https://fos-accountbook-backend-production.up.railway.app/api/v1

# Auth.js 설정
AUTH_SECRET=production-secret
AUTH_GOOGLE_ID=prod-google-client-id
AUTH_GOOGLE_SECRET=prod-google-secret

# 데이터베이스 (Railway MySQL Public URL)
DATABASE_URL=mysql://root:pass@monorail.proxy.rlwy.net:12345/railway
```

---

## 🧪 테스트

### 1. 로컬 테스트

1. 백엔드 시작:
```bash
cd fos-accountbook-backend
./gradlew bootRun
```

2. 프론트엔드 시작:
```bash
cd fos-accountbook
pnpm dev
```

3. 브라우저에서 테스트:
   - http://localhost:3000
   - Google 로그인
   - 가족 생성 시도
   - 브라우저 개발자 도구 → Network 탭에서 API 호출 확인

### 2. 에러 확인

**401 Unauthorized**:
- NextAuth 세션이 없거나 만료됨
- 백엔드에서 세션 검증 실패

**403 Forbidden**:
- 권한 부족

**CORS 오류**:
- 백엔드 CORS 설정에 프론트엔드 URL 추가 필요

---

## 🔗 관련 문서

- [NextAuth.js v5 문서](https://authjs.dev/)
- [Spring Security 문서](https://spring.io/projects/spring-security)
- [Vercel 배포 가이드](./deploy/vercel.md)
- [Railway 배포 가이드](../fos-accountbook-backend/docs/deploy/railway.md)

---

**마지막 업데이트**: 2025-10-10  
**작성자**: FOS Accountbook Team

