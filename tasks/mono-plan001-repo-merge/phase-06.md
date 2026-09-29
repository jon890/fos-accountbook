# Phase 06. 백엔드 하네스를 정리한다

**Execution profile**: standard

## 목표

백엔드 지침과 오버레이를 모노레포 배치에 맞추고, 합친 뒤 쓸 곳이 없어진 스킬과 사본, 계획서를 지운다.

**범위 외**: 백엔드 코드와 Gradle 설정. 루트와 프론트엔드 하네스는 phase 05 가 맡았다.

## 컨텍스트

- phase 02 이후 백엔드 하네스는 `backend/CLAUDE.md`, `backend/.claude/{planning,build-with-teams,docs-check}-overlay.md`, `backend/.claude/skills/` 에 있다.
- `backend/.claude/skills/` 에는 셋이 있다.
    - `_shared/common-critic-patterns.md`: 백엔드 반복 함정 목록. 남긴다.
    - `integrate-api-contract/`: 저장소 사이 API 계약 협의 스킬. 지운다.
    - `planning/task-create.md`: 공용 코어 planning 의 사본. 지운다.
- `backend/skills-lock.json` 은 설치되지 않은 `java-springboot` 하나만 적고 있다.
- `backend/tasks/` 에는 구현을 마친 계획서와 `schema.ts` 가 있다.
- `backend/CLAUDE.md` 에는 프론트엔드에서 이미 지운 절과 같은 절이 남아 있다: 「토큰 효율」, 「파일 읽기 효율」, 「조사/탐색 접근 방식」, 「한국어 표현 정책」, 「docs / ADR 작성 형식」.
- `backend/docs/adr.md` 의 ADR-B14 는 리뷰 워크플로 결정이다. 리뷰 워크플로가 하나로 합쳐져 `frontend/docs/adr.md` 의 ADR-F11 이 소유한다.

**근거 문서**: `docs/adr.md` 의 ADR-M01 「적용 범위」 표의 하네스, 스킬, 협의 행

ADR-B14 를 대체하는 결정은 `frontend/docs/adr.md` 의 ADR-F11 「적용 범위」 에 있다.

## 의도 메모

- 구현을 마친 계획서는 지운다. 현재 사실은 docs 와 코드가 소유하고, 계획서는 구현 뒤 곧 낡아 다시 참조하면 틀린 근거가 된다.
- ADR 은 지우지 않는다. ADR-B14 는 `status: superseded` 로 바꾸고 결정 바로 아래 「대체된 부분」 에 ADR-F11 을 링크한다.
    - 이 phase 가 docs 를 고치는 유일한 곳이다. 백엔드 docs 는 phase 02 에서야 이 저장소에 들어와 planning 단계에서 고칠 수 없었다.
- `backend/CLAUDE.md` 에서 지우는 절은 프론트엔드에서 같은 이유로 지운 것이다. 시스템 프롬프트, 공용 스킬, 전역 korean-check 가 이미 소유한다.

## 작업 항목

### 1. 쓸 곳이 없어진 파일을 지운다

`backend/.claude/skills/integrate-api-contract/`, `backend/.claude/skills/planning/`, `backend/tasks/`, `backend/skills-lock.json` 을 `git rm -r` 한다.

### 2. `backend/CLAUDE.md` 를 정리한다

- 「핵심 워크플로우 스킬」 표에서 `/integrate-api-contract` 행을, 「팀 소통」 절 전체를 지운다.
- 컨텍스트에 적은 다섯 절을 지운다.
- 「Task 작업 규칙」 절 전체와, 「Git & PR Conventions」 절 가운데 「### Commit & Push 절차」 를 뺀 나머지(머리 목록과 「### 브랜치 명명」)를 지운다.
    - 두 절은 루트와 충돌하는 규칙을 담고 있다. `feat/plan{N}` 구현 브랜치 분리, task 완료마다 index.json 갱신 커밋, phase 안 docs 변경 금지가 그 예다.
    - 지운 자리에 「Task 작업 규칙과 브랜치, PR 규칙은 루트 `CLAUDE.md` 를 따른다.」 한 줄을 둔다. 「### Commit & Push 절차」 는 그 아래에 그대로 남긴다.

### 3. 백엔드 오버레이 세 개

- 각 파일 앞에 `## 저장소 배치` 표를 둔다: docs `backend/docs/`, tasks `tasks/`, 접두사 `be-`.
- 명령의 `# cwd:` 를 `backend` 로, 반복 함정 경로를 `backend/.claude/skills/_shared/common-critic-patterns.md` 로 고친다.
- `planning-overlay.md`
    - 「검증」 절의 코어 `verify-task.sh` 언급을 코어 `verify_task.py` 로 바꾼다. 코어 스크립트 이름이 바뀌었다.
    - 「plan / ADR 네이밍」 절의 `ls tasks/ | grep "plan{후보번호}"` 를 `bash ~/.claude/skills/planning/scripts/plan_number.sh --prefix be-` 로 바꾼다.
    - 「index.json 스키마」 의 `"model"` 필드를 `"execution_profile": "standard"   // fast | standard | deep` 으로 바꾼다.
    - 「branch / 커밋 / 핸드오프」 절을 지우고 「브랜치, 커밋, 핸드오프는 루트 `.claude/planning-overlay.md` 를 따른다.」 한 줄을 둔다.
- `build-with-teams-overlay.md`
    - 「task 스키마 세부」 예시의 `"model": "sonnet"` 을 `"execution_profile": "standard"` 로 바꾼다.
    - 「브랜치 규칙」 절을 지우고 「브랜치와 PR 은 루트 `.claude/build-with-teams-overlay.md` 를 따른다.」 한 줄을 둔다.
    - 「완료 후 추가 단계 — 프론트엔드 영향 분석」 절 전체를 지운다. 프론트엔드 저장소에 이슈를 만드는 절차라 ADR-M01 협의 행과 모순된다.
    - 「worktree 직후 환경 setup」 의 `./gradlew dependencies` 앞에 `mise exec gradle@9.5.0 -- gradle wrapper --gradle-version 9.5.0` 을 둔다. 백엔드는 `gradle-wrapper.jar` 를 추적하지 않는다.

### 4. ADR-B14 를 대체됨으로 표시한다

`backend/docs/adr.md` 의 ADR-B14 결정 바로 아래에 둔다.

- `**status**: superseded`
- `**대체된 부분**: 리뷰 워크플로가 모노레포 하나로 합쳐져 결정 전체를 [ADR-F11](../../frontend/docs/adr.md#adr-f11) 이 소유한다.`

Index 줄 끝에도 `(대체됨)` 을 붙인다.

### 5. 대상 판정과 백엔드 검증

아래 「검증」 절을 그대로 돌린다. `backend/gradle/wrapper/gradle-wrapper.jar` 가 없으면 첫 명령으로 만든다. 만든 jar 는 `.gitignore` 에 걸려 커밋되지 않는다.

## 검증

```bash
# cwd: <worktree root>
OP=~/.claude/skills/planning/scripts/overlay_paths.py
python3 $OP --skill planning backend/src/main/java/com/bifos/accountbook/AccountBookApplication.java | python3 -c "import json,sys; d=json.load(sys.stdin); assert d['targets']==['backend'], d"
python3 $OP --skill planning frontend/src/proxy.ts backend/build.gradle.kts | python3 -c "import json,sys; d=json.load(sys.stdin); assert sorted(d['targets'])==['backend','frontend'], d"
bash ~/.claude/skills/planning/scripts/plan_number.sh --prefix be- | tail -1      # 다음 번호: 1
test ! -e backend/tasks && test ! -e backend/.claude/skills/planning && test ! -e backend/.claude/skills/integrate-api-contract
! grep -q "integrate-api-contract\|GitHub Issues\|backend-issue\|fos-accountbook-frontend" backend/CLAUDE.md backend/.claude/*.md
! grep -q '"model"' backend/.claude/planning-overlay.md backend/.claude/build-with-teams-overlay.md
grep -n "superseded" backend/docs/adr.md
test -f backend/gradle/wrapper/gradle-wrapper.jar || (cd backend && mise exec gradle@9.5.0 -- gradle wrapper --gradle-version 9.5.0 && git checkout -- gradlew gradlew.bat gradle/wrapper/gradle-wrapper.properties)
test -z "$(git ls-files backend/gradle/wrapper/gradle-wrapper.jar)"
(cd backend && ./gradlew checkstyleMain checkstyleTest test --no-daemon)
```

모두 종료 코드 0 이어야 한다.

## 변경 파일

| 파일 | 변경 |
|---|---|
| `backend/.claude/skills/integrate-api-contract/SKILL.md` | 삭제 |
| `backend/.claude/skills/planning/task-create.md` | 삭제 |
| `backend/tasks/**` | 삭제 |
| `backend/skills-lock.json` | 삭제 |
| `backend/CLAUDE.md` | 수정 |
| `backend/.claude/planning-overlay.md` | 수정 |
| `backend/.claude/build-with-teams-overlay.md` | 수정 |
| `backend/.claude/docs-check-overlay.md` | 수정 |
| `backend/docs/adr.md` | 수정 |
