# Phase 03. qualityCheck, CI, 지침의 코드 규칙 표

**Execution profile**: fast

## 목표

포맷, 구조, 코드 모양 검사를 `./gradlew qualityCheck` 하나로 묶어 CI 에서 돌린다. 지침의 산문 규칙을 도구 규칙 이름으로 바꾼다.

**범위 외**: 포맷과 ArchUnit 도입은 phase 01, 02 가 끝냈다. 프론트엔드는 바꾸지 않는다.

## 컨텍스트

모든 경로는 저장소 root 기준이다. 명령은 `backend/` 에서 돌린다.

**근거 문서**: `backend/docs/adr/ADR-B22-static-analysis-tools.md`.

- `.github/workflows/backend-ci.yml` 은 `gradle wrapper` 로 wrapper 를 만들고 `checkstyleMain`, `checkstyleTest`, `test`, `build -x test -x checkstyleMain -x checkstyleTest` 를 따로 돈다.
- `backend/CLAUDE.md` 의 「Code Conventions」 아래 「코드 스타일 (`Google Java Style + Naver Convention`)」 절과 「Architecture」 절, 「금지사항」 절이 규칙을 문장으로 적는다. `.github/claude-review-prompt-backend.txt` 가 이 절 이름들을 가리키므로 **절 이름은 바꾸지 않는다**.
- google_checks 에서 `AvoidStarImport` 가 주석 처리돼 있다. 와일드카드 import 금지는 지침에만 있다.
- 루트 `CLAUDE.md` 의 로컬 검증 명령은 `cd backend && ./gradlew checkstyleMain checkstyleTest test` 이다.

## 작업 항목

### 1. Checkstyle 에 `AvoidStarImport` 를 켜고 `qualityCheck` 태스크 추가

- `AvoidStarImport`(static import 허용)를 켠다. 위반이 있으면 고친다(포맷 phase 뒤라 IDE 정리로 충분하다).
- `NO_LOMBOK_DATA`는 Checkstyle 소스 검사로 구현한다. `lombok.Data` import와 `@Data`, `@lombok.Data` 사용을 차단하고 임시 위반으로 실패를 확인한 뒤 되돌린다.
- `qualityCheck`: `spotlessCheck`, `checkstyleMain`, `checkstyleTest`, `archTest` 에 의존. 파일을 바꾸지 않는다.

### 2. `backend-ci.yml`

- Checkstyle 두 단계를 `./gradlew qualityCheck --no-daemon` 한 단계로 바꾼다. 테스트와 빌드 단계는 유지한다.

### 3. 지침 갱신

- `backend/CLAUDE.md`
  - 「코드 스타일」 절 본문을 「포맷은 `./gradlew spotlessApply`, 검사는 `./gradlew qualityCheck`. 규칙의 근거는 ADR-B22」 와 구조 규칙 이름 표(phase 02 의 규칙 이름과 한 줄 뜻)로 바꾼다. 와일드카드 import 문장은 Checkstyle 이 막으므로 뺀다. 한국어 발음 표기 금지는 도구로 못 막으니 남긴다.
  - 「Commands」 절에 `spotlessApply`, `qualityCheck`, `archTest` 를 더한다.
  - 상황별 ADR 표에 ADR-B21, ADR-B22 행이 없으면 더한다.
- 루트 `CLAUDE.md` 의 backend 로컬 검증 명령을 `cd backend && ./gradlew qualityCheck test` 로 바꾼다.
- `backend/.claude/build-with-teams-overlay.md` 의 통합 검증 명령을 `./gradlew qualityCheck test build --no-daemon` 으로 바꾼다.

### 4. 이 phase 를 검증하는 실행

- 새 테스트 파일은 만들지 않는다. phase 02 의 `backend/src/test/java/com/bifos/accountbook/architecture/ArchitectureRulesTest.java` 를 `qualityCheck` 와 `test` 로 함께 돌려 확인한다.

## 검증

`backend/` 에서 실행한다. `gradle/wrapper/gradle-wrapper.jar` 가 없으면 먼저 `mise exec gradle@9.8.0 -- gradle wrapper --gradle-version 9.8.0` 을 돌린다. jar 는 커밋하지 않는다.

```bash
./gradlew qualityCheck --no-daemon
./gradlew test --tests "com.bifos.accountbook.architecture.ArchitectureRulesTest" --no-daemon
./gradlew qualityCheck test build --no-daemon
python3 -c "import yaml; d=yaml.safe_load(open('../.github/workflows/backend-ci.yml')); s=[x.get('run','') for j in d['jobs'].values() for x in j['steps']]; assert any('qualityCheck' in r for r in s), s; print('ok')"
python3 ../scripts/check-adr-links.py
```

기대값: 모든 명령이 성공한다.

## 변경 파일

| 파일 | 변경 |
|---|---|
| `backend/config/checkstyle/google_checks.xml` | 수정 |
| `backend/build.gradle.kts` | 수정 |
| `backend/src/**/*.java` | 수정 |
| `backend/src/test/**/*Test.java` | 수정 |
| `.github/workflows/backend-ci.yml` | 수정 |
| `backend/CLAUDE.md` | 수정 |
| `CLAUDE.md` | 수정 |
| `backend/.claude/build-with-teams-overlay.md` | 수정 |
