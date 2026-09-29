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
- 백엔드 커밋 SHA 는 바뀐다. 원래 SHA 는 아카이브할 백엔드 저장소에 남는다.
- 로컬 백엔드 사본은 읽기만 한다. 그 저장소의 브랜치와 원격을 바꾸지 않는다.

## Blocked 조건

- `git filter-repo` 가 없고 `brew install git-filter-repo` 도 실패하면 → `PHASE_BLOCKED: git-filter-repo 설치 실패` 출력 후 종료
- 백엔드에 열린 사람 PR 이 남아 있으면(`gh pr list -R jon890/fos-accountbook-backend --state open` 에 dependabot 이 아닌 작성자) → `PHASE_BLOCKED: 백엔드 열린 PR 정리 필요` 출력 후 종료

## 작업 항목

### 1. 백엔드를 새로 clone 해 경로를 다시 쓴다

```bash
# cwd: 아무 곳
BE_TMP=$(mktemp -d)
BE_URL=$(git -C /Users/nhn/personal/fos-accountbook-backend remote get-url origin)   # 이 머신은 SSH 별칭 github-personal 을 쓴다
git clone --no-local --single-branch --branch main "$BE_URL" "$BE_TMP/be"
git -C "$BE_TMP/be" filter-repo --to-subdirectory-filter backend --force
git -C "$BE_TMP/be" rev-list --count HEAD      # 원래 main 의 커밋 수와 같아야 한다
```

### 2. 이 브랜치에 merge commit 으로 합친다

```bash
# cwd: <worktree root>
git remote add be-import "$BE_TMP/be"
git fetch be-import main
git merge --allow-unrelated-histories --no-ff be-import/main \
  -m "chore(repo): 백엔드 이력을 backend/ 로 합친다"
git remote remove be-import
```

충돌이 나면 멈추고 `PHASE_BLOCKED: merge 충돌` 을 출력한다. phase 01 이 루트를 비웠으므로 충돌은 나지 않아야 한다.

### 3. 합친 백엔드를 검증한다

`backend/` 에서 백엔드 CI 와 같은 검사를 돌린다.

## 검증

```bash
# cwd: <worktree root>
test -f backend/build.gradle.kts && test -f backend/src/main/java/com/bifos/accountbook/AccountBookApplication.java
git log --oneline -- backend/build.gradle.kts | wc -l      # 2 이상
git rev-list --count HEAD^2                                  # 백엔드 원래 main 의 커밋 수와 같다
git -C /Users/nhn/personal/fos-accountbook-backend rev-list --count origin/main
test ! -e build.gradle.kts && test ! -e src                  # 루트에 백엔드 파일이 없다
cd backend && ./gradlew checkstyleMain checkstyleTest test --no-daemon
```

두 커밋 수가 같고 Gradle 검사가 종료 코드 0 이어야 한다.

## 변경 파일

| 파일 | 변경 |
|---|---|
| `backend/**` | 신규 (merge) |
