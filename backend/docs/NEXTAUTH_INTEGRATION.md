# NextAuth (Auth.js v5) 세션 토큰 검증 가이드

## 🎯 개요

프론트엔드(Next.js + NextAuth v5)에서 생성된 세션 토큰을 백엔드(Spring Boot)에서 검증하여 인증을 처리합니다.

**핵심 포인트:**
- NextAuth는 **JWS**(서명된 JWT)를 생성 (암호화 X)
- 백엔드는 HS256 알고리즘으로 서명 검증
- 프론트엔드와 백엔드는 **동일한 `AUTH_SECRET`** 사용

## 📐 아키텍처

```
┌─────────────────┐        ┌──────────────────┐
│   Frontend      │        │     Backend      │
│  (Next.js)      │        │  (Spring Boot)   │
└────────┬────────┘        └────────┬─────────┘
         │                          │
         │ 1. Google OAuth Login    │
         ├─────────────────────────>│
         │                          │
         │ 2. NextAuth JWT (JWS)    │
         │    HS256 서명             │
         ├─────────────────────────>│
         │                          │
         │                  3. JWT 검증
         │                    (HS256)
         │                          │
         │ 4. 인증 성공              │
         │<─────────────────────────┤
         │                          │
```

## 🔧 구현 상세

### 1. 프론트엔드: NextAuth 설정

**파일:** `src/lib/server/auth/config.ts`

**핵심 변경사항:**
- NextAuth v5는 기본적으로 JWT를 **JWE**(암호화)로 생성
- 백엔드 호환성을 위해 **JWS**(서명만)로 변경
- `jose` 라이브러리를 사용한 커스텀 encode/decode

```typescript
import { SignJWT, jwtVerify } from "jose"

const AUTH_SECRET = process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET;
const encodedSecret = new TextEncoder().encode(AUTH_SECRET);

export const authConfig: NextAuthConfig = {
  jwt: {
    /**
     * 커스텀 JWT Encode: 암호화 없이 서명만 사용
     * 
     * HS256 알고리즘으로 JWT 생성 (JWS)
     * 백엔드에서 표준 JWT 라이브러리로 검증 가능
     */
    async encode({ token, secret }) {
      if (!token) {
        throw new Error("Token is required");
      }
      
      // HS256 알고리즘으로 JWT 생성 (암호화 없이 서명만)
      return await new SignJWT(token)
        .setProtectedHeader({ alg: "HS256" })
        .setIssuedAt()
        .setExpirationTime("30d") // 30일 만료
        .sign(encodedSecret);
    },
    /**
     * 커스텀 JWT Decode: 서명 검증 후 페이로드 반환
     */
    async decode({ token, secret }) {
      if (!token) {
        return null;
      }
      
      try {
        const { payload } = await jwtVerify(token, encodedSecret, {
          algorithms: ["HS256"],
        });
        return payload;
      } catch (error) {
        console.error("JWT decode error:", error);
        return null;
      }
    },
  },
  // ... 나머지 설정
}
```

### 2. 백엔드: JWT 검증

#### 2.1 추상 클래스: AbstractJwtTokenProvider

**파일:** `src/main/java/com/bifos/accountbook/infra/security/AbstractJwtTokenProvider.java`

JWT 토큰 검증 및 클레임 추출의 공통 로직을 제공합니다.

```java
public abstract class AbstractJwtTokenProvider {
    protected abstract SecretKey getSigningKey();
    
    protected SecretKey createSigningKey(String secretKeyString) {
        return Keys.hmacShaKeyFor(secretKeyString.getBytes(StandardCharsets.UTF_8));
    }
    
    protected Claims getClaimsFromToken(String token) {
        try {
            return Jwts.parser()
                    .verifyWith(getSigningKey())
                    .build()
                    .parseSignedClaims(token)
                    .getPayload();
        } catch (Exception e) {
            log.debug("JWT token validation error: {}", e.getMessage());
            return null;
        }
    }
    
    public boolean validateToken(String token) {
        return getClaimsFromToken(token) != null;
    }
    
    public String getUserIdFromToken(String token) {
        Claims claims = getClaimsFromToken(token);
        return claims != null ? claims.getSubject() : null;
    }
}
```

#### 2.2 NextAuth 토큰 프로바이더

**파일:** `src/main/java/com/bifos/accountbook/infra/security/NextAuthTokenProvider.java`

```java
@Component
public class NextAuthTokenProvider extends AbstractJwtTokenProvider {
    
    @Value("${nextauth.secret}")
    private String nextAuthSecret;
    
    @Override
    protected SecretKey getSigningKey() {
        return createSigningKey(nextAuthSecret);
    }
}
```

**설명:**
- `AbstractJwtTokenProvider`를 상속하여 공통 로직 재사용
- `AUTH_SECRET` 환경변수로 서명 키 주입
- HS256 알고리즘으로 JWT 서명 검증

#### 2.3 NextAuth 토큰 필터

**파일:** `src/main/java/com/bifos/accountbook/infra/security/NextAuthTokenFilter.java`

```java
@Component
@RequiredArgsConstructor
public class NextAuthTokenFilter extends OncePerRequestFilter {
    
    private final UserRepository userRepository;
    private final NextAuthTokenProvider nextAuthTokenProvider;
    
    @Override
    protected void doFilterInternal(
            HttpServletRequest request,
            HttpServletResponse response,
            FilterChain filterChain
    ) throws ServletException, IOException {
        
        try {
            // 1. NextAuth 세션 토큰 추출
            String token = extractTokenFromRequest(request);
            
            if (token != null && nextAuthTokenProvider.validateToken(token)) {
                // 2. 토큰에서 사용자 이메일 추출
                String userEmail = nextAuthTokenProvider.getEmailFromToken(token);
                
                if (userEmail != null && SecurityContextHolder.getContext().getAuthentication() == null) {
                    // 3. 사용자 조회
                    User user = userRepository.findByEmail(userEmail)
                            .orElse(null);
                    
                    if (user != null) {
                        // 4. Spring Security Authentication 설정
                        UsernamePasswordAuthenticationToken authentication =
                                new UsernamePasswordAuthenticationToken(
                                        user.getId(),
                                        null,
                                        Collections.emptyList()
                                );
                        authentication.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
                        SecurityContextHolder.getContext().setAuthentication(authentication);
                        
                        log.debug("NextAuth 세션 검증 성공: user={}", userEmail);
                    }
                }
            }
        } catch (Exception e) {
            log.debug("NextAuth 토큰 검증 실패: {}", e.getMessage());
        }
        
        filterChain.doFilter(request, response);
    }
    
    /**
     * Request에서 NextAuth 세션 토큰 추출
     * 
     * 순서:
     * 1. Authorization 헤더 (Bearer Token)
     * 2. __Secure-authjs.session-token 쿠키 (HTTPS, Auth.js v5)
     * 3. authjs.session-token 쿠키 (HTTP, Auth.js v5)
     * 4. __Secure-next-auth.session-token 쿠키 (하위 호환)
     * 5. next-auth.session-token 쿠키 (하위 호환)
     */
    private String extractTokenFromRequest(HttpServletRequest request) {
        // 1. Authorization 헤더
        String bearerToken = request.getHeader("Authorization");
        if (bearerToken != null && bearerToken.startsWith("Bearer ")) {
            return bearerToken.substring(7);
        }
        
        // 2. 쿠키
        Cookie[] cookies = request.getCookies();
        if (cookies != null) {
            for (Cookie cookie : cookies) {
                // Auth.js v5 (NextAuth v5)
                if ("__Secure-authjs.session-token".equals(cookie.getName()) ||
                    "authjs.session-token".equals(cookie.getName())) {
                    return cookie.getValue();
                }
                
                // 하위 호환: NextAuth v4
                if ("__Secure-next-auth.session-token".equals(cookie.getName()) ||
                    "next-auth.session-token".equals(cookie.getName())) {
                    return cookie.getValue();
                }
            }
        }
        
        return null;
    }
}
```

#### 2.4 Security 설정

**파일:** `src/main/java/com/bifos/accountbook/infra/config/SecurityConfig.java`

```java
@Configuration
@EnableWebSecurity
@RequiredArgsConstructor
public class SecurityConfig {
    
    private final JwtAuthenticationFilter jwtAuthenticationFilter;
    private final NextAuthTokenFilter nextAuthTokenFilter;
    
    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
            // ...
            
            // NextAuth 세션 필터 추가 (JWT 필터보다 먼저 실행)
            .addFilterBefore(nextAuthTokenFilter, UsernamePasswordAuthenticationFilter.class)
            // JWT 필터 추가
            .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class);
        
        return http.build();
    }
}
```

## 🔐 환경 변수 설정

### 프론트엔드 (`.env.local`)

```bash
# JWT + NextAuth 공통 비밀키 (256bit 이상)
AUTH_SECRET="your-256bit-secret-key-here"

# 또는 (레거시 호환)
NEXTAUTH_SECRET="your-256bit-secret-key-here"

# Google OAuth
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"

# NextAuth URL
NEXTAUTH_URL="http://localhost:3000"

# 백엔드 API URL
NEXT_PUBLIC_API_URL="http://localhost:8080/api/v1"
BACKEND_API_URL="http://localhost:8080/api/v1"
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

### AUTH_SECRET 생성 방법 🔑

**✅ 권장**: NextAuth CLI 사용
```bash
npx auth secret
```

**대안**: OpenSSL 사용
```bash
openssl rand -base64 64 | tr -d '\n'
```

**생성 예시**:
```
pYM7yRFQGhtweUwSXOe7Jfp+Wqmrq0Nn6ibMx2tTg77jG4NKMkCgScMRD/NOAc4fWZPZepyi9ivu6DYPJGUl+Q==
```

## 🔄 인증 흐름

### 1. 로그인 흐름

```
1. 사용자가 Google OAuth로 로그인
   ↓
2. NextAuth가 User 정보를 MySQL에 저장
   ↓
3. NextAuth가 JWT 세션 토큰 생성 (JWS, HS256)
   {
     "name": "홍길동",
     "email": "user@example.com",
     "picture": "https://...",
     "sub": "user-id",
     "iat": 1234567890,
     "exp": 1234567890
   }
   ↓
4. 토큰을 쿠키에 저장
   - __Secure-authjs.session-token (HTTPS, Auth.js v5)
   - authjs.session-token (HTTP, Auth.js v5)
```

### 2. API 요청 흐름

```
1. 프론트엔드에서 API 요청
   Authorization: Bearer <NextAuth-JWT-Token>
   ↓
2. NextAuthTokenFilter가 토큰 추출
   ↓
3. NextAuthTokenProvider가 JWT 검증
   - HS256 알고리즘으로 서명 검증
   - AUTH_SECRET으로 검증
   ↓
4. 토큰에서 사용자 이메일 추출
   ↓
5. DB에서 사용자 조회
   ↓
6. Spring Security Authentication 설정
   ↓
7. Controller에서 @AuthenticationPrincipal로 사용자 정보 접근
```

## 🚨 문제 해결

### 문제 1: "Unsupported JWT token: Cannot decrypt JWE payload"

**원인:** NextAuth가 JWT를 암호화(JWE)하여 생성

**해결:**
1. NextAuth 설정에서 커스텀 `encode`/`decode` 함수 추가
2. `jose` 라이브러리를 사용하여 JWS(서명만) 생성

```typescript
// ✅ 올바른 방법
import { SignJWT, jwtVerify } from "jose"

jwt: {
  async encode({ token }) {
    return await new SignJWT(token)
      .setProtectedHeader({ alg: "HS256" })
      .setIssuedAt()
      .setExpirationTime("30d")
      .sign(encodedSecret);
  },
  async decode({ token }) {
    const { payload } = await jwtVerify(token, encodedSecret);
    return payload;
  }
}
```

### 문제 2: "JWT signature does not match"

**원인:** 프론트엔드와 백엔드의 `AUTH_SECRET`이 다름

**해결:**
1. 프론트엔드 `.env.local`의 `AUTH_SECRET` 확인
2. 백엔드 Railway의 `AUTH_SECRET` 환경변수 확인
3. **동일한 값**인지 확인!

### 문제 3: Token이 추출되지 않음

**원인:** 쿠키명이 다르거나 Authorization 헤더가 없음

**해결:**
```java
// NextAuthTokenFilter에서 토큰 추출 순서:
1. Authorization: Bearer <token>
2. __Secure-authjs.session-token 쿠키 (HTTPS, Auth.js v5)
3. authjs.session-token 쿠키 (HTTP, Auth.js v5)
4. __Secure-next-auth.session-token 쿠키 (하위 호환)
5. next-auth.session-token 쿠키 (하위 호환)
```

## 📊 JWT 토큰 구조

### NextAuth JWT (JWS) 예시

**Header:**
```json
{
  "alg": "HS256",
  "typ": "JWT"
}
```

**Payload:**
```json
{
  "name": "홍길동",
  "email": "user@example.com",
  "picture": "https://lh3.googleusercontent.com/...",
  "sub": "cm6a1b2c3d4e5f6g7h8i9j0k",
  "iat": 1234567890,
  "exp": 1237159890,
  "jti": "unique-jwt-id"
}
```

**Signature:**
```
HMACSHA256(
  base64UrlEncode(header) + "." +
  base64UrlEncode(payload),
  AUTH_SECRET
)
```

## 🎨 리팩토링 효과

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

## 🔗 관련 문서

- [NextAuth v5 공식 문서](https://authjs.dev/)
- [JWT 표준 (RFC 7519)](https://tools.ietf.org/html/rfc7519)
- [JJWT 라이브러리](https://github.com/jwtk/jjwt)
- [Spring Security](https://spring.io/projects/spring-security)

## ✅ 체크리스트

배포 전 확인사항:

- [ ] 프론트엔드 `.env.local`에 `AUTH_SECRET` 설정
- [ ] 백엔드 Railway에 `AUTH_SECRET` 환경변수 설정
- [ ] 프론트엔드와 백엔드의 `AUTH_SECRET`이 동일한지 확인
- [ ] NextAuth JWT 커스텀 encode/decode 설정 완료
- [ ] 백엔드 Security 설정에 NextAuthTokenFilter 추가
- [ ] CORS 설정에 프론트엔드 도메인 추가
- [ ] 로컬 및 프로덕션 환경에서 로그인 테스트
- [ ] API 요청 시 JWT 토큰이 제대로 전달되는지 확인
