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
- 🤖 **자동 의존성 업데이트** - Dependabot

---

## 🛠 기술 스택

### Core

- **Language**: Java 21¬
- **Framework**: Spring Boot 3.5.7
- **Build Tool**: Gradle 9.2 (Version Catalogs 사용)
- **Database**: MySQL 8.0+

### Libraries

- **ORM**: Spring Data JPA (Hibernate)
- **Migration**: Flyway
- **Security**: Spring Security + JWT
- **API Docs**: SpringDoc OpenAPI 3.0
- **Utils**: Lombok, MapStruct

### DevOps

- **Container**: Docker
- **Platform**: Railway
- **Dependency Management**: Dependabot (매주 자동 업데이트)

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
- Soft Delete 패턴 (`status` 컬럼 기반: ACTIVE, DELETED)
- Flyway 마이그레이션으로 스키마 버전 관리

**상세 가이드**: [gradle/README.md](gradle/README.md)

### Spring Profiles

| Profile   | 용도         | 데이터베이스  | Swagger | 로깅           |
| --------- | ------------ | ------------- | ------- | -------------- |
| **local** | 로컬 개발    | Docker MySQL  | ✅      | Console + File |
| **prod**  | Railway 배포 | Railway MySQL | ❌      | Console만      |
| **test**  | 테스트       | H2 in-memory  | ❌      | Console만      |

### Dependabot 자동 의존성 관리

매주 월요일 오전 9시(KST)에 Dependabot이 자동으로 의존성 업데이트를 체크합니다:

- **Gradle 의존성**: Spring Boot, 테스트 라이브러리, 로깅 등
- **Docker 이미지**: Dockerfile 베이스 이미지
- **관련 라이브러리 그룹화**: 하나의 PR로 통합 관리

설정 파일: `.github/dependabot.yml`

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
├── gradle/                                    # Gradle 설정
│   ├── libs.versions.toml                    # Version Catalog
│   └── README.md                             # Version Catalog 가이드
├── .github/
│   └── dependabot.yml                        # Dependabot 설정
├── docs/                                      # 문서
│   └── deploy/
│       └── railway.md                        # Railway 배포 가이드
├── Dockerfile                                 # Docker 이미지 빌드
├── railway.json                              # Railway 설정
├── docker/
│   └── compose.yml                          # 로컬 MySQL 설정 (최신 Docker Compose 스펙)
├── build.gradle.kts                          # Gradle 빌드 설정
└── README.md                                 # 이 파일
```

---

## 🔗 관련 프로젝트

**프론트엔드 레포지터리**: [fos-accountbook](https://github.com/jon890/fos-accountbook)

---

## 📝 코딩 컨벤션

- **Database**: snake_case (비즈니스 테이블)
- **Java**: CamelCase (클래스), camelCase (변수/메서드)
- **Package**: 소문자, 점(.) 구분
- **Layer 분리**: Presentation → Application → Domain → Infrastructure
- **DTO**: @Getter + @Builder + @NoArgsConstructor + @AllArgsConstructor (immutable)
- **테스트**: 모든 신규 코드는 테스트와 함께 작성

---

**마지막 업데이트**: 2025-11-14
