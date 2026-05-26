# FOS Accountbook Backend

Spring Boot 4 + Java 21 기반 가족 가계부 백엔드 API 서버.

## 기술 스택

- **Language**: Java 21
- **Framework**: Spring Boot 4.0.6
- **Build**: Gradle 9.2 (Kotlin DSL + Version Catalog `libs.versions.toml`)
- **DB**: MySQL 8.4 (prod/local), H2 in-memory (test)
- **ORM**: Spring Data JPA + QueryDSL 5.1
- **Security**: Spring Security + JWT (jjwt 0.13)
- **Migration**: Flyway
- **Docs**: SpringDoc OpenAPI 3.0 (Swagger UI)

## 아키텍처

도메인 기반 패키지 구조 (ADR-B16).

```
com.bifos.accountbook/
├── shared/                 공통 (auth, aop, dto, exception, filter, utils, value)
├── user/ family/ category/ expense/ income/ recurring/
├── invitation/ notification/ dashboard/
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

## 문서

| 문서 | 역할 |
|---|---|
| [docs/prd.md](docs/prd.md) | 제품 요구사항 |
| [docs/flow.md](docs/flow.md) | 사용자 흐름 |
| [docs/adr.md](docs/adr.md) | 기술 의사결정 (ADR-B01~B16) |
| [docs/code-architecture.md](docs/code-architecture.md) | 패키지 구조, 레이어 규칙 |
| [docs/data-schema.md](docs/data-schema.md) | DB 스키마 |
| [docs/testing-strategy.md](docs/testing-strategy.md) | 테스트 전략 |

## 관련 프로젝트

- **프론트엔드**: [fos-accountbook-frontend](https://github.com/jon890/fos-accountbook-frontend)
