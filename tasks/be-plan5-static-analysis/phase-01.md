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
- 설정 커밋과 포맷 커밋을 나눈다. Spotless의 google-java-format 단계는 import 정렬과 미사용 import 제거를 항상 실행하므로 import 변경은 선행 커밋으로 분리한다. 포맷 커밋에는 공백, 줄바꿈과 Javadoc 줄 배치만 담고 실행 코드의 토큰은 그대로 둔다.

## 작업 항목

### 1. `libs.versions.toml` 과 `build.gradle.kts` 에 Spotless 설정

- 플러그인 `com.diffplug.spotless`, `java { target("src/main/java/**/*.java", "src/test/java/**/*.java"); googleJavaFormat(<버전>); trimTrailingWhitespace(); endWithNewline() }`.
- `ratchetFrom` 은 쓰지 않는다.

### 2. 저장소 전체 포맷 커밋

- `./gradlew spotlessApply --no-daemon`을 실행한다. 각 변경 Java 파일에서 `git show HEAD:<경로>`의 원본 import 구간만 포맷 결과의 import 구간으로 치환한 내용을 만든다. 다른 구간은 원본을 그대로 둔다. 임시 Python 스크립트는 실행별 `/tmp` 디렉터리에 만들고 사용 후 지운다.
- import 이외의 공백 제거 원문이 같고, 변경 후 import가 원래 import의 부분집합인지 단언한다. 각 결과를 `git hash-object -w --stdin`으로 만들고 `git update-index --cacheinfo 100644,<blob>,<경로>`로 index에만 반영한다. `style(backend): 포맷터 기준으로 Java import를 정리한다`로 커밋한다.
- 나머지 Java 변경은 formatter 출력만 담은 커밋 하나로 만든다. 메시지는 `style(backend): google-java-format 으로 백엔드 Java 전체를 포맷한다`다. 아래 토큰 비교로 실행 코드가 그대로인지 확인한다.

### 3. `.git-blame-ignore-revs`

- 저장소 root 에 `.git-blame-ignore-revs` 를 만들고 2번 커밋의 전체 해시를 한 줄 주석과 함께 넣는다. 이 파일은 2번 커밋 뒤의 별도 커밋이다.
- 해시는 import 선행 커밋이 아니라 2번의 마지막 전체 포맷 커밋 해시를 쓴다.

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

포맷 커밋을 만들기 직전 저장소 root에서 토큰 비교를 실행한다. import 커밋의 부모가 아닌 현재 HEAD(import 정리 완료)와 워킹 파일을 비교한다.

```bash
python3 -c 'import pathlib,re,subprocess; p=re.compile(r"\"(?:\\.|[^\"\\])*\"|\x27(?:\\.|[^\x27\\])*\x27|//[^\n]*|/\*[\s\S]*?\*/|\S"); tokens=lambda s:[x for x in p.findall(s) if not x.startswith(("//","/*"))]; files=subprocess.check_output(["git","diff","--name-only","--","backend/src"],text=True).splitlines(); bad=[f for f in files if tokens(subprocess.check_output(["git","show","HEAD:"+f],text=True))!=tokens(pathlib.Path(f).read_text())]; assert not bad,bad; print("code tokens unchanged:",len(files))'
```

기대 종료 코드는 0이다. import 선행 커밋은 위 작업 항목의 원문 동등성 단언이, 포맷 커밋은 이 토큰 비교가 각각 변경 범위를 검증한다.

기대값: 앞의 두 명령이 BUILD SUCCESSFUL. 포맷 커밋을 `git show --stat` 과 `git diff -w` 로 보면 공백, 줄바꿈과 Javadoc 줄 배치만 바뀐다. Java의 문자열과 문자 리터럴을 보존하고 주석과 공백을 제외한 토큰 비교가 동일해야 한다.

## 변경 파일

| 파일 | 변경 |
|---|---|
| `backend/gradle/libs.versions.toml` | 수정 |
| `backend/build.gradle.kts` | 수정 |
| `backend/config/checkstyle/google_checks.xml` | 수정 |
| `backend/src/**/*.java` | 수정 |
| `backend/src/test/**/*Test.java` | 수정 |
| `.git-blame-ignore-revs` | 신규 |
