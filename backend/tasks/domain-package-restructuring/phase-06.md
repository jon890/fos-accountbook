# Phase 6: 테스트 파일 이동

## 컨텍스트

`fos-accountbook-backend`는 Spring Boot 3 + Java 21 기반 가족 가계부 백엔드다.
프로젝트 루트: `/Users/nhn/personal/fos-accountbook-backend`
테스트 루트: `src/test/java/com/bifos/accountbook/`

Phase 1~5 완료 상태: 소스 코드가 도메인 기반 패키지로 전환되었다. 이제 테스트 파일도 동일한 구조로 이동한다.

반드시 먼저 읽을 문서:
- `CLAUDE.md` — 테스트 컨벤션 (AbstractControllerTest, TestFixturesSupport)
- `docs/testing-strategy.md` — 테스트 전략

## 목표

`src/test/java/com/bifos/accountbook/` 하위 테스트 파일을 소스 구조와 동일한 도메인 기반으로 이동한다.

## 작업 목록

### 1. 현재 테스트 파일 목록 파악

먼저 `src/test/java/com/bifos/accountbook/` 하위 모든 `.java` 파일을 나열하여 이동 대상을 파악한다.

### 2. 테스트 파일 이동 원칙

| 테스트 파일 | 이동 대상 | 기준 |
|------------|----------|------|
| `*ControllerTest.java` | 해당 Controller의 도메인 패키지 | Controller 위치 기준 |
| `*ServiceTest.java` | 해당 Service의 도메인 패키지 | Service 위치 기준 |
| `*RepositoryTest.java` | 해당 Repository의 도메인 패키지 | Repository 위치 기준 |
| `AbstractControllerTest.java` | `shared/` | 여러 도메인 테스트가 공유 |
| `TestFixturesSupport.java` | `shared/` | 여러 도메인 테스트가 공유 |
| `TestFixtures.java` | `shared/` | 여러 도메인 테스트가 공유 |
| `DatabaseCleanup*` | `shared/` | 여러 도메인 테스트가 공유 |
| Config/설정 관련 테스트 | `config/` 또는 `shared/` | 원래 위치 유지 |

### 3. 이동 절차

각 테스트 파일에 대해:

1. 대응하는 소스 파일의 위치를 확인하여 이동 대상 결정
2. 새 디렉터리 생성 (`mkdir -p`)
3. `git mv`로 파일 이동
4. `package` 선언 수정
5. import 수정 (소스 파일은 phase 1~5에서 이미 이동됨, 테스트 내의 import가 new 경로를 가리키는지 확인)

### 4. 테스트 공통 인프라 이동

테스트 공통 클래스(`AbstractControllerTest`, `TestFixtures`, `DatabaseCleanup` 등)는 `src/test/java/com/bifos/accountbook/shared/` 하위로 이동한다. 단, 이 클래스들이 실제로 어떤 패키지에 있는지 먼저 확인한 후 결정한다.

## 성공 기준

- 모든 테스트 파일이 소스 구조를 미러링하는 위치에 존재
- old 패키지에 테스트 파일이 남아있지 않음
- `./gradlew build -x test -x checkstyleMain -x checkstyleTest --no-daemon` 성공 (컴파일)
- `./gradlew test --no-daemon` 성공 (테스트 실행)

## 주의사항

- `git mv` 사용하여 git history 보존
- `AbstractControllerTest`를 상속하는 모든 테스트 클래스의 import가 올바른지 확인
- 테스트에서 사용하는 `@SpringBootTest`, `@TestConfiguration` 등은 패키지 이동에 영향 없음 (Component Scan은 `com.bifos.accountbook` 전체를 스캔)
- H2 테스트 DB 설정은 패키지 이동과 무관
- 테스트 실행 시 Spring Context가 정상 로드되는지 확인 필수

## Blocked 조건

테스트 컴파일은 성공하지만 테스트 실행 시 Spring Context 로드 실패가 발생하면:
`PHASE_BLOCKED: Spring Context 로드 실패 — ComponentScan 범위 또는 Bean 등록 확인 필요`
