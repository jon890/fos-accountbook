# Phase 02. ArchUnit 구조 규칙과 기준 파일

**Execution profile**: standard

## 목표

`backend/CLAUDE.md` 에 문장으로만 있던 구조 규칙을 ArchUnit 테스트로 만든다. 지금 있는 위반은 기준 파일에 얼려 새 위반만 실패시킨다.

**범위 외**: 포맷은 phase 01 이 끝냈다. 기준 파일에 든 위반을 고치는 일은 이 plan 밖이다(이슈로 남긴다). `qualityCheck` 와 CI 는 phase 03 이다.

## 컨텍스트

모든 경로는 저장소 root 기준이다. 명령은 `backend/` 에서 돌린다.

**근거 문서**: `backend/docs/adr/ADR-B22-static-analysis-tools.md`, `backend/docs/code-architecture.md`, `backend/docs/adr/ADR-B21-business-date-asia-seoul.md`.

- 패키지: `com.bifos.accountbook.{domain}.{presentation|application|domain|infra}`. 도메인은 `user family category expense income recurring invitation notification dashboard apitoken`, 공통은 `shared`, 설정은 `config`.
- 층 방향: `presentation → application → domain ← infra`(infra 가 domain 인터페이스를 구현한다).
- 알려진 위반: `backend/src/main/java/com/bifos/accountbook/shared/aop/FamilyValidationService.java` 가 `family` 도메인에 의존한다.
- 업무 날짜: ADR-B21 이후 application 과 presentation 은 `Clock` 과 `BusinessTime.ZONE` 으로 날짜를 정한다. 엔티티 기본값과 응답 `timestamp` 는 예외다.
- 참고 구현: `/Users/nhn/personal/fos-assistant/backend/src/test/java/com/bifos/assistant/architecture/ArchitectureRulesTest.java`, `ArchitectureRules.java`, `backend/src/test/resources/archunit.properties`, `backend/config/archunit/store/`. 규칙 상수와 테스트를 나누고 `FreezingArchRule.freeze(...)` 로 얼리는 구조를 따른다. 그 저장소 파일은 고치지 않는다.

## 규칙 목록

| 이름 | 뜻 |
|---|---|
| `LAYER_DIRECTION` | presentation은 다른 층에서 접근 금지, application은 presentation만 접근 허용, infra는 다른 층에서 접근 금지, domain은 presentation/application/infra 접근 허용 |
| `CONTROLLERS_DO_NOT_USE_REPOSITORIES` | `presentation` 은 `domain.repository` 와 `infra` 에 의존하지 않는다 |
| `SHARED_DOES_NOT_DEPEND_ON_DOMAINS` | `shared` 는 도메인 패키지에 의존하지 않는다 |
| `TRANSACTIONAL_ONLY_IN_APPLICATION` | Spring/Jakarta `@Transactional` 클래스와 메서드는 application에만 허용. 현재 이벤트 리스너도 application 안이므로 별도 예외 없음 |
| `NO_DIRECT_NOW_FOR_BUSINESS_DATE` | application 과 presentation 은 인자 없는 `LocalDate.now()`, `LocalDateTime.now()`, `YearMonth.now()` 를 부르지 않는다 |
| `NO_LOMBOK_DATA` | SOURCE retention으로 ArchUnit이 읽지 못하므로 phase 03 Checkstyle의 소스 검사로 `@Data`, `@lombok.Data`, `lombok.Data` import를 금지 |
| `TESTS_ARE_NOT_TRANSACTIONAL` | 테스트 클래스와 메서드에 `@Transactional` 을 쓰지 않는다(테스트 소스 대상) |

## 의도 메모

- 규칙을 켜기 전에 위반을 고치지 않는다. 얼린다. 위반 수를 완료 보고에 적는다.
- 같은 클래스 안의 `@Transactional` 호출은 ArchUnit 으로 정확히 잡기 어려워 넣지 않는다(ADR-B22 감당할 것).
- 규칙 이름은 위 표와 같게 둔다. phase 03 이 지침에서 이 이름을 가리킨다.

## 작업 항목

### 1. 의존성과 설정

- `libs.versions.toml` 에 `archunit`(`com.tngtech.archunit:archunit-junit5`, 정확한 버전) 추가, `build.gradle.kts` 의 testImplementation 에 연결.
- `backend/src/test/resources/archunit.properties`: 속성값 `freeze.store.default.path=config/archunit/store`, 실제 파일 위치 `backend/config/archunit/store/`. 최종 설정은 `freeze.store.default.allowStoreCreation=false`, `freeze.store.default.allowStoreUpdate=false`, `freeze.refreeze=false`다. 최초 생성 때만 명시적 Gradle 속성으로 JVM 설정을 켠다.

### 2. 규칙과 테스트

- `backend/src/test/java/com/bifos/accountbook/architecture/ArchitectureRules.java`: 위 표 중 `NO_LOMBOK_DATA`를 제외한 여섯 규칙 상수. 테스트의 Transactional 검사도 클래스와 메서드, Spring/Jakarta를 포함한다.
- `backend/src/test/java/com/bifos/accountbook/architecture/ArchitectureRulesTest.java`: 규칙마다 테스트 하나, `FreezingArchRule.freeze(...)`.
- `build.gradle.kts` 에 이 테스트만 도는 `archTest` 태스크를 더한다(참고 구현과 같은 방식).
- `test`, `archTest`의 입력에 기준 파일 디렉터리를 등록한다. `archTest`는 기준 파일 변경 후 반드시 다시 실행한다.

### 3. 기준 파일 생성과 커밋

- 처음 실행으로 생긴 `backend/config/archunit/store/` 를 커밋한다.

### 4. 기준이 동작하는지 확인

- 새 위반을 하나 만들면(예: 아무 Controller 에 Repository 필드를 임시로 추가) `archTest` 가 실패하는지 확인하고 되돌린다. 확인 결과를 완료 보고에 적는다.

## 검증

`backend/` 에서 실행한다. `gradle/wrapper/gradle-wrapper.jar` 가 없으면 먼저 `mise exec gradle@9.8.0 -- gradle wrapper --gradle-version 9.8.0` 을 돌린다. jar 는 커밋하지 않는다.

```bash
./gradlew archTest --no-daemon
./gradlew test --tests "com.bifos.accountbook.architecture.ArchitectureRulesTest" --no-daemon
./gradlew spotlessCheck checkstyleMain checkstyleTest test build --no-daemon
```

기대값: 모든 명령이 BUILD SUCCESSFUL.

## 변경 파일

| 파일 | 변경 |
|---|---|
| `backend/gradle/libs.versions.toml` | 수정 |
| `backend/build.gradle.kts` | 수정 |
| `backend/src/test/resources/archunit.properties` | 신규 |
| `backend/src/test/java/com/bifos/accountbook/architecture/ArchitectureRules.java` | 신규 |
| `backend/src/test/java/com/bifos/accountbook/architecture/ArchitectureRulesTest.java` | 신규 |
| `backend/config/archunit/store/**` | 신규 |
