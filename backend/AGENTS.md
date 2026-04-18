# fos-accountbook-backend — Claude Agent Context

Spring Boot 기반 가족 단위 가계부 REST API 서버. Claude Code 에이전트가 이 레포에서 작업할 때 참고하는 최상위 컨텍스트.

## 1. Project Overview

**FOS Accountbook Backend** — 가족(Family) 단위로 지출·수입·카테고리를 관리하는 RESTful API. 예산 알림, 반복 지출 스케줄링, 초대 기반 가입을 지원한다.

## 2. Technology Stack

- **Language**: Java 21
- **Framework**: Spring Boot 4.0.1
- **Build Tool**: Gradle 9.2 (Kotlin DSL + Version Catalog `libs.versions.toml`)
- **Database**: MySQL 9.5 (prod/local), H2 in-memory (test)
- **ORM**: Spring Data JPA + QueryDSL 5.1
- **Security**: Spring Security + JWT (jjwt 0.13)
- **Migration**: Flyway
- **Docs**: SpringDoc OpenAPI 2.8.14 (Swagger UI)
- **Infra**: Docker Compose (MySQL 로컬)

## 3. Architecture & Project Structure

도메인 기반 패키지 구조 (ADR-B16). `com.bifos.accountbook` 패키지 아래 각 도메인(`user`/`family`/`expense` 등)이 내부적으로 `presentation → application → domain → infra` 단방향 의존성을 가진다.

→ 자세한 내용은 `CLAUDE.md`의 `## Architecture` 섹션 및 `docs/code-architecture.md` 참조.

## 4. Key Features

- **Auth**: JWT(HS512) 기반 로그인/회원가입 + Google/Kakao OAuth
- **Family**: 가족 생성 + UUID 초대 링크
- **Expense/Income**: 카테고리 기반 CRUD
- **Budget Alerts**: 예산 50%/80%/100% 초과 시 `Notification` 생성 (ApplicationEvent + `AFTER_COMMIT` 패턴 — ADR-B08)
- **Recurring Expense**: `@Scheduled` 기반 (ADR-B12, B13)
- **Notifications**: 초대·예산 알림

## 5. Setup & Execution

### Prerequisites

- JDK 21
- Docker & Docker Compose

### Local Dev

```bash
# 1. MySQL 시작
docker compose -f docker/compose.yml up -d

# 2. 앱 실행
./gradlew bootRun --args='--spring.profiles.active=local'

# 3. Swagger UI: http://localhost:8080/swagger-ui/index.html
```

### Build·Test·Lint

→ 자세한 명령은 `CLAUDE.md`의 `## Commands` 섹션 참조.

## 6. Development Standards & Conventions

- **Code Style**: Google Java Style + Naver convention — Checkstyle로 자동 검증
- **Naming**: 클래스 `CamelCase`, 메서드/변수 `camelCase`, DB `snake_case`
- **DTOs**: 불변 객체, Lombok `@Getter + @Builder`
- **Commits**: Conventional Commits (`feat`/`fix`/`docs`/`chore`/...)
- **Tests**: `AbstractControllerTest`/`TestFixturesSupport` 상속 통합 테스트

→ Entity·DTO·Service 상세 규칙, `@Transactional` 경계, AOP 자기호출 함정 등은 `CLAUDE.md`의 `## Code Conventions`·`## Key Patterns` 섹션 참조.

## 7. Comments Strategy (Claude 에이전트용)

- **의도는 이름으로 표현**: 주석 대신 가독성 있는 변수/메서드명
- **주석 최소화**: 코드만 봐서는 알 수 없는 WHY(제약·불변식·버그 회피)만 기록
- **자명한 주석 금지**: `// Given`/`// When`/`// Then`, 함수명을 그대로 풀어 쓴 주석 금지
- **TODO 금지**: "TODO"/"future implementation" 주석 대신 `docs/adr.md`·Issue·대화로 처리

## 8. Important Configuration Files

- `build.gradle.kts` — 메인 빌드 스크립트
- `gradle/libs.versions.toml` — 의존성 버전 카탈로그
- `src/main/resources/application.yml` — Spring 설정
- `src/main/resources/db/migration/` — Flyway SQL 마이그레이션
- `config/checkstyle/google_checks.xml` — Checkstyle 규칙

## 9. Claude Agent 작업 규칙

본 레포에서 Claude 에이전트가 작업할 때는 **`CLAUDE.md`가 최상위 권위 문서**다. AGENTS.md는 초기 파악용 요약이며, 세부 규칙은 CLAUDE.md와 `docs/*`를 따른다.

- `.claude/skills/` 하위에 설치된 스킬(`planning`, `plan-and-build`, `build-with-teams`, `docs-check`, `integrate-api-contract`)을 활용
- `docs/adr.md` ADR-B01~B16은 의사결정 source of truth. 상황별 필수 참조 표는 `CLAUDE.md`의 `## 상황별 ADR 필수 참조` 섹션 참조
