# Phase 01. Spotless 와 google-java-format 을 넣고 저장소 전체를 한 번 포맷한다

**Execution profile**: standard

## 목표

백엔드 Java 포맷을 도구가 정하게 한다. 이 phase 가 끝나면 `./gradlew spotlessCheck` 가 모든 파일에서 통과하고, 포맷 커밋은 `git blame` 에서 건너뛴다.

**범위 외**: ArchUnit 은 phase 02, Checkstyle 정리와 `qualityCheck`, CI 는 phase 03 이다. 코드의 동작은 바꾸지 않는다.

## 컨텍스트

모든 경로는 저장소 root 기준이다. 명령은 `backend/` 에서 돌린다.

**근거 문서**: `backend/docs/adr/ADR-B22-static-analysis-tools.md`.

- 빌드: `backend/build.gradle.kts`(Kotlin DSL), 버전은 `backend/gradle/libs.versions.toml` 이 가진다. 지금 Checkstyle 은 `toolVersion = "10.12.5"`, 설정 `backend/config/checkstyle/google_checks.xml`, `maxWarnings = 0` 이다.
- google_checks 에서 `Indentation`, `CustomImportOrder`, `OperatorWrap`, `AvoidStarImport` 는 주석 처리돼 꺼져 있다. `SeparatorWrap`(점은 줄 앞), `LineLength`(250) 는 켜져 있다.
- 참고 구현: `/Users/nhn/personal/fos-assistant/backend/build.gradle.kts` 의 `spotless { ... }` 블록과 `libs.versions.toml` 의 `spotless` 플러그인 항목. 그 저장소는 palantir 와 `ratchetFrom` 을 쓰지만 이 저장소는 google-java-format 과 전체 포맷을 쓴다(ADR-B22). 그 저장소 파일은 고치지 않는다.
- Java 파일은 현재 234개다. 같은 시각에 백엔드를 고치는 다른 브랜치는 없다.

## 의도 메모

- 포맷 결과가 켜져 있는 Checkstyle 규칙(특히 `SeparatorWrap`)과 부딪히면, 포맷터를 Checkstyle 에 맞추지 말고 그 Checkstyle 규칙을 끈다. 포맷 규칙의 주인은 포맷터다(ADR-B22). 끈 규칙과 이유를 커밋 메시지에 적는다.
- 버전은 범위가 아닌 정확한 값으로 고정한다. Spotless 와 google-java-format 은 Java 21 과 Gradle 9.8 에서 도는 최신 안정 버전을 고른다.
- 설정 커밋과 포맷 커밋을 나눈다. 포맷 커밋에는 공백과 줄바꿈 변경만 있어야 한다.

## 작업 항목

### 1. `libs.versions.toml` 과 `build.gradle.kts` 에 Spotless 설정

- 플러그인 `com.diffplug.spotless`, `java { target("src/main/java/**/*.java", "src/test/java/**/*.java"); googleJavaFormat(<버전>); trimTrailingWhitespace(); endWithNewline() }`.
- `ratchetFrom` 은 쓰지 않는다.

### 2. 저장소 전체 포맷 커밋

- `./gradlew spotlessApply --no-daemon` 결과만 담은 커밋 하나. 메시지는 `style(backend): google-java-format 으로 백엔드 Java 전체를 포맷한다`.

### 3. `.git-blame-ignore-revs`

- 저장소 root 에 `.git-blame-ignore-revs` 를 만들고 2번 커밋의 전체 해시를 한 줄 주석과 함께 넣는다. 이 파일은 2번 커밋 뒤의 별도 커밋이다.

### 4. 포맷과 부딪히는 Checkstyle 규칙 정리

- `./gradlew checkstyleMain checkstyleTest` 가 포맷 뒤에도 통과하는지 본다. 실패하면 위 의도 메모대로 해당 규칙을 끈다.

### 5. 이 phase 를 검증하는 기존 테스트

- 새 테스트를 만들지 않는다. 포맷 뒤에도 동작이 같은지 `backend/src/test/java/com/bifos/accountbook/AccountBookApplicationTest.java` 와 전체 테스트를 돌려 확인한다.

## 검증

`backend/` 에서 실행한다. `gradle/wrapper/gradle-wrapper.jar` 가 없으면 먼저 `mise exec gradle@9.8.0 -- gradle wrapper --gradle-version 9.8.0` 을 돌린다. jar 는 커밋하지 않는다.

```bash
./gradlew spotlessCheck --no-daemon
./gradlew test --tests "com.bifos.accountbook.AccountBookApplicationTest" --no-daemon
./gradlew checkstyleMain checkstyleTest test build --no-daemon
git diff --stat HEAD~2 HEAD~1 -- . | tail -1
```

기대값: 앞의 두 명령이 BUILD SUCCESSFUL. 포맷 커밋을 `git show --stat` 과 `git diff -w` 로 보면 공백 외 변경이 없다(`git diff -w <포맷 커밋>^ <포맷 커밋> --stat` 이 비거나 줄바꿈 이동만 남는다).

## 변경 파일

| 파일 | 변경 |
|---|---|
| `backend/gradle/libs.versions.toml` | 수정 |
| `backend/build.gradle.kts` | 수정 |
| `backend/config/checkstyle/google_checks.xml` | 수정 |
| `backend/src/**/*.java` | 수정 |
| `backend/src/test/**/*Test.java` | 수정 |
| `.git-blame-ignore-revs` | 신규 |
