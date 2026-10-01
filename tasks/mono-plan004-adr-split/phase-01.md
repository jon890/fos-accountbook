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

- 세 원본 모두 `^## ADR-[FBM][0-9]{2}:` 제목 줄을 경계로 쓴다. 앵커가 없는 항목도 있다.
- 각 파일 맨 위에는 설명과 목차가 있다. 목차 제목은 `## ADR Index` 또는 `## Index` 이다. 목록은 INDEX.md 로 옮기고 원래 파일은 지운다.
- 목적과 규칙은 `docs/adr.md` 의 ADR-M02 에 있다.

**근거 문서**: `docs/adr.md` 의 ADR-M02

## 의도 메모

- 파일 이름: `ADR-F16-category-breakdown-aggregation.md` 처럼 번호 뒤에 영문 소문자 kebab 슬러그. 슬러그는 제목의 뜻을 2~5 단어로 옮긴다. 번호는 원래 두 자리를 그대로 쓴다.
- 파일 본문: 첫 줄을 `# ADR-F16: 제목 (날짜)` 로 올린다(`##` 를 `#` 로). 앵커 줄은 지운다. 나머지 본문은 그대로다. 본문 안의 제목 레벨(`###` 등)은 한 단계씩 올리지 않는다.
- ADR 앞의 목차와 앵커는 본문에서 제외한다. ADR 사이 구분선과 빈 줄, 후행 공백은 앞 ADR 본문에 그대로 남긴다.
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

실패한 검사는 즉시 중단한다. 분리 전에 HEAD SHA 를 기록하고, 그 커밋의 세 원본을 임시 디렉터리에 추출한다.
ADR 제목 경계로 나눈 원본에서 앵커 줄만 제거하고 첫 제목을 `#` 로 바꾼 결과를 새 파일과 번호별로 비교한다.
빈 줄, 구분선과 후행 공백을 정규화하지 않는다. 원본의 ADR 수, 파일 수와 INDEX 행 수가 모두 같아야 한다.
비교 스크립트는 임시 디렉터리에만 두고 실행 후 삭제한다. 세 INDEX.md 의 행 수와 파일 수를 확인한 뒤 `cd frontend && pnpm lint:md` 를 실행한다.

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
