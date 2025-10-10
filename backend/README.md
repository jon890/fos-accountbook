# FOS Accountbook Backend

Spring Boot 3.5 + Java 21 기반 가계부 애플리케이션 백엔드 API

## 🛠 기술 스택

- **Framework**: Spring Boot 3.5.0
- **Language**: Java 21
- **Database**: MySQL 8.0+
- **ORM**: Spring Data JPA (Hibernate)
- **Migration**: Flyway
- **Security**: Spring Security + JWT
- **API Documentation**: Swagger/OpenAPI 3.0 (springdoc-openapi 2.7.0)
- **Build Tool**: Gradle 8.x

## 📋 주요 기능

- JWT 기반 인증/인가
- RESTful API
- 가족 단위 지출 관리
- 카테고리별 지출 추적
- 초대 시스템
- Swagger UI를 통한 API 문서 자동화
- Flyway를 통한 DB 마이그레이션 관리

## 🚀 시작하기

### 사전 요구사항

- Java 21 이상
- MySQL 8.0 이상
- Gradle 8.x (또는 wrapper 사용)

### 환경 설정

#### 로컬 개발 환경 (Docker Compose 사용)

1. Docker Compose로 MySQL 시작:

```bash
# MySQL 컨테이너 시작
docker compose up -d

# 로그 확인
docker compose logs -f mysql

# 상태 확인
docker compose ps
```

3. MySQL 접속 확인:

```bash
# Docker 컨테이너 내부에서 MySQL 접속
docker compose exec mysql mysql -u accountbook_user -paccountbook_password accountbook

# 또는 로컬 mysql 클라이언트로 접속
mysql -h localhost -P 3306 -u accountbook_user -paccountbook_password accountbook
```

**로컬 개발 설정**
- 데이터베이스: `accountbook`
- 사용자: `accountbook_user`
- 비밀번호: `accountbook_password`
- 포트: `3306`

이 설정은 `src/main/resources/application-local.yml`에 정의되어 있으며 Git에 포함되어 있습니다.

4. Docker Compose 관리:

```bash
# 컨테이너 중지
docker compose stop

# 컨테이너 시작
docker compose start

# 컨테이너 재시작
docker compose restart

# 컨테이너 중지 및 삭제
docker compose down

# 컨테이너 및 볼륨 모두 삭제 (데이터 삭제 주의!)
docker compose down -v
```

#### 프로덕션 환경

프로덕션 환경에서는 환경변수로 설정을 주입해야 합니다:

```bash
export DATABASE_URL="jdbc:mysql://your-db-host:3306/accountbook?useSSL=true&serverTimezone=UTC"
export DB_USERNAME=your_username
export DB_PASSWORD=your_password
export JWT_SECRET=your-production-secret-key-at-least-256-bits
export JWT_EXPIRATION=86400000
export JWT_REFRESH_EXPIRATION=604800000
```

### 실행 방법

#### 1. MySQL 시작 (Docker Compose)

```bash
# MySQL 컨테이너 시작
docker compose up -d

# MySQL 상태 확인
docker compose ps

# 로그 확인
docker compose logs -f mysql
```

#### 2. IntelliJ IDEA에서 실행 (권장) 🚀

**Run Configuration 설정:**
1. IntelliJ에서 `src/main/java/com/bifos/accountbook/Application.java` 파일 열기
2. 클래스 옆의 ▶ 버튼 클릭 → "Modify Run Configuration..."
3. **Active profiles** 필드에 `local` 입력
4. (선택사항) **VM options**에 `-Dspring.profiles.active=local` 추가
5. **Apply** → **OK**
6. ▶ 버튼으로 실행 또는 Shift+F10

**디버그 모드로 실행:**
- 🐞 버튼 클릭 또는 Shift+F9
- 브레이크포인트 설정하여 디버깅 가능

**환경 변수로 설정 (대안):**
- Run Configuration → Environment variables
- `SPRING_PROFILES_ACTIVE=local` 추가

**💡 IntelliJ 팁:**
- `Ctrl+Shift+F10` (Mac: `Cmd+Shift+R`): 현재 파일 실행
- 하단의 "Services" 탭에서 Spring Boot 애플리케이션 상태 확인 가능
- 로그 출력이 자동으로 하단 콘솔에 표시됨

#### 3. Gradle로 실행 (대안)

```bash
# 방법 1: 명령줄 인자 사용
./gradlew bootRun --args='--spring.profiles.active=local'

# 방법 2: 환경변수 사용
export SPRING_PROFILES_ACTIVE=local
./gradlew bootRun
```

#### 빌드 후 실행

```bash
# 빌드
./gradlew build

# 로컬 프로파일로 실행
java -jar build/libs/fos-accountbook-backend-1.0-SNAPSHOT.jar --spring.profiles.active=local

# 프로덕션 실행 (환경변수 필요)
java -jar build/libs/fos-accountbook-backend-1.0-SNAPSHOT.jar
```

애플리케이션은 기본적으로 `http://localhost:8080/api/v1`에서 실행됩니다.

### 헬스체크

```bash
curl http://localhost:8080/api/v1/health
```

## 🗄️ 데이터베이스 마이그레이션

### Flyway 마이그레이션 관리

이 프로젝트는 **Flyway**를 사용하여 데이터베이스 스키마를 버전 관리합니다.

#### 마이그레이션 파일 위치
```
src/main/resources/db/migration/
├── V1__init.sql           # 초기 스키마 (모든 테이블)
├── V2__add_xxx.sql        # 추가 마이그레이션 (향후)
└── V3__modify_yyy.sql     # 스키마 변경 (향후)
```

#### 명명 규칙
- **버전 기반**: `V{version}__{description}.sql`
  - 예: `V1__init.sql`, `V2__add_budget_table.sql`
- **언더스코어 2개** 필수: `__` (version과 description 구분자)
- **버전 번호**: 정수 (1, 2, 3, ...) 또는 점 표기법 (1.1, 1.2, ...)

#### 자동 실행
- 애플리케이션 시작 시 Flyway가 **자동으로 마이그레이션 실행**
- 이미 적용된 마이그레이션은 건너뜀 (flyway_schema_history 테이블로 추적)
- JPA `ddl-auto: validate`로 설정되어 있어 Flyway만 스키마 변경 가능

#### 새 마이그레이션 추가 방법

1. **마이그레이션 파일 생성**
   ```bash
   # 예: 예산(budget) 테이블 추가
   touch src/main/resources/db/migration/V2__add_budget_table.sql
   ```

2. **SQL 작성**
   ```sql
   -- V2__add_budget_table.sql
   CREATE TABLE IF NOT EXISTS `budgets` (
       `id` BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
       `uuid` BINARY(16) NOT NULL UNIQUE,
       `familyUuid` BINARY(16) NOT NULL,
       `amount` DECIMAL(15, 2) NOT NULL,
       `month` DATE NOT NULL,
       `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
       CONSTRAINT `fk_budgets_family` FOREIGN KEY (`familyUuid`) 
           REFERENCES `families`(`uuid`) ON DELETE CASCADE
   ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
   ```

3. **애플리케이션 재시작**
   - Flyway가 자동으로 새 마이그레이션 적용

#### 마이그레이션 상태 확인

**Flyway Schema History 테이블 조회:**
```sql
SELECT * FROM flyway_schema_history ORDER BY installed_rank;
```

**Spring Boot Actuator 사용 (프로덕션):**
```bash
curl http://localhost:8080/actuator/flyway
```

#### 로컬 개발 환경

**데이터베이스 초기화 (주의!):**
```bash
# Docker 볼륨 삭제 (모든 데이터 삭제)
docker compose down -v

# MySQL 재시작
docker compose up -d

# 애플리케이션 실행 시 Flyway가 자동으로 초기 스키마 생성
```

#### 프로덕션 배포

1. **마이그레이션 파일 검증**
   - 새로운 마이그레이션 파일 추가 시 로컬에서 먼저 테스트
   - Git에 커밋하여 버전 관리

2. **배포 시 자동 적용**
   - 애플리케이션 시작 시 Flyway가 자동 실행
   - `baseline-on-migrate: true` 설정으로 기존 DB도 안전하게 마이그레이션

3. **롤백**
   - Flyway는 자동 롤백을 지원하지 않음
   - 롤백이 필요한 경우 **수동으로 down 마이그레이션 작성**
   - 예: `V3__rollback_budget_table.sql`

#### ⚠️ 주의사항

- **마이그레이션 파일 수정 금지**: 한 번 적용된 마이그레이션은 수정하지 않음
- **새 마이그레이션 추가**: 변경사항은 항상 새 버전의 마이그레이션 파일로 추가
- **테스트 필수**: 프로덕션 배포 전 로컬/스테이징에서 충분히 테스트
- **백업**: 프로덕션 DB 마이그레이션 전 반드시 백업

### 📚 API 문서 (Swagger UI)

애플리케이션 실행 후 Swagger UI를 통해 모든 API를 테스트하고 문서를 확인할 수 있습니다.

**로컬 개발 환경:**
- Swagger UI: http://localhost:8080/api/v1/swagger-ui.html
- OpenAPI JSON: http://localhost:8080/api/v1/v3/api-docs

**사용 방법:**
1. 애플리케이션을 local 프로파일로 실행
2. 브라우저에서 http://localhost:8080/api/v1/swagger-ui.html 접속
3. 인증이 필요한 API 테스트:
   - `/auth/login` 또는 `/auth/register`로 로그인
   - 응답에서 `accessToken` 복사
   - 우측 상단 **Authorize** 버튼 클릭
   - `Bearer {accessToken}` 형식으로 입력 (Bearer는 자동 추가됨)
   - 인증 후 모든 API 테스트 가능

**프로덕션 환경:**
- 보안을 위해 Swagger UI는 기본적으로 비활성화됩니다
- 활성화하려면 환경변수 설정: `SWAGGER_ENABLED=true`

**참고:** Swagger UI를 통해 실시간으로 최신 API 문서를 확인할 수 있습니다.

## 📁 프로젝트 구조 (레이어드 아키텍처)

```
src/main/
├── java/com/bifos/accountbook/
│   ├── Application.java                # 메인 클래스
│   │
│   ├── presentation/                   # 프레젠테이션 레이어
│   │   └── controller/                # REST API 컨트롤러
│   │
│   ├── application/                    # 애플리케이션 레이어
│   │   ├── service/                   # 비즈니스 로직
│   │   └── dto/                       # 데이터 전송 객체
│   │
│   ├── domain/                         # 도메인 레이어
│   │   ├── entity/                    # JPA 엔티티
│   │   └── repository/                # Repository 인터페이스
│   │
│   └── infra/                          # 인프라 레이어
│       ├── config/                    # 설정 (Security 등)
│       ├── security/                  # JWT 인증/인가
│       └── exception/                 # 전역 예외 처리
│
├── resources/
│   ├── application.yml                 # 기본 설정 (프로덕션)
│   ├── application-local.yml           # 로컬 개발 설정
│   └── logback-spring.xml             # 로그 설정
│
└── logs/                               # 로그 파일
    ├── application.log                # 전체 로그
    └── application-error.log          # 에러 로그
```

### 레이어드 아키텍처

이 프로젝트는 **레이어드 아키텍처** 패턴을 따릅니다:

- **Presentation Layer**: REST API 엔드포인트 (Controller)
- **Application Layer**: 비즈니스 로직 (Service, DTO)
- **Domain Layer**: 도메인 모델 (Entity, Repository)
- **Infrastructure Layer**: 기술적 구현 (Config, Security, Exception)

### Spring Profiles

**local (로컬 개발)** - `application-local.yml`
- MySQL: localhost:3306
- 사용자: accountbook_user / accountbook_password
- JPA ddl-auto: update (자동 테이블 생성/업데이트)
- Swagger UI: 활성화
- 디버그 로깅: 활성화

**default (프로덕션)** - `application.yml`
- 환경변수 기반 설정 (DATABASE_URL, JWT_SECRET 등)
- JPA ddl-auto: validate (테이블 검증만)
- Swagger UI: 비활성화 (SWAGGER_ENABLED=true로 활성화 가능)
- INFO 레벨 로깅
```

## 🔧 주요 설정

### API Endpoints

- Base URL: `/api/v1`
- Health Check: `/api/v1/health`
- Auth: `/api/v1/auth/**` (예정)
- Families: `/api/v1/families/**` (예정)
- Expenses: `/api/v1/expenses/**` (예정)

### 인증

JWT Bearer Token 방식:

```
Authorization: Bearer <token>
```

### CORS

다음 Origin에서의 요청을 허용합니다:
- `http://localhost:3000` (Next.js 개발 서버)
- `http://localhost:3001`

### 로깅 (Logback)

로깅 설정은 **Logback**으로 관리됩니다.

#### 설정 파일

**프로덕션/로컬 환경:**
- `src/main/resources/logback-spring.xml`
- Spring Profile별 로깅 레벨 자동 설정
- 로그 파일: `logs/application.log`, `logs/application-error.log`

**테스트 환경:**
- `src/test/resources/logback-test.xml`
- 콘솔 출력만 사용
- H2 in-memory DB에 최적화

#### Profile별 로깅 레벨

**Local 프로파일** (`--spring.profiles.active=local`):
```
com.bifos.accountbook: DEBUG
org.springframework.web: DEBUG
org.springframework.security: DEBUG
```

**프로덕션** (기본):
```
com.bifos.accountbook: INFO
org.springframework.web: WARN
org.springframework.security: WARN
```

**테스트**:
```
com.bifos.accountbook: DEBUG
org.hibernate.SQL: DEBUG
org.hibernate.type.descriptor.sql.BasicBinder: TRACE
```

#### 로그 파일 관리

- **위치**: `logs/` 디렉토리
- **일일 로테이션**: 자동 (파일명: `application.YYYY-MM-DD.log`)
- **보관 기간**: 30일
- **최대 크기**: 1GB (전체)
- **에러 로그**: 별도 파일 (`application-error.log`)

#### 로그 파일 확인

```bash
# 최신 로그 확인
tail -f logs/application.log

# 에러 로그만 확인
tail -f logs/application-error.log

# 특정 날짜 로그 확인
cat logs/application.2025-01-10.log
```

#### 로깅 레벨 커스터마이징

`logback-spring.xml` 파일을 수정하여 원하는 로거의 레벨을 조정할 수 있습니다:

```xml
<logger name="com.bifos.accountbook.application.service" level="TRACE"/>
<logger name="org.springframework.security" level="DEBUG"/>
```

**참고**: `application.yml` 파일의 `logging.level` 설정은 사용하지 않습니다. 모든 로깅은 Logback XML 파일에서 관리됩니다.

## 🗄️ 데이터베이스 스키마

주요 테이블:
- `users` - 사용자 정보
- `accounts` - OAuth 계정 정보
- `families` - 가족 그룹
- `family_members` - 가족 구성원
- `categories` - 지출 카테고리
- `expenses` - 지출 내역
- `invitations` - 초대장

모든 테이블은 `snake_case` 명명 규칙을 따르며, UUID 기반 관계를 사용합니다.

## 🧪 테스트

### 테스트 실행

```bash
# 전체 테스트 실행
./gradlew test

# 특정 테스트만 실행
./gradlew test --tests ApplicationContextTest
./gradlew test --tests BeanLoadingTest

# 테스트 결과 리포트 확인
open build/reports/tests/test/index.html
```

### 테스트 환경

- **데이터베이스**: H2 in-memory (테스트 전용)
- **Profile**: `test`
- **Flyway**: 비활성화 (JPA가 스키마 자동 생성)
- **JPA ddl-auto**: `create-drop`

테스트 환경 설정은 `src/test/resources/application-test.yml`에 정의되어 있습니다.

### 구현된 테스트

#### 1. ApplicationContextTest
Spring Application Context가 정상적으로 로드되는지 확인합니다.
- Bean 설정 오류 검증
- 의존성 주입 오류 검증
- 설정 파일 오류 검증

#### 2. BeanLoadingTest
모든 주요 Bean들이 정상적으로 생성되고 의존성 주입이 올바르게 되는지 확인합니다.
- Controller 레이어 Bean 검증
- Service 레이어 Bean 검증
- Repository 레이어 Bean 검증
- Security 관련 Bean 검증

### IntelliJ에서 테스트 실행

1. 테스트 클래스 또는 메서드에서 ▶ 버튼 클릭
2. 또는 `Ctrl+Shift+F10` (Mac: `Cmd+Shift+R`)
3. 테스트 결과는 하단 "Run" 탭에서 확인

## 📝 구현 상태

- [x] Repository 레이어 구현
- [x] Family CRUD API 구현
- [x] Category CRUD API 구현
- [x] Expense CRUD API 구현
- [x] Invitation API 구현
- [x] 인증 API 구현 (JWT 발급)
- [x] Swagger/OpenAPI 문서 자동화
- [x] 프론트엔드와 연동
- [x] Spring Context 로딩 테스트
- [x] Bean 의존성 주입 테스트
- [ ] 단위 테스트 작성 (Service 레이어)
- [ ] 통합 테스트 작성 (Controller 레이어)

### 구현된 API 엔드포인트

**Authentication API** (`/auth`)
- `POST /auth/register` - 사용자 등록/로그인
- `POST /auth/login` - 로그인
- `POST /auth/refresh` - 토큰 갱신
- `GET /auth/me` - 현재 사용자 정보
- `POST /auth/logout` - 로그아웃

**Family API** (`/families`)
- `POST /families` - 가족 생성
- `GET /families` - 내 가족 목록
- `GET /families/{uuid}` - 가족 상세
- `PUT /families/{uuid}` - 가족 수정
- `DELETE /families/{uuid}` - 가족 삭제

**Category API** (`/families/{familyUuid}/categories`)
- `POST` - 카테고리 생성
- `GET` - 카테고리 목록
- `GET /{uuid}` - 카테고리 상세
- `PUT /{uuid}` - 카테고리 수정
- `DELETE /{uuid}` - 카테고리 삭제

**Expense API** (`/families/{familyUuid}/expenses`)
- `POST` - 지출 등록
- `GET` - 지출 목록 (페이징)
- `GET /{uuid}` - 지출 상세
- `PUT /{uuid}` - 지출 수정
- `DELETE /{uuid}` - 지출 삭제

**Invitation API** (`/invitations`)
- `POST /invitations/families/{uuid}` - 초대장 생성
- `GET /invitations/families/{uuid}` - 가족 초대장 목록
- `GET /invitations/token/{token}` - 초대장 정보 조회 (공개)
- `POST /invitations/accept` - 초대 수락
- `DELETE /invitations/{uuid}` - 초대장 삭제

**참고:** Swagger UI (http://localhost:8080/api/v1/swagger-ui.html)에서 모든 API를 테스트할 수 있습니다.

## 🚂 Railway 배포

Railway를 사용한 프로덕션 배포 가이드입니다.

### 사전 준비

1. **Railway 계정 생성**
   - https://railway.app 에서 GitHub 계정으로 가입
   - New Project 클릭

2. **Git 레포지터리 준비**
   - GitHub/GitLab에 코드 푸시
   - Private 레포지터리도 가능

### Step 1: MySQL 데이터베이스 추가

1. Railway 프로젝트에서 **New** 클릭
2. **Database** → **Add MySQL** 선택
3. MySQL 서비스가 자동으로 생성됩니다

**생성된 환경변수 (자동):**
- `MYSQL_URL`: MySQL 연결 URL
- `MYSQL_HOST`: 호스트명
- `MYSQL_PORT`: 포트 (기본 3306)
- `MYSQL_DATABASE`: 데이터베이스명
- `MYSQL_USER`: 사용자명
- `MYSQL_PASSWORD`: 비밀번호

### Step 2: Spring Boot 애플리케이션 배포

1. **Deploy from GitHub Repo** 선택
2. 레포지터리 연결 및 선택
3. **Deploy Now** 클릭

Railway가 자동으로:
- `Dockerfile` 감지 및 사용
- 또는 `railway.json` 설정 사용
- 빌드 및 배포 실행

### Step 3: 환경변수 설정

Railway 프로젝트 → **Variables** 탭에서 다음 환경변수 설정:

#### 필수 환경변수

```bash
# 데이터베이스 설정 (MySQL 서비스와 연결)
DATABASE_URL=${{MySQL.MYSQL_URL}}  # Reference Variable 사용
DB_USERNAME=${{MySQL.MYSQL_USER}}
DB_PASSWORD=${{MySQL.MYSQL_PASSWORD}}

# JWT 설정 (256bit 이상의 시크릿)
JWT_SECRET=your-production-secret-key-minimum-256-bits-required-for-hs512-algorithm-example
JWT_EXPIRATION=86400000    # 24시간 (밀리초)
JWT_REFRESH_EXPIRATION=604800000  # 7일

# Swagger (프로덕션에서는 false 권장)
SWAGGER_ENABLED=false

# Spring Profile (선택사항, 기본값 사용)
SPRING_PROFILES_ACTIVE=prod
```

#### Reference Variables 사용법

Railway는 서비스 간 환경변수를 참조할 수 있습니다:
```
${{ServiceName.VARIABLE_NAME}}
```

예시:
```
DATABASE_URL=${{MySQL.MYSQL_URL}}
```

### Step 4: 포트 설정

Railway는 자동으로 `PORT` 환경변수를 주입합니다.

**application.yml에서 Railway 포트 감지:**
```yaml
server:
  port: ${PORT:8080}  # Railway PORT 또는 기본 8080
```

현재 설정에서는 `/api/v1`이 컨텍스트 경로이므로:
- Health Check: `https://your-app.railway.app/api/v1/health`
- Swagger: `https://your-app.railway.app/api/v1/swagger-ui.html`

### Step 5: 배포 확인

#### 빌드 로그 확인
1. Railway 프로젝트 → 서비스 클릭
2. **Deployments** 탭에서 빌드 진행 상황 확인
3. 로그에서 에러 확인

#### 서비스 URL 확인
1. **Settings** 탭 → **Networking**
2. **Generate Domain** 클릭 (무료 `.railway.app` 도메인)
3. 또는 Custom Domain 설정 가능

#### Health Check 테스트
```bash
curl https://your-app.railway.app/api/v1/health
```

예상 응답:
```json
{
  "status": "UP"
}
```

### Step 6: 데이터베이스 마이그레이션

Railway에 배포하면 Flyway가 자동으로 실행됩니다.

**최초 배포 시:**
1. Railway MySQL 서비스에 접속
2. 또는 Flyway가 자동으로 스키마 생성

**마이그레이션 확인:**
```sql
-- Railway MySQL 콘솔에서 확인
SELECT * FROM flyway_schema_history;
```

### Step 7: 자동 배포 설정

Railway는 기본적으로 Git Push 시 자동 배포됩니다.

**배포 트리거:**
- `main` 또는 `master` 브랜치에 Push
- PR 머지 시 자동 배포

**특정 브랜치만 배포하려면:**
1. **Settings** → **Deploys**
2. **Branch** 설정

### 배포 파일 구조

```
fos-accountbook-backend/
├── Dockerfile              # Docker 이미지 빌드 설정
├── railway.json            # Railway 배포 설정
├── .dockerignore          # Docker 빌드 제외 파일
└── src/
    └── main/
        └── resources/
            └── application.yml  # 환경변수 기반 설정
```

### 트러블슈팅

#### 빌드 실패 시

**문제 1: Out of Memory**
```
Railway Settings → Resources → 메모리 증가 (최소 1GB 권장)
```

**문제 2: 빌드 타임아웃**
```
railway.json의 buildCommand에 -x test 추가 (테스트 스킵)
```

**문제 3: Gradle 캐시 문제**
```bash
# 로컬에서 빌드 테스트
./gradlew clean build -x test

# Dockerfile에서 --no-daemon 사용
```

#### 런타임 오류

**데이터베이스 연결 실패:**
```
Variables 탭에서 DATABASE_URL 확인
${{MySQL.MYSQL_URL}} 형식으로 설정했는지 확인
```

**Health Check 실패:**
```
healthcheckPath가 올바른지 확인: /api/v1/health
컨텍스트 경로 포함 여부 확인
```

**Flyway 마이그레이션 실패:**
```
MySQL 서비스가 시작되었는지 확인
V1__init.sql 파일이 올바른지 검증
```

### 비용 안내

Railway는 **$5/월** 크레딧을 무료로 제공합니다:
- **Hobby Plan**: $5 크레딧 포함
- **리소스 기반 과금**: 실사용량만 청구
- **Sleep 기능**: 사용하지 않을 때 자동 절전

**예상 비용:**
- MySQL: ~$1-2/월
- Spring Boot App: ~$3-5/월 (트래픽에 따라)

### 유용한 Railway CLI 명령어

```bash
# Railway CLI 설치
npm i -g @railway/cli

# 로그인
railway login

# 프로젝트 연결
railway link

# 로컬에서 Railway 환경변수로 실행
railway run ./gradlew bootRun

# 로그 확인
railway logs

# 환경변수 확인
railway variables
```

### 모니터링

Railway 대시보드에서 확인 가능:
- **Metrics**: CPU, 메모리, 네트워크 사용량
- **Logs**: 실시간 애플리케이션 로그
- **Deployments**: 배포 이력
- **Usage**: 비용 추적

### 프로덕션 체크리스트

- [ ] MySQL 데이터베이스 생성 및 연결
- [ ] 환경변수 모두 설정 (`DATABASE_URL`, `JWT_SECRET` 등)
- [ ] Swagger 프로덕션에서 비활성화 (`SWAGGER_ENABLED=false`)
- [ ] Custom Domain 설정 (선택)
- [ ] 백업 전략 수립 (Railway MySQL 자동 백업 확인)
- [ ] 모니터링 알림 설정
- [ ] CORS 설정에 프로덕션 프론트엔드 URL 추가

## 🔗 관련 프로젝트

**프론트엔드 레포지터리:** fos-accountbook
- Next.js 15 + Auth.js v5
- TypeScript + Tailwind CSS
- Prisma (NextAuth 전용)

## 📄 라이선스

MIT License

