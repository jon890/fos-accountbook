# FOS Accountbook Backend

Java 21 과 Spring Boot 4 로 만든 가족 가계부 백엔드 API 서버다.

## 기술 스택

- **Language**: Java 21
- **Framework**: Spring Boot 4
- **Build**: Gradle (Kotlin DSL, Version Catalog). 라이브러리 버전은 `gradle/libs.versions.toml`, Gradle 버전은 `gradle/wrapper/gradle-wrapper.properties` 가 정한다
- **DB**: MySQL 8.4 (prod/local), H2 in-memory (test)
- **ORM**: Spring Data JPA, QueryDSL 5.1
- **Security**: Spring Security, JWT (jjwt). 외부 연동은 사용자별 `fab_` API 토큰
- **Migration**: Flyway
- **Docs**: SpringDoc OpenAPI (Swagger UI)

## 아키텍처

도메인 기반 패키지 구조 (ADR-B16).

```
com.bifos.accountbook/
├── shared/                 공통 (auth, dto, exception, filter, utils, value)
├── user/ family/ category/ expense/ income/ recurring/
├── invitation/ notification/ dashboard/ apitoken/
│                           각 도메인 내부 presentation/ application/ domain/ infra/
└── config/                 Spring 설정 (캐시, 보안, CORS, Security)
```

각 도메인 내부는 `presentation → application → domain → infra` 단방향 의존성.

## 실행

```bash
# 로컬 MySQL (Docker)
docker compose -f docker/compose.yml up -d

# 앱 실행
./gradlew bootRun --args='--spring.profiles.active=local'

# 테스트
./gradlew test --no-daemon

# 코드 스타일 검사
./gradlew checkstyleMain checkstyleTest --no-daemon
```

`gradle-wrapper.jar` 는 추적하지 않는다. 없으면 `mise exec gradle@9.8.0 -- gradle wrapper --gradle-version 9.8.0` 으로 만든다.

## 환경 변수

| 이름 | 용도 |
|---|---|
| `AUTH_SECRET` | JWT 서명 키. 프론트엔드 `AUTH_SECRET` 과 같은 값이어야 소셜 로그인 결과를 검증한다 |
| `JWT_EXPIRATION`, `JWT_REFRESH_EXPIRATION` | access 와 refresh 토큰 만료 |
| `SPRING_DATASOURCE_URL`, `SPRING_DATASOURCE_USERNAME`, `SPRING_DATASOURCE_PASSWORD` | prod DB 접속 |
| `PORT` | 서버 포트. 기본 8080 |

API 는 `/api/v1` 아래에 있고, 실행 중 Swagger UI 로 볼 수 있다.

## 문서

| 문서 | 역할 |
|---|---|
| [docs/prd.md](docs/prd.md) | 제품 요구사항 |
| [docs/flow.md](docs/flow.md) | 사용자 흐름 |
| [docs/adr/INDEX.md](docs/adr/INDEX.md) | 기술 의사결정 (ADR-B, 목록은 INDEX) |
| [docs/code-architecture.md](docs/code-architecture.md) | 패키지 구조, 레이어 규칙 |
| [docs/data-schema.md](docs/data-schema.md) | DB 스키마 |
| [docs/testing-strategy.md](docs/testing-strategy.md) | 테스트 전략 |

## 관련 프로젝트

- **프론트엔드**: 같은 저장소의 [`frontend/`](../frontend/)
- **저장소 소개**: [루트 README](../README.md)
