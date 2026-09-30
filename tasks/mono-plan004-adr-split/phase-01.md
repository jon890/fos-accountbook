# Phase 01. 세 adr.md 를 개별 파일과 INDEX 로 분리

**Execution profile**: standard
**Domain**: markdown-write

## 목표

`frontend/docs/adr.md`, `backend/docs/adr.md`, `docs/adr.md` 를 각 디렉터리의 `adr/` 아래 결정별 파일과 `INDEX.md` 로 나눈다. 본문은 한 글자도 바꾸지 않는다.

**범위 외**: 다른 문서의 링크와 하네스 규칙은 phase 02 가 고친다. 이 phase 가 끝나면 `adr.md#adr-…` 링크가 잠시 깨진다. 두 phase 는 같은 PR 이다.

## 선행 조건

`fe-plan002`, `be-plan001`, `fe-plan003` 이 main 에 머지돼 있어야 한다. 세 계획이 `adr.md` 에 ADR 을 더한다.
확인: `git log origin/main --oneline | grep -E "fe-plan002|be-plan001|fe-plan003"` 결과가 세 계획 모두를 포함한다. 아니면 `PHASE_BLOCKED: 선행 계획 미머지` 를 출력하고 멈춘다.

## 컨텍스트

- 각 ADR 은 `<a id="adr-f16"></a>` 앵커 다음 `## ADR-F16: 제목 (날짜)` 로 시작하고, 다음 앵커 또는 파일 끝에서 끝난다. 백엔드 앞부분(ADR-B01~B16)은 앵커가 없을 수 있다. 제목 줄 `## ADR-` 을 경계로 쓴다.
- 각 파일 맨 위에는 설명과 `## ADR Index` 목록이 있다. 이 목록은 INDEX.md 로 옮기고 원래 파일은 지운다.
- 목적과 규칙은 `docs/adr.md` 의 ADR-M02 에 있다.

**근거 문서**: `docs/adr.md` 의 ADR-M02

## 의도 메모

- 파일 이름: `ADR-F16-category-breakdown-aggregation.md` 처럼 번호 뒤에 영문 소문자 kebab 슬러그. 슬러그는 제목의 뜻을 2~5 단어로 옮긴다. 번호는 원래 두 자리를 그대로 쓴다.
- 파일 본문: 첫 줄을 `# ADR-F16: 제목 (날짜)` 로 올린다(`##` 를 `#` 로). 앵커 줄은 지운다. 나머지 본문은 그대로다. 본문 안의 제목 레벨(`###` 등)은 한 단계씩 올리지 않는다.
- 분리는 일회성 스크립트로 한다. 스크립트는 커밋하지 않는다. 사람이 슬러그를 고른 매핑표(번호 → 슬러그)만 스크립트 입력으로 쓴다.
- 파일 이름에 한글을 쓰지 않는다. 셸과 링크에서 인코딩 문제가 없게 하기 위해서다.

## 작업 항목

### 1. 분리 스크립트 작성과 실행

- 작업 디렉터리 밖(`$TMPDIR`)에 파이썬 스크립트를 쓴다. 입력은 `adr.md` 경로, 접두어, 번호→슬러그 매핑. 출력은 `adr/ADR-{번호}-{슬러그}.md` 와 `adr/INDEX.md`.
- 세 파일에 차례로 실행하고 원래 `adr.md` 를 `git rm` 한다.

### 2. INDEX.md 형식 (세 디렉터리 같게)

```markdown
# ADR 목록 (프론트엔드)

프론트엔드 결정은 여기, 백엔드는 `backend/docs/adr/INDEX.md`, 저장소 전체는 `docs/adr/INDEX.md` 가 소유한다.
새 결정은 파일 하나를 만들고 아래 표에 한 줄을 더한다(ADR-M02).

| 번호 | 결정 | 상태 |
| --- | --- | --- |
| [ADR-F01](ADR-F01-app-router.md) | Next.js App Router 선택 | accepted |
```

- 상태는 본문의 `**status**` 값, 없으면 `accepted`.
- 원래 목차에 있던 한 줄 설명을 「결정」 칸에 쓴다.

### 3. 본문 보존 확인

- 분리 전 ADR 영역(목차 이후)과 분리 후 파일들을 이어 붙인 결과가 제목 레벨과 앵커 줄을 빼면 같은지 비교한다. 아래 검증 명령이 이것을 한다.

### 4. 검증 스크립트를 PR 에 남기지 않는다

- 비교 명령은 이 phase 의 검증 절에만 적는다. 계속 쓸 링크 검사는 phase 02 가 만든다.

## 검증

```bash
# cwd: <repo root>
fail=0
for d in frontend/docs backend/docs docs; do
  { test ! -e "$d/adr.md" && test -f "$d/adr/INDEX.md"; } || { echo "FAIL $d"; fail=1; }
  n_idx=$(grep -c '^| \[ADR-' "$d/adr/INDEX.md"); n_files=$(ls "$d"/adr/ADR-*.md | wc -l | tr -d ' ')
  [ "$n_idx" = "$n_files" ] || { echo "FAIL $d index=$n_idx files=$n_files"; fail=1; }
done
test "$fail" = 0
# 본문 보존: 분리 전 커밋의 adr.md 에서 앵커 줄과 '## ' 제목 레벨을 정규화한 본문과, 분리 후 파일 본문을 번호 순으로 이어 붙인 것을 diff 한다. 결과가 없어야 한다
python3 - <<'PY'
import re,subprocess,glob,sys
base=subprocess.check_output(["git","merge-base","HEAD","origin/main"]).decode().strip()
bad=0
for d,p in [("frontend/docs","F"),("backend/docs","B"),("docs","M")]:
    old=subprocess.check_output(["git","show",f"{base}:{d}/adr.md"]).decode()
    old=old[old.index(f"## ADR-{p}"):]
    old=re.sub(r'^<a id="[^"]+"></a>\n','',old,flags=re.M)
    old=re.sub(r'^---\s*$\n','',old,flags=re.M)
    new="".join(open(f).read().replace("# ADR-","## ADR-",1) for f in sorted(glob.glob(f"{d}/adr/ADR-*.md")))
    norm=lambda t:[l.rstrip() for l in t.splitlines() if l.strip()]
    if norm(old)!=norm(new): print("DIFF",d); bad=1
sys.exit(bad)
PY
cd frontend && pnpm lint:md
```

## 변경 파일

| 파일 | 변경 |
|---|---|
| `frontend/docs/adr.md` | 삭제 |
| `backend/docs/adr.md` | 삭제 |
| `docs/adr.md` | 삭제 |
| `frontend/docs/adr/INDEX.md` | 신규 |
| `backend/docs/adr/INDEX.md` | 신규 |
| `docs/adr/INDEX.md` | 신규 |
| `frontend/docs/adr/ADR-F*.md` | 신규 |
| `backend/docs/adr/ADR-B*.md` | 신규 |
| `docs/adr/ADR-M*.md` | 신규 |
