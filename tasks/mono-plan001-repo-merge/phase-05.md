# Phase 05. 루트와 프론트엔드 하네스를 배치한다

**Execution profile**: standard

## 목표

저장소 공통 지침과 오버레이를 루트에, 프론트엔드 전용 지침과 오버레이를 `frontend/` 에 둔다.
공용 스킬 코어가 대상 하위 프로젝트를 정하고 그 오버레이를 읽을 수 있게 한다.

**범위 외**: 백엔드 하네스(phase 06). 지침의 규칙 내용은 바꾸지 않고 자리만 나눈다. 아래에 적은 삭제만 예외다.

## 컨텍스트

- phase 01 이 프론트엔드 `CLAUDE.md` 와 `.claude/` 를 `frontend/` 아래로 옮겼다. 루트에는 `CLAUDE.md` 와 `.claude/` 가 없다.
- 공용 스킬 코어(fos-skills planning 2.9.0 이상)는 루트 바로 아래 디렉터리에 `.claude/*-overlay.md` 가 있으면 모노레포로 판정한다.
    - 오버레이는 `<sub>/.claude/<skill>-overlay.md` → `.claude/<skill>-overlay.md` → `<sub>/CLAUDE.md` → 루트 `CLAUDE.md` 순서로 값 하나씩 찾는다.
    - 오버레이의 `## 저장소 배치` 표가 docs 경로, tasks 경로, plan 접두사를 정한다. 형식은 코어의 `planning/references/monorepo.md` 가 소유한다.
- Claude Code 는 하위 디렉터리의 `.claude/skills` 를 그 디렉터리 파일을 처음 읽을 때 로드하고, 이름이 같으면 루트 스킬을 먼저 쓴다.

**근거 문서**: `docs/adr.md` 의 ADR-M01 「적용 범위」 표의 문서, 하네스, 스킬, plan 번호, 협의 행

## 의도 메모

- 같은 규칙을 루트와 `frontend/CLAUDE.md` 에 두지 않는다. 공통은 루트, 하위 프로젝트 전용은 그 아래다.
- 「프론트엔드 ↔ 백엔드 협의는 GitHub Issues」 절과 `/backend-issue` 언급은 지운다. ADR-M01 협의 행이 근거다.
- 구현을 마친 계획서를 지우는 규칙과 이유는 루트 `CLAUDE.md` 로 옮긴다. 문구는 바꾸지 않는다.

## Blocked 조건

- `~/.claude/skills/planning/scripts/overlay_paths.py` 가 없으면(fos-skills PR #57 미반영) → `PHASE_BLOCKED: 공용 코어 모노레포 지원 미반영` 출력 후 종료

## 작업 항목

### 1. 루트 `CLAUDE.md` 와 `frontend/CLAUDE.md` 를 나눈다

- 루트 `CLAUDE.md` 를 새로 만든다. 담는 것: 저장소 배치(`frontend/`, `backend/`, 루트 `docs/adr.md` 의 ADR-M), 핵심 워크플로우 스킬 표, Task 작업 규칙, 문서 작성 원칙, Git & PR Conventions.
    - Git & PR 절의 브랜치 표는 `plan/{접두사}{N}-{slug}` 로 고친다(예 `plan/fe-001-login`). 관련 없는 예시(Prometheus, Redis, NSC)는 지운다.
    - 커밋 전 검증은 「바뀐 하위 프로젝트의 검증 명령」 으로 적고 두 명령을 둔다: `cd frontend && pnpm lint && pnpm test`, `cd backend && ./gradlew checkstyleMain checkstyleTest test`.
- `frontend/CLAUDE.md` 에서 루트로 옮긴 절과 「팀 소통」 절을 지운다. 컨텍스트 문서 표의 링크는 `frontend/` 기준 상대경로 그대로 둔다.

### 2. 루트 오버레이 네 개

`frontend/.claude/*-overlay.md` 에서 저장소 공통 부분을 떼어 루트 `.claude/` 에 둔다.

- `planning-overlay.md`: `## 저장소 배치` 표(docs `docs/`, tasks `tasks/`, 접두사 `mono-`), 커밋과 핸드오프 절, plan 번호 조회를 `plan_number.sh --prefix <접두사>` 로 한다는 절
- `build-with-teams-overlay.md`: 작업 공간 준비, 에이전트 이름 표, 브랜치와 PR 절
- `docs-check-overlay.md`: 하네스 지침 제외, 루트 `docs/adr.md` 의 ADR-M Index 동기화 검증 명령
- `review-fix-overlay.md`: 봇 등급은 `.github/claude-review-prompt-common.txt` 의 「등급」 절을 가리킨다

### 3. 프론트엔드 오버레이 네 개

`frontend/.claude/*-overlay.md` 에 전용 부분만 남기고 경로를 고친다.

- 각 파일 앞에 `## 저장소 배치` 표를 둔다: docs `frontend/docs/`, tasks `tasks/`, 접두사 `fe-`.
- 명령의 `# cwd:` 를 `frontend` 로, 반복 함정 경로를 `frontend/.claude/skills/_shared/common-pitfalls.md` 로 고친다.
- `planning-overlay.md` 의 「plan / ADR 네이밍」 절의 git 이력 조회 명령은 `plan_number.sh --prefix fe-` 로 바꾼다.
- `build-with-teams-overlay.md` 의 index.json 스키마에서 `model` 을 지우고 `execution_profile`(fast, standard, deep)을 쓴다. 코어 검사기가 둘을 함께 두는 것을 막는다.

### 4. 스킬과 도구 버전

- `frontend/.claude/skills/commit-convention/` 을 루트 `.claude/skills/commit-convention/` 으로 `git mv` 하고 커밋 전 검증을 1번의 두 명령으로 고친다.
- 루트 `.tool-versions` 를 `backend/.tool-versions` 내용으로 바꾸고 `backend/.tool-versions` 를 지운다.
- `frontend/.claude/scheduled_tasks.lock` 를 지우고 루트 `.gitignore` 에 `.claude/scheduled_tasks.lock` 를 더한다. 실행 중에 바뀌는 잠금 파일이다.

### 5. 대상 판정 검증

공용 코어의 판정 스크립트로 경로별 대상이 맞는지 확인한다.

## 검증

```bash
# cwd: <worktree root>
OP=~/.claude/skills/planning/scripts/overlay_paths.py
python3 $OP --skill planning frontend/src/proxy.ts | python3 -c "import json,sys; d=json.load(sys.stdin); assert d['monorepo'] and d['targets']==['frontend'], d"
python3 $OP --skill planning docs/adr.md; echo "exit=$?"          # 루트 대상 판정 결과를 확인한다
bash ~/.claude/skills/planning/scripts/plan_number.sh --prefix fe- | tail -1     # 다음 번호: 1
grep -c "GitHub Issues" CLAUDE.md frontend/CLAUDE.md                             # 둘 다 0
test -f .claude/skills/commit-convention/SKILL.md && test ! -e frontend/.claude/skills/commit-convention
test ! -e backend/.tool-versions && grep -q "java" .tool-versions
cd frontend && pnpm lint && pnpm lint:md && pnpm test
```

- 첫 판정은 오류 없이 끝나야 한다.
- 둘째 판정의 종료 코드와 `targets` 를 결과 보고에 적는다. 루트만 바뀐 경우를 코어가 어떻게 다루는지 확인하는 용도다.

## 변경 파일

| 파일 | 변경 |
|---|---|
| `CLAUDE.md` | 신규 |
| `frontend/CLAUDE.md` | 수정 |
| `.claude/planning-overlay.md` | 신규 |
| `.claude/build-with-teams-overlay.md` | 신규 |
| `.claude/docs-check-overlay.md` | 신규 |
| `.claude/review-fix-overlay.md` | 신규 |
| `frontend/.claude/planning-overlay.md` | 수정 |
| `frontend/.claude/build-with-teams-overlay.md` | 수정 |
| `frontend/.claude/docs-check-overlay.md` | 수정 |
| `frontend/.claude/review-fix-overlay.md` | 수정 |
| `.claude/skills/commit-convention/SKILL.md` | 신규 (이동) |
| `frontend/.claude/skills/commit-convention/SKILL.md` | 삭제 (이동) |
| `.tool-versions` | 수정 |
| `backend/.tool-versions` | 삭제 |
| `frontend/.claude/scheduled_tasks.lock` | 삭제 |
| `.gitignore` | 수정 |
