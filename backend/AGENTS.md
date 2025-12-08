# Repository Guidelines

## Project Structure & Module Organization
- `src/main/java/com/bifos/accountbook/`는 계층형 구조를 따릅니다: `presentation/`(Controller, DTO), `application/`(Service, mapper), `domain/`(Entity, Repository), `infra/`(config, security, exception).  
- `src/main/resources/`에는 `application-*.yml`, `logback-spring.xml`, 그리고 Flyway 마이그레이션이 `db/migration`(`V{timestamp}__description.sql`)에 위치합니다.  
- `src/test/java/`는 JUnit 5 + Spring Boot 테스트가 있으며, 컨트롤러 스펙은 `presentation/controller` 아래에 있습니다.  
- 도구 설정은 `config/checkstyle/`(Google 스타일)와 `gradle/libs.versions.toml`(버전 카탈로그)에 모여 있습니다.  
- 로컬 인프라는 `docker/compose.yml`을 통해 포트 `13306`의 MySQL 9.4를 띄우며, 문서는 `docs/`에 정리됩니다.

## Build, Test, and Development Commands
- `./gradlew clean build` — 전체 빌드: 컴파일, QueryDSL 생성, Checkstyle, 테스트 실행.  
- `./gradlew test` — `test` 프로필(H2)로 JUnit 스위트 실행.  
- `./gradlew checkstyleMain checkstyleTest` — Google Java Style 검사.  
- `SPRING_PROFILES_ACTIVE=local ./gradlew bootRun` — 로컬 DB로 API 실행; 사전에 `docker compose -f docker/compose.yml up -d mysql`로 MySQL을 띄워주세요.  
- DB 변경 시 수동 DDL 대신 `src/main/resources/db/migration`에 Flyway 스크립트를 추가하세요.

## Coding Style & Naming Conventions
- Java 21 + Spring Boot; `config/checkstyle/google_checks.xml`을 준수합니다(스페이스 기반, 250자 라인 제한, 중괄호 필수).  
- 패키지는 소문자, 클래스는 `PascalCase`, 메서드/필드는 `camelCase`, 상수는 `UPPER_SNAKE_CASE`.  
- 도메인 테이블은 `snake_case`, Java 타입은 CamelCase를 사용하며, 계층 간 경계를 유지합니다(Controller → Service → Domain/Repository).

## Testing Guidelines
- 대상 패키지 인접에 `*Test.java`로 JUnit 5 테스트를 추가하세요(예: `presentation/controller/...ControllerTest`).  
- 기존 컨트롤러 테스트처럼 Spring Boot 테스트 유틸과 MockMvc/WebTestClient를 사용하고, 공통 셋업은 `AbstractControllerTest`에 둡니다.  
- `test` 프로필은 H2를 사용하므로, MySQL 전용 동작 의존은 지양합니다.  
- 신규 비즈니스 로직·마이그레이션에는 테스트를 함께 추가하고, PR 전 `./gradlew test`를 통과시켜 주세요.

## Commit & Pull Request Guidelines
- 기존 Conventional Commit 스타일을 따릅니다: `feat: ...`, `fix(scope): ...`, `chore(deps): ... (#PR)`, `refactor(auth): ...`; scope는 계층/모듈에 맞춰 작성하세요.  
- PR에는 간결한 설명, 연관 이슈, 스키마 변경 시 마이그레이션 요약을 포함합니다.  
- 테스트 결과나 재현 절차를 첨부하고, API 계약 변경 시 샘플 요청/응답 또는 Swagger 스크린샷을 추가하세요.  
- 커밋은 논리적으로 잘게 나누고, 비밀정보나 로컬 오버라이드(`application-local.yml` 자격증명 등)는 커밋하지 않습니다.
