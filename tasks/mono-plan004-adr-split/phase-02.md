# Phase 02. 참조 링크와 하네스 규칙 갱신, 링크 검사

**Execution profile**: standard
**Domain**: markdown-write

## 목표

`adr.md` 와 `adr.md#adr-…` 를 가리키던 모든 참조를 새 파일로 바꾸고, ADR 을 추가하는 규칙을 「파일 하나와 INDEX 한 줄」 로 바꾼다. 깨진 ADR 링크를 CI 에서 잡는다.

**범위 외**: ADR 본문 내용 수정.

## 컨텍스트

- 참조 위치 찾기: `git grep -n "adr\.md"`. 2026-09-30 기준 22개 파일 46곳이며, 선행 계획 머지로 더 늘었을 수 있다. 주요 위치는 아래다.
  - `CLAUDE.md`, `frontend/CLAUDE.md`, `backend/CLAUDE.md`, `frontend/README.md`, `backend/README.md`
  - `.claude/docs-check-overlay.md`, `frontend/.claude/{planning,docs-check,build-with-teams,review-fix}-overlay.md`, `backend/.claude/{planning,docs-check,build-with-teams}-overlay.md`
  - `.github/claude-review-prompt-{common,frontend,backend}.txt`
  - `frontend/docs/*.md`, `backend/docs/*.md` 와 새 ADR 파일 본문 안의 교차 링크(`#adr-f13` 같은 같은 파일 앵커 포함)
- `frontend/.claude/planning-overlay.md` 와 `backend/.claude/planning-overlay.md` 는 "`docs/adr.md` (단일 파일, append)", "개별 파일 신설 금지" 규칙을 적고 있다. ADR-M02 로 뒤집힌다.
- `.claude/docs-check-overlay.md` 는 `docs/adr.md` 에서 번호를 grep 해 목차와 본문을 비교한다. INDEX.md 와 파일 이름 비교로 바꾼다.
- 프론트 CI(`.github/workflows/frontend-ci.yml`)는 `pnpm lint:md` 를 돈다. 백엔드와 루트 문서는 CI 가 없다.

**근거 문서**: `docs/adr.md` 의 ADR-M02 (phase 01 뒤에는 docs/adr 디렉터리의 ADR-M02 파일)

## 의도 메모

- 링크 형식: 같은 디렉터리 안은 `ADR-F13-…md`, 다른 디렉터리에서는 상대 경로. 앵커 없이 파일로 연결한다.
- 문장 속 `ADR-F16` 같은 번호 표기는 링크가 아니면 그대로 둔다.
- 링크 검사는 저장소 전체 markdown 과 `.github/*.txt` 에서 `adr.md` 문자열이 남지 않았는지, `docs/adr/ADR-` 로 가는 상대 링크의 대상 파일이 있는지 본다. 프론트 CI 는 `frontend/**` 변경에만 돌므로, 검사 스크립트는 루트 `scripts/` 에 두고 세 곳 중 어디가 바뀌어도 도는 새 워크플로 하나를 만든다.

## 작업 항목

### 1. 참조 치환

- `git grep -n "adr\.md"` 결과를 모두 새 파일 경로나 INDEX.md 로 바꾼다. 번호 앵커 링크는 해당 ADR 파일로 바꾼다. 치환은 일회성 스크립트로 하고 커밋하지 않는다.

### 2. 하네스 규칙

- 두 `planning-overlay.md` 의 docs 컨벤션 표와 ADR 네이밍 절: "ADR 은 `docs/adr/ADR-{F|B}NN-<slug>.md` 새 파일, `docs/adr/INDEX.md` 에 한 줄 추가". 다음 번호 찾기: `ls docs/adr | grep -oE 'ADR-F[0-9]+' | sort -V | tail -1`.
- `.claude/docs-check-overlay.md` 의 목차 대조 명령을 INDEX.md 와 파일 목록 대조로 바꾼다.
- `CLAUDE.md` 의 저장소 배치 표와 소유 문장, 두 하위 `CLAUDE.md` 의 컨텍스트 문서 표.

### 3. 링크 검사 스크립트 `scripts/check-adr-links.py`

- 저장소의 `*.md`, `.github/**/*.txt`, `.claude/**/*.md` 를 훑어 (a) `adr.md` 문자열, (b) `adr/ADR-…md` 상대 링크 중 대상이 없는 것, (c) 세 INDEX.md 의 행과 파일 목록 불일치를 출력하고 하나라도 있으면 종료 코드 1.
- `tasks/` 는 제외한다.

### 4. CI `.github/workflows/docs-ci.yml`

- `**/*.md`, `.github/**`, `.claude/**` 가 바뀐 PR 에서 `python3 scripts/check-adr-links.py` 를 돈다.

### 5. 검사 스크립트 테스트

- `scripts/test_check_adr_links.py`(표준 `unittest`): 임시 디렉터리에 깨진 링크, 남은 `adr.md`, INDEX 누락 파일을 만들어 각각 종료 코드 1, 정상 구성은 0.

## 검증

```bash
# cwd: <repo root>
python3 -m unittest scripts/test_check_adr_links.py
python3 scripts/check-adr-links.py
git grep -n "adr\.md" -- ':!tasks'   # 결과 없음
cd frontend && pnpm lint:md
```

## 변경 파일

| 파일 | 변경 |
|---|---|
| `CLAUDE.md` | 수정 |
| `frontend/CLAUDE.md` | 수정 |
| `backend/CLAUDE.md` | 수정 |
| `frontend/README.md` | 수정 |
| `backend/README.md` | 수정 |
| `.claude/docs-check-overlay.md` | 수정 |
| `frontend/.claude/planning-overlay.md` | 수정 |
| `frontend/.claude/docs-check-overlay.md` | 수정 |
| `frontend/.claude/build-with-teams-overlay.md` | 수정 |
| `frontend/.claude/review-fix-overlay.md` | 수정 |
| `backend/.claude/planning-overlay.md` | 수정 |
| `backend/.claude/docs-check-overlay.md` | 수정 |
| `backend/.claude/build-with-teams-overlay.md` | 수정 |
| `.github/claude-review-prompt-common.txt` | 수정 |
| `.github/claude-review-prompt-frontend.txt` | 수정 |
| `.github/claude-review-prompt-backend.txt` | 수정 |
| `frontend/docs/*.md` | 수정 |
| `backend/docs/*.md` | 수정 |
| `frontend/docs/adr/ADR-F*.md` | 수정 |
| `backend/docs/adr/ADR-B*.md` | 수정 |
| `docs/adr/ADR-M*.md` | 수정 |
| `scripts/check-adr-links.py` | 신규 |
| `scripts/test_check_adr_links.py` | 신규 |
| `.github/workflows/docs-ci.yml` | 신규 |
