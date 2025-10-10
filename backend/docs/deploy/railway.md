# Railway 배포 가이드

이 문서는 Spring Boot 백엔드를 Railway에 배포하는 완전한 가이드입니다.

## 📋 목차

- [빠른 시작](#-빠른-시작)
- [환경변수 설정](#-환경변수-설정)
- [프로젝트 구성 파일](#-프로젝트-구성-파일)
- [배포 과정](#-배포-과정)
- [트러블슈팅](#-트러블슈팅)
- [모니터링 및 관리](#-모니터링-및-관리)
- [비용 및 리소스](#-비용-및-리소스)

---

## 🚀 빠른 시작

### 1단계: Railway 프로젝트 생성

1. [Railway](https://railway.app) 접속
2. GitHub으로 로그인
3. **"New Project"** 클릭

### 2단계: MySQL 데이터베이스 추가

1. **"New"** → **"Database"** → **"Add MySQL"** 선택
2. MySQL 서비스 자동 생성 완료
3. **Private Networking** 자동 활성화 확인

### 3단계: Spring Boot 앱 배포

1. **"New"** → **"GitHub Repo"** → 레포지터리 선택
2. Railway가 `Dockerfile` 자동 감지
3. 빌드 자동 시작

### 4단계: 환경변수 설정

Spring Boot 앱 → **Variables** 탭에서 다음 변수 추가:

```bash
# 필수 환경변수
JWT_SECRET=your-256bit-secret-key-here
SPRING_PROFILES_ACTIVE=prod

# 선택 환경변수 (기본값 있음)
JWT_EXPIRATION=86400000              # 24시간
JWT_REFRESH_EXPIRATION=604800000    # 7일
SWAGGER_ENABLED=false                # 프로덕션에서는 비활성화
```

**⚠️ MySQL 변수는 Railway가 자동으로 주입하므로 수동 설정 불필요!**

### 5단계: 서비스 연결

1. Spring Boot 앱 → **Settings** 탭
2. **"Connect to a service"** → MySQL 선택
3. 자동으로 환경변수 주입 및 재배포

### 6단계: 도메인 생성

1. **Settings** → **Networking**
2. **"Generate Domain"** 클릭
3. `https://your-app.railway.app` URL 획득

### 7단계: 배포 확인

```bash
# Health Check 테스트
curl https://your-app.railway.app/api/v1/health

# 예상 응답
{"status":"UP"}
```

---

## 🔑 환경변수 설정

### Railway MySQL 자동 주입 변수 (설정 불필요 ✅)

Railway가 MySQL 서비스를 연결하면 **자동으로 주입**되는 변수:

| 변수명 | 설명 | 값 예시 |
|--------|------|---------|
| `MYSQLHOST` | MySQL 호스트 | `mysql.railway.internal` |
| `MYSQLPORT` | MySQL 포트 | `3306` |
| `MYSQLDATABASE` | 데이터베이스명 | `railway` |
| `MYSQLUSER` | DB 사용자명 | `root` |
| `MYSQLPASSWORD` | DB 비밀번호 | 자동 생성 |

**⚠️ 중요**:
- Railway는 **언더스코어 없이** 변수를 주입합니다 (예: `MYSQLHOST`, not `MYSQL_HOST`)
- `application-prod.yml`에서 이 변수들을 읽어 JDBC URL을 자동 구성합니다

### 수동 설정 필요 변수 (직접 추가 ⚙️)

| 변수명 | 필수 여부 | 설명 | 예시 |
|--------|----------|------|------|
| `JWT_SECRET` | ✅ **필수** | JWT 서명 키 (256bit+) | `openssl rand -base64 64`로 생성 |
| `SPRING_PROFILES_ACTIVE` | ✅ **필수** | Spring Profile | `prod` |
| `JWT_EXPIRATION` | ⚪ 선택 | Access Token 만료 시간 (밀리초) | `86400000` (24시간) |
| `JWT_REFRESH_EXPIRATION` | ⚪ 선택 | Refresh Token 만료 시간 (밀리초) | `604800000` (7일) |
| `SWAGGER_ENABLED` | ⚪ 선택 | Swagger UI 활성화 | `false` (프로덕션 권장) |

### JWT_SECRET 생성 방법

```bash
# OpenSSL 사용
openssl rand -base64 64 | tr -d '\n'

# 생성 예시
pYM7yRFQGhtweUwSXOe7Jfp+Wqmrq0Nn6ibMx2tTg77jG4NKMkCgScMRD/NOAc4fWZPZepyi9ivu6DYPJGUl+Q==
```

---

## 📁 프로젝트 구성 파일

Railway 배포를 위해 필요한 파일들:

### 1. `Dockerfile`

```dockerfile
# Multi-stage build for optimized image
FROM gradle:8.14-jdk21-alpine AS build
WORKDIR /app
COPY . .
RUN gradle clean build -x test --no-daemon

FROM eclipse-temurin:21-jre-alpine
WORKDIR /app
COPY --from=build /app/build/libs/*.jar app.jar
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]
```

### 2. `railway.json`

```json
{
  "$schema": "https://railway.app/railway.schema.json",
  "build": {
    "builder": "DOCKERFILE",
    "dockerfilePath": "Dockerfile"
  },
  "deploy": {
    "healthcheckPath": "/api/v1/health",
    "healthcheckTimeout": 100,
    "restartPolicyType": "ON_FAILURE"
  }
}
```

### 3. `.dockerignore`

```
# Git
.git/
.gitignore

# Gradle
.gradle/
build/
!gradle/wrapper/gradle-wrapper.properties
gradle-wrapper.jar
gradlew
gradlew.bat

# IDE
.idea/
*.iml
*.iws
.vscode/

# Logs
logs/
*.log

# OS
.DS_Store
Thumbs.db

# Docs
docs/
*.md
```

### 4. `application-prod.yml`

```yaml
spring:
  datasource:
    url: jdbc:mysql://${MYSQLHOST}:${MYSQLPORT}/${MYSQLDATABASE}?useSSL=false&serverTimezone=Asia/Seoul&characterEncoding=UTF-8&allowPublicKeyRetrieval=true
    username: ${MYSQLUSER}
    password: ${MYSQLPASSWORD}
    driver-class-name: com.mysql.cj.jdbc.Driver
    
    hikari:
      maximum-pool-size: 10
      minimum-idle: 2
      connection-timeout: 30000
      idle-timeout: 600000
      max-lifetime: 1800000
      connection-test-query: SELECT 1

  jpa:
    hibernate:
      ddl-auto: validate
    properties:
      hibernate:
        format_sql: false
        show_sql: false

  flyway:
    enabled: true
    clean-disabled: true

springdoc:
  api-docs:
    enabled: ${SWAGGER_ENABLED:false}
  swagger-ui:
    enabled: ${SWAGGER_ENABLED:false}
```

---

## 🚀 배포 과정

### 단계별 체크리스트

#### 배포 전 준비

- [ ] GitHub에 코드 푸시
- [ ] `Dockerfile`, `railway.json`, `.dockerignore` 파일 확인
- [ ] JWT_SECRET 생성 (256bit 이상)
- [ ] 로컬에서 빌드 테스트: `./gradlew clean build`

#### Railway 설정

- [ ] Railway 프로젝트 생성
- [ ] MySQL 데이터베이스 추가
- [ ] Spring Boot 앱 연결 (GitHub Repo)
- [ ] 환경변수 설정 (`JWT_SECRET`, `SPRING_PROFILES_ACTIVE=prod`)
- [ ] MySQL 서비스 연결 (Settings → Connect to a service)
- [ ] Private Networking 활성화 확인

#### 배포 후 확인

- [ ] 빌드 로그 확인 (빌드 성공 여부)
- [ ] 앱 시작 로그 확인 ("DATABASE CONFIGURATION" 섹션)
- [ ] HikariCP 연결 확인 ("HikariPool-1 - Start completed")
- [ ] Flyway 마이그레이션 확인
- [ ] Health Check 테스트: `curl https://your-app.railway.app/api/v1/health`
- [ ] Swagger UI 확인 (필요 시): `https://your-app.railway.app/api/v1/swagger-ui.html`

#### 프론트엔드 연동

- [ ] Railway 앱 URL을 프론트엔드 환경변수에 추가
- [ ] CORS 설정 확인 (SecurityConfig.java)
- [ ] Auth.js에 백엔드 URL 설정
- [ ] 로그인 테스트

---

## 🐛 트러블슈팅

### 1. 데이터베이스 연결 실패

**에러**: `The last packet sent successfully to the server was 0 milliseconds ago`

#### 원인 및 해결

**A. MySQL 변수 자동 주입 확인**

```bash
# Spring Boot 앱 → Variables 탭 확인
# 다음 변수들이 있어야 함:
MYSQLHOST=mysql.railway.internal
MYSQLPORT=3306
MYSQLDATABASE=railway
MYSQLUSER=root
MYSQLPASSWORD=***
```

**해결**: 변수가 없다면
1. Settings → "Connect to a service" → MySQL 선택
2. 자동으로 환경변수 주입 및 재배포

**B. Private Networking 확인**

```bash
Railway 대시보드 → Settings → Networking
```

**해결**: Private Networking이 비활성화되어 있다면
1. "Enable Private Networking" 클릭
2. MySQL과 Spring Boot 앱 모두 재배포

**C. 서비스 시작 순서**

**해결**:
1. MySQL 서비스 재시작
2. 30초 대기 (MySQL 완전 시작)
3. Spring Boot 앱 재배포

**D. 디버그 로그 확인**

```bash
Railway 대시보드 → Spring Boot 앱 → Logs 탭
```

찾아볼 내용:
```
=================================================
DATABASE CONFIGURATION (Railway Debug)
=================================================
Active Profile: prod
MYSQLHOST: mysql.railway.internal
MYSQLPORT: 3306
MYSQLDATABASE: railway
MYSQLUSER: root
MYSQLPASSWORD: ***SET***
Computed Datasource URL: jdbc:mysql://mysql.railway.internal:3306/railway?...
=================================================
```

### 2. JDBC URL 형식 오류

**에러**: `Driver claims to not accept jdbcUrl, mysql://...`

**원인**: Railway의 `MYSQL_URL`은 `mysql://` 프로토콜이지만 JDBC는 `jdbc:mysql://` 필요

**해결**: ✅ 이미 해결됨!
- `application-prod.yml`이 JDBC URL을 올바르게 구성합니다
- Railway 변수 (`MYSQLHOST`, `MYSQLPORT` 등)를 사용하여 자동 구성

### 3. 로그 파일 오류

**에러**: `FileNotFoundException: logs/application.log`

**원인**: Railway 컨테이너 환경은 파일 시스템이 임시(ephemeral)

**해결**: `SPRING_PROFILES_ACTIVE=prod` 설정 확인
- `prod` 프로파일은 **콘솔 로깅만** 사용
- Railway가 자동으로 로그 수집 및 표시

### 4. Gradle 빌드 오류

**에러**: `Could not find or load main class org.gradle.wrapper.GradleWrapperMain`

**해결**: ✅ 이미 해결됨!
- Dockerfile이 `gradle:8.14-jdk21-alpine` 이미지 사용
- `gradle` 명령어로 직접 빌드 (wrapper 불필요)

### 5. 메모리 부족 오류

**에러**: `OutOfMemoryError` 또는 빌드 중단

**해결**:
1. Railway 대시보드 → 앱 선택
2. **Settings** → **Resources**
3. 메모리 증가 (최소 2GB 권장)

### 6. Health Check 실패

**에러**: `Deployment failed: Health check timeout`

**해결**:
1. 로그에서 앱 시작 확인
2. PORT 환경변수 자동 주입 확인 (Railway가 자동 설정)
3. Health check path 확인: `/api/v1/health`
4. `railway.json`의 `healthcheckTimeout` 증가 (100초로 설정됨)

### 7. Flyway 마이그레이션 오류

**에러**: `FlywayException: Validate failed`

**해결**:
1. Railway MySQL → **Data** 탭에서 테이블 확인
2. Flyway 히스토리 조회:
   ```sql
   SELECT * FROM flyway_schema_history;
   ```
3. 필요 시 초기화 (⚠️ 주의: 데이터 손실):
   ```bash
   # application-prod.yml에서 일시적으로 설정
   clean-disabled: false
   # 재배포 후 다시 true로 변경
   ```

---

## 📊 모니터링 및 관리

### 로그 확인

#### Railway 대시보드

```bash
Railway 대시보드 → 앱 선택 → Logs 탭
```

실시간 로그 스트리밍 확인 가능

#### Railway CLI

```bash
# CLI 설치
npm i -g @railway/cli

# 로그인
railway login

# 프로젝트 연결
railway link

# 실시간 로그
railway logs --follow

# 최근 로그
railway logs --lines 100
```

### 환경변수 관리

```bash
# 모든 환경변수 확인
railway variables

# 특정 변수 확인
railway variables | grep JWT

# 환경변수 추가/수정 (대시보드 권장)
Railway 대시보드 → Variables 탭
```

### 데이터베이스 관리

#### Railway 대시보드

```bash
Railway 대시보드 → MySQL 서비스 → Data 탭
```

간단한 SQL 쿼리 실행 가능

#### MySQL 클라이언트 연결

```bash
# Railway CLI로 MySQL 접속
railway run --service mysql

# 또는 MySQL 클라이언트로 직접 연결
# Connection 정보는 MySQL Variables 탭에서 확인
```

### 배포 관리

#### 자동 배포

- GitHub main 브랜치에 푸시 시 자동 배포
- PR 환경: Preview 환경 자동 생성 (선택 가능)

#### 수동 배포

```bash
# Deployments 탭
1. "Redeploy" 버튼 클릭

# 또는 Git 커밋으로 트리거
git commit --allow-empty -m "Trigger redeploy"
git push origin main
```

#### 롤백

```bash
Railway 대시보드 → Deployments 탭
→ 이전 배포 선택
→ "Redeploy" 클릭
```

---

## 💰 비용 및 리소스

### 예상 비용

| 항목 | 예상 비용 |
|------|----------|
| **무료 크레딧** | $5/월 |
| MySQL (512MB) | ~$1-2/월 |
| Spring Boot (512MB-1GB) | ~$3-5/월 |
| **총 예상 비용** | ~$4-7/월 |

**💡 팁**: 무료 크레딧($5/월) 내에서 충분히 운영 가능

### 리소스 최적화

#### 권장 설정

- **MySQL**: 512MB RAM (소규모 앱에 충분)
- **Spring Boot**: 1GB RAM (권장)
- **HikariCP**: 최대 10개 커넥션

#### 비용 절감 팁

1. **Swagger 비활성화**: 프로덕션에서는 불필요
2. **로그 레벨 조정**: `prod` 프로파일은 INFO 레벨
3. **불필요한 서비스 중지**: 개발/테스트 환경 정리

---

## 📱 Railway CLI 가이드

### 설치

```bash
npm i -g @railway/cli

# 또는 brew (macOS)
brew install railway
```

### 기본 명령어

```bash
# 로그인
railway login

# 프로젝트 연결
railway link

# 현재 프로젝트 정보
railway status

# 로그 확인
railway logs
railway logs --follow
railway logs --deployment <id>

# 환경변수 확인
railway variables

# 로컬에서 Railway 환경으로 실행
railway run ./gradlew bootRun

# Railway 환경으로 MySQL 접속
railway run --service mysql
```

---

## 🔗 유용한 링크

- [Railway 대시보드](https://railway.app/dashboard)
- [Railway 공식 문서](https://docs.railway.app)
- [Railway MySQL 가이드](https://docs.railway.app/databases/mysql)
- [Railway 환경변수 가이드](https://docs.railway.app/develop/variables)
- [Railway Private Networking](https://docs.railway.app/reference/private-networking)
- [Railway CLI 가이드](https://docs.railway.app/develop/cli)

---

## 📞 지원 및 커뮤니티

### 문제 발생 시

1. **Railway 로그 확인**: 대부분의 문제는 로그에서 원인 파악 가능
2. **이 가이드의 트러블슈팅 섹션** 참조
3. **프로젝트 README.md** 의 상세 가이드
4. **Railway Discord**: 커뮤니티 지원
5. **GitHub Issues**: 프로젝트 관련 이슈

### Railway 지원

```bash
Railway 대시보드 → Help → Contact Support

제공할 정보:
- 프로젝트 ID
- MySQL 버전
- Spring Boot 앱 로그 (최근 100줄)
- MySQL 서비스 로그
- Variables 스크린샷
```

---

## ✅ 배포 완료!

축하합니다! 🎉 

이제 다음 URL에서 API를 사용할 수 있습니다:

- **Health Check**: `https://your-app.railway.app/api/v1/health`
- **Swagger UI** (개발용): `https://your-app.railway.app/api/v1/swagger-ui.html`
- **API 엔드포인트**: `https://your-app.railway.app/api/v1/*`

### 다음 단계

1. 프론트엔드에 백엔드 URL 설정
2. CORS 설정 확인
3. 실제 데이터로 테스트
4. 모니터링 설정
5. 백업 전략 수립

---

**마지막 업데이트**: 2025-10-10  
**작성자**: fos-accountbook Team

