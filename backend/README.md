# FOS Accountbook Backend

Spring Boot 3.5 + Java 21 기반 가계부 애플리케이션 백엔드 API 서버

## 📖 프로젝트 소개

**우리집 가계부**는 가족 단위로 지출을 관리하고 추적할 수 있는 웹 애플리케이션입니다.  
이 레포지터리는 RESTful API를 제공하는 백엔드 서버입니다.

### 주요 기능

- 🔐 **JWT 기반 인증/인가** - Spring Security + JWT Token
- 👨‍👩‍👧‍👦 **가족 단위 지출 관리** - 가족 그룹 생성 및 관리
- 📊 **카테고리별 지출 추적** - 사용자 정의 카테고리
- 💌 **초대 시스템** - 가족 구성원 초대 링크
- 📝 **API 문서 자동화** - Swagger UI (OpenAPI 3.0)
- 🔄 **DB 마이그레이션 관리** - Flyway

---

## 🛠 기술 스택

### Core

- **Language**: Java 21
- **Framework**: Spring Boot 3.5.0
- **Build Tool**: Gradle 8.x
- **Database**: MySQL 8.0+

### Libraries

- **ORM**: Spring Data JPA (Hibernate)
- **Migration**: Flyway
- **Security**: Spring Security + JWT
- **API Docs**: SpringDoc OpenAPI 3.0
- **Utils**: Lombok, MapStruct

### Deployment

- **Container**: Docker
- **Platform**: Railway
- **CI/CD**: GitHub Actions (Railway 자동 배포)

---

## 🏗 아키텍처

### Layered Architecture

프로젝트는 명확한 계층 구조로 설계되어 있습니다:

```
presentation/     # REST API 엔드포인트 (Controller)
    ├── controller/
    └── dto/
        
application/      # 비즈니스 로직 (Service, DTO)
    ├── service/
    ├── dto/
    └── mapper/
        
domain/           # 도메인 모델 (Entity, Repository Interface)
    ├── entity/
    └── repository/
        
infra/            # 기술적 구현 (Config, Security, Exception)
    ├── config/
    ├── security/
    └── exception/
```

### Database Schema

- **Auth Tables**: NextAuth.js 호환 테이블 (camelCase 컬럼명)
  - `users`, `accounts`, `sessions`, `verification_tokens`
- **Business Tables**: 비즈니스 로직 테이블 (snake_case 컬럼명)
  - `families`, `family_members`, `categories`, `expenses`, `invitations`

**설계 원칙**:
- UUID 기반 관계 설정
- Soft Delete 패턴 (`deleted_at` 컬럼)
- Flyway 마이그레이션으로 스키마 버전 관리

### Spring Profiles

| Profile | 용도 | 데이터베이스 | Swagger | 로깅 |
|---------|------|-------------|---------|------|
| **local** | 로컬 개발 | Docker MySQL | ✅ | Console + File |
| **prod** | Railway 배포 | Railway MySQL | ❌ | Console만 |
| **test** | 테스트 | H2 in-memory | ❌ | Console만 |

---

## 🚀 빠른 시작

### 사전 요구사항

- **Java 21** 이상
- **Docker** (로컬 MySQL 용)
- **IDE**: IntelliJ IDEA (권장)

### 1. 레포지터리 클론

```bash
git clone https://github.com/your-repo/fos-accountbook-backend.git
cd fos-accountbook-backend
```

### 2. MySQL 시작 (Docker Compose)

```bash
# MySQL 컨테이너 시작
docker compose up -d

# 로그 확인
docker compose logs -f mysql

# 상태 확인
docker compose ps
```

**로컬 MySQL 정보**:
- 호스트: `localhost:3306`
- 데이터베이스: `accountbook`
- 사용자: `accountbook_user`
- 비밀번호: `accountbook_password`

### 3. 애플리케이션 실행

#### IntelliJ IDEA (권장)

1. `Application.java` 파일 열기
2. Run Configuration 설정
   - **Active profiles**: `local` 입력
3. ▶ 버튼으로 실행 (Shift+F10)

#### Gradle

```bash
./gradlew bootRun --args='--spring.profiles.active=local'
```

### 4. API 테스트

```bash
# Health Check
curl http://localhost:8080/api/v1/health

# Swagger UI
open http://localhost:8080/api/v1/swagger-ui.html
```

---

## 📚 문서

상세한 가이드는 `docs/` 디렉토리에서 확인하세요:

- **[Railway 배포 가이드](docs/deploy/railway.md)** - Railway 배포 전체 과정
- **API 문서**: Swagger UI (`/api/v1/swagger-ui.html`)

---

## 🔧 주요 설정

### API Endpoints

모든 API는 `/api/v1` 컨텍스트 경로를 사용합니다:

- **Auth**: `/api/v1/auth/*`
- **Family**: `/api/v1/families/*`
- **Category**: `/api/v1/categories/*`
- **Expense**: `/api/v1/expenses/*`
- **Invitation**: `/api/v1/invitations/*`
- **Health Check**: `/api/v1/health`
- **Swagger UI**: `/api/v1/swagger-ui.html`

### Flyway 마이그레이션

데이터베이스 스키마는 Flyway로 버전 관리됩니다:

```
src/main/resources/db/migration/
└── V1__init.sql  # 초기 스키마
```

**명령어**:
```bash
# 마이그레이션 적용 (애플리케이션 시작 시 자동)
./gradlew bootRun

# Prisma Studio로 데이터 확인
# (프론트엔드 프로젝트에서)
```

### 환경변수

| 변수명 | 설명 | 로컬 기본값 |
|--------|------|------------|
| `SPRING_PROFILES_ACTIVE` | 활성 프로파일 | `local` |
| `MYSQLHOST` | MySQL 호스트 | `localhost` |
| `MYSQLPORT` | MySQL 포트 | `3306` |
| `MYSQLDATABASE` | DB 이름 | `accountbook` |
| `MYSQLUSER` | DB 사용자 | `accountbook_user` |
| `MYSQLPASSWORD` | DB 비밀번호 | `accountbook_password` |
| `AUTH_SECRET` | JWT + NextAuth 공통 비밀키 🔑 | (로컬용 기본값 있음) |

**프로덕션 환경변수**는 [Railway 배포 가이드](docs/deploy/railway.md)를 참조하세요.

---

## 🧪 테스트

```bash
# 전체 테스트 실행
./gradlew test

# 빌드 (테스트 포함)
./gradlew clean build

# 빌드 (테스트 제외)
./gradlew clean build -x test
```

**테스트 프로파일**: H2 in-memory 데이터베이스 사용

---

## 🚢 배포

### Railway 배포

```bash
# 1. GitHub에 푸시
git push origin main

# 2. Railway가 자동으로 감지하여 배포
# 3. Railway 대시보드에서 환경변수 설정
```

**상세 가이드**: [docs/deploy/railway.md](docs/deploy/railway.md)

### Docker 로컬 테스트

```bash
# 이미지 빌드
docker build -t fos-accountbook-backend .

# 컨테이너 실행 (local 프로파일)
docker run -p 8080:8080 \
  -e SPRING_PROFILES_ACTIVE=local \
  -e AUTH_SECRET=test-secret \
  fos-accountbook-backend
```

---

## 📁 프로젝트 구조

```
fos-accountbook-backend/
├── src/
│   ├── main/
│   │   ├── java/com/bifos/accountbook/
│   │   │   ├── Application.java              # 메인 클래스
│   │   │   ├── presentation/                 # REST API 레이어
│   │   │   │   ├── controller/
│   │   │   │   └── dto/
│   │   │   ├── application/                  # 비즈니스 로직 레이어
│   │   │   │   ├── service/
│   │   │   │   ├── dto/
│   │   │   │   └── mapper/
│   │   │   ├── domain/                       # 도메인 레이어
│   │   │   │   ├── entity/
│   │   │   │   └── repository/
│   │   │   └── infra/                        # 인프라 레이어
│   │   │       ├── config/
│   │   │       ├── security/
│   │   │       └── exception/
│   │   └── resources/
│   │       ├── application.yml               # 공통 설정
│   │       ├── application-local.yml         # 로컬 설정
│   │       ├── application-prod.yml          # 프로덕션 설정
│   │       ├── application-test.yml          # 테스트 설정
│   │       ├── logback-spring.xml            # 로깅 설정
│   │       └── db/migration/                 # Flyway 마이그레이션
│   └── test/                                  # 테스트 코드
├── docs/                                      # 문서
│   └── deploy/
│       └── railway.md                        # Railway 배포 가이드
├── Dockerfile                                 # Docker 이미지 빌드
├── railway.json                              # Railway 설정
├── .dockerignore                             # Docker 빌드 제외 파일
├── docker-compose.yml                        # 로컬 MySQL 설정
├── build.gradle.kts                          # Gradle 빌드 설정
└── README.md                                 # 이 파일
```

---

## 🔗 관련 프로젝트

**프론트엔드 레포지터리**: [fos-accountbook](https://github.com/jon890/fos-accountbook)
- Next.js 15 + Auth.js v5
- Tailwind CSS + shadcn/ui
- TypeScript

**배포 구성**:
- Frontend: Vercel
- Backend: Railway (Spring Boot + MySQL)

---

## 🤝 기여

### 개발 가이드라인

1. `main` 브랜치에서 feature 브랜치 생성
2. 코딩 컨벤션 준수 (프로젝트 설정 참고)
3. 커밋 메시지: Conventional Commits
4. PR 생성 및 리뷰 요청

### 코딩 컨벤션

- **Database**: snake_case (비즈니스 테이블), camelCase (Auth 테이블)
- **Java**: CamelCase (클래스), camelCase (변수/메서드)
- **Package**: 소문자, 점(.) 구분
- **Layer 분리**: Presentation → Application → Domain → Infrastructure

---

## 📄 라이선스

This project is licensed under the MIT License.

---

## 📞 문의

프로젝트 관련 문의사항은 GitHub Issues를 이용해주세요.

---

**마지막 업데이트**: 2025-10-10  
**버전**: 1.0.0
