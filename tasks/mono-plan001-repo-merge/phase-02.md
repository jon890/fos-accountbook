# Phase 02. 백엔드 이력을 backend/ 로 합친다

**Execution profile**: deep

## 목표

`jon890/fos-accountbook-backend` 의 main 이력 전체를 경로 `backend/` 아래로 다시 써서 이 브랜치에 merge commit 하나로 합친다.
`git log -- backend/<파일>` 이 이관 전 커밋까지 이어져야 한다.

**범위 외**: 백엔드 워크플로와 하네스 파일의 내용 수정(phase 03 ~ 06). 이 phase 의 커밋은 merge commit 하나다.

## 컨텍스트

- 백엔드는 Spring Boot 4, Java 21, Gradle Kotlin DSL 이다. 원격은 `jon890/fos-accountbook-backend`, 로컬 사본은 `/Users/nhn/personal/fos-accountbook-backend` 다.
- `git filter-repo` 는 새로 clone 한 저장소에서만 돈다. 로컬 사본에서 돌리지 않는다.
- phase 01 이 루트를 비워 두어 `backend/` 경로와 부딪히는 파일이 없다.

**근거 문서**: `docs/adr.md` 의 ADR-M01 「결정」 과 「대안 기각」 (subtree 를 쓰지 않는 이유)

## 의도 메모

- merge 는 `--allow-unrelated-histories` 로 한다. squash 하면 백엔드 커밋이 하나로 합쳐져 이력이 사라진다.
- 이 PR 도 merge commit 으로만 머지한다(squash, rebase 금지). ADR-M01 「결정」 에 적혀 있다. squash 나 rebase 로 머지하면 합친 백엔드 이력이 사라지거나 평탄해진다.
- merge 는 `--no-commit` 으로 멈춰 두고, Gradle 검사가 통과한 뒤에 커밋한다. 검사가 실패한 merge 가 커밋으로 남지 않게 한다.
- 백엔드는 `gradle/wrapper/gradle-wrapper.jar` 를 추적하지 않는다. `.gitignore` 의 `*.jar` 가 뒤에 와서 앞줄의 `!gradle/wrapper/gradle-wrapper.jar` 예외를 무효로 만든다.
    - 백엔드 CI 는 매번 `gradle wrapper` 로 jar 를 만든다. 이 관례를 이관에서 바꾸지 않는다. jar 는 커밋하지 않는다.
    - 로컬 검증도 같은 방식으로 jar 를 만든다. 이 머신에는 전역 gradle 이 없어 `mise exec gradle@9.5.0 --` 로 부른다. 9.5.0 은 `gradle-wrapper.properties` 의 `distributionUrl` 버전이다.
    - 만든 뒤 추적 파일(`gradlew`, `gradlew.bat`, `gradle-wrapper.properties`)이 바뀌었으면 되돌린다. jar 는 `.gitignore` 에 걸려 staged 에 들어가지 않는다.
- 백엔드 커밋 SHA 는 바뀐다. 원래 SHA 는 아카이브할 백엔드 저장소에 남는다.
- 로컬 백엔드 사본은 읽기만 한다. 그 저장소의 브랜치와 원격을 바꾸지 않는다.

## Blocked 조건

- `git filter-repo` 가 없고 `brew install git-filter-repo` 도 실패하면 → `PHASE_BLOCKED: git-filter-repo 설치 실패` 출력 후 종료
- 백엔드에 열린 사람 PR 이 남아 있으면(`gh pr list -R jon890/fos-accountbook-backend --state open` 에 dependabot 이 아닌 작성자) → `PHASE_BLOCKED: 백엔드 열린 PR 정리 필요` 출력 후 종료

## 작업 항목

### 1. 백엔드를 새로 clone 해 경로를 다시 쓰고 merge 를 멈춰 둔다

셸 변수가 호출 사이에 사라지지 않게 한 블록으로 돌린다. 임시 경로는 고정한다.

```bash
# cwd: <worktree root>
set -euo pipefail
BE_TMP=/private/tmp/mono-be-import
rm -rf "$BE_TMP" && mkdir -p "$BE_TMP"
BE_URL=$(git -C /Users/nhn/personal/fos-accountbook-backend remote get-url origin)   # 이 머신은 SSH 별칭 github-personal 을 쓴다
git clone --no-local --single-branch --branch main "$BE_URL" "$BE_TMP/be"
git -C "$BE_TMP/be" rev-list --count HEAD      # 다시 쓰기 전 커밋 수
git -C "$BE_TMP/be" filter-repo --to-subdirectory-filter backend --force
git -C "$BE_TMP/be" rev-list --count HEAD      # 다시 쓴 뒤에도 같아야 한다
git remote add be-import "$BE_TMP/be"
git fetch be-import main
git merge --allow-unrelated-histories --no-ff --no-commit be-import/main
git remote remove be-import
```

충돌이 나면 `git merge --abort` 후 멈추고 `PHASE_BLOCKED: merge 충돌` 을 출력한다. phase 01 이 루트를 비웠으므로 충돌은 나지 않아야 한다.

### 2. wrapper 를 만들고 합친 백엔드를 검증한다

백엔드 CI 와 같은 방식으로 wrapper jar 를 만들고 CI 와 같은 검사를 돌린다.

```bash
# cwd: <worktree root>
(cd backend && mise exec gradle@9.5.0 -- gradle wrapper --gradle-version 9.5.0)
git checkout -- backend/gradlew backend/gradlew.bat backend/gradle/wrapper/gradle-wrapper.properties
git check-ignore -q backend/gradle/wrapper/gradle-wrapper.jar   # jar 는 추적되지 않는다
(cd backend && ./gradlew checkstyleMain checkstyleTest test --no-daemon)
```

검사가 실패하면 커밋하지 않고 `git merge --abort` 한 뒤 실패 내용을 보고한다.

### 3. merge commit 을 만든다

```bash
# cwd: <worktree root>
test -z "$(git status --porcelain --untracked-files=all | grep -v '^A  backend/' || true)"   # merge 로 들어온 것 말고 변경이 없다
git commit --no-edit -m "chore(repo): 백엔드 이력을 backend/ 로 합친다"
rm -rf /private/tmp/mono-be-import
```

## 검증

```bash
# cwd: <worktree root>
test -f backend/build.gradle.kts && test -f backend/src/main/java/com/bifos/accountbook/AccountBookApplication.java
test "$(git rev-list --parents -n 1 HEAD | wc -w)" -eq 3          # HEAD 가 부모 둘인 merge commit 이다
test "$(git log --oneline -- backend/build.gradle.kts | wc -l)" -ge 2
test "$(git rev-list --count HEAD^2)" = "$(git -C /Users/nhn/personal/fos-accountbook-backend rev-list --count origin/main)"   # 백엔드 원래 main 의 커밋 수와 같다
test ! -e build.gradle.kts && test ! -e src                  # 루트에 백엔드 파일이 없다
test -z "$(git ls-files backend/gradle/wrapper/gradle-wrapper.jar)"   # jar 를 커밋하지 않았다
(cd backend && ./gradlew checkstyleMain checkstyleTest test --no-daemon)
```

모두 종료 코드 0 이어야 한다. `backend/gradle/wrapper/gradle-wrapper.jar` 가 없으면 작업 항목 2의 wrapper 명령을 먼저 돌린다.

## 변경 파일

| 파일 | 변경 |
|---|---|
| `backend/**` | 신규 (merge) |
