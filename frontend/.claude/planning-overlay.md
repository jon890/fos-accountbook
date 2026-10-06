# fos-accountbook planning 오버레이

공용 코어(`~/.claude/skills/planning`)에 fos-accountbook 특화를 주입한다.
코어의 8단계 skeleton 을 이 레포의 도메인(Next.js 프론트엔드)·docs 컨벤션·검증에 맞춰 채운다.

## 저장소 배치

| 값 | 값 |
| --- | --- |
| docs 경로 | `frontend/docs/` |
| tasks 경로 | `tasks/` |
| plan 접두사 | `fe-` |

## 도메인: 프론트엔드 (Next.js App Router / React / TypeScript)

가계부 서비스의 프론트엔드. 백엔드(Spring Boot)는 같은 저장소의 `backend/` 에 있다. API 를 함께 바꾸는 변경은 PR 하나로 낸다(루트 `docs/adr/INDEX.md` 의 ADR-M01).

- **3단계 (호출/사용자 흐름)**: 시니어 UX 리서처 관점.
    - 화면 전환·사용자 액션·시스템 반응을 구체화한다.
    - 엣지 케이스(에러/빈 상태/권한 충돌)를 점검한다.
    - 백엔드 API 가 아직 없으면 같은 저장소의 `backend/` 변경을 함께 계획한다(ADR-M01).
- **4단계 (인터페이스)**: 각 화면의 정보·기능 체크리스트, 컴포넌트 구조 초안(Server/Client 경계), 상태 관리 방식.
- **5단계 (API/함수)**: Server Action 우선 (ADR-F04 — `actions/`와 `services/` 분리).
    - 신규 백엔드 엔드포인트가 필요하면 5단계에서 계약(요청/응답 스키마)을 먼저 확정한다.
    - 백엔드 변경을 함께 하면 plan 접두사를 `mono-` 로 두고 프론트와 백엔드 변경을 PR 하나에 담는다.
- **6단계**: `src/actions → src/services → src/lib/server` 레이어 일관성 확인.
    - 권한 검증은 ADR-F25 의 3 패턴(Single-family / Multi-family / Entity ownership) 중 하나로 명시한다.

### phase 의 domain 태그

phase 프런트매터의 `**Domain**:` 태그는 `frontend/.claude/skills/_shared/common-pitfalls.md` 의 「통제 어휘」 표에서 하나를 고른다.

## docs 컨벤션

갱신 대상 문서:

| 내용 유형 | 단일 소스 | 다른 문서 |
|---|---|---|
| 제품 목적 / 기능 범위 | `docs/prd.md` | flow 는 흐름만 재언급 |
| 사용자 흐름 / 화면 전환 | `docs/flow.md` | prd 는 목표만, ADR 은 결정만 |
| DB 스키마 / TypeScript 타입 / API 구조 | `docs/data-schema.md` | ADR 은 결정 근거만 |
| 디렉터리 / 레이어 분리 / API 전략 | `docs/code-architecture.md` | ADR 은 결정 근거만 |
| 테스트 범위·전략·우선순위 | `docs/testing-strategy.md` | — |
| 기술 결정 근거 (왜) | `docs/adr/ADR-FNN-{slug}.md` 파일 하나와 `docs/adr/INDEX.md` 한 줄 | 다른 docs 는 해당 ADR 파일 링크 |

### ADR 자명성 점검 (작성 전 필수 자문)

아래 3개에 **모두 NO** 여야 ADR 로 기록. 하나라도 YES 면 대안 채널(CLAUDE.md 규칙/코드 주석/커밋 메시지/다른 docs)로 내려보낸다.

1. `package.json` · lockfile · Tailwind `@theme` 토큰 정의 · 디렉터리 트리 · ESLint 설정 중 어느 하나를 보면 같은 정보를 얻는가?
2. "왜 X 를 선택했다" 를 1~2 문장 이상으로 설명하기 어려운가?
3. 다른 프로젝트에서도 일반적으로 하는 선택인가?

**유지 적격**(3개 모두 NO):

- 라이브러리 고유 함정
- 실험 결과(수치)
- 대안 기각 근거
- 정책·규칙
- 비용·성능 트레이드오프

### ADR 표기 중 이 레포에서만 다른 것

구조 뼈대는 코어 `task-create.md` 의 「ADR 구조 템플릿」 이 단일 소스다.
항목 이름과 순서, 넣지 않는 것은 그 뼈대를 그대로 따른다.
여기에는 이 레포가 실제로 다르게 쓰는 것만 둔다.

- **번호 접두어**: 프론트 ADR 은 `ADR-FNN` 을 쓴다.
    - 백엔드 결정은 `backend/docs/adr/INDEX.md` 의 ADR-B, 저장소 전체 결정은 루트 `docs/adr/INDEX.md` 의 ADR-M 이 소유한다. 여기에는 쓰지 않는다.
- **파일과 목록**: `docs/adr/ADR-FNN-{slug}.md` 를 만들고 `docs/adr/INDEX.md` 표에 한 줄을 더한다. 링크는 앵커 없이 파일로 연결한다.
- **제목 날짜**: 제목 끝에 `(YYYY-MM-DD)` 를 붙인다.
    - ADR-F24 이후로 굳은 관행이다.

### ADR 채워진 예시는 이 레포의 ADR 을 기준으로 삼는다

뼈대만 보고 쓰면 항목마다 분량과 구체성이 매번 달라진다.
새 ADR 을 쓸 때 아래를 먼저 읽고 그 수준을 맞춘다.
예시 본문을 이 문서에 복제하지 않는다. 복제본은 원본이 바뀔 때 낡는다.

| 무엇을 보려면 | 어느 ADR |
| --- | --- |
| 대안 기각을 어느 수준으로 쓰나 | [ADR-F13](../docs/adr/ADR-F13-oklch-color-system.md) — 기각 2건을 각각 한두 줄로, 왜 아닌지까지 남긴다 |
| 트레이드오프를 어떻게 쓰나 | [ADR-F28](../docs/adr/ADR-F28-toss-blue-brand-color.md) — 감수한 비용과 그것이 생긴 원인을 짝지어 적는다 |
| 실측으로 기각한 근거를 어떻게 남기나 | [ADR-F29](../docs/adr/ADR-F29-tailwind-markdown-scan.md) — 미채택 이유를 별 항목으로 빼고 재현 날짜와 함정 코드를 붙인다 |
| 적용 범위를 어디까지 적나 | [ADR-F14](../docs/adr/ADR-F14-pretendard-variable-font.md) — 파일 경로와 토큰 이름까지만, 코드 블록 없이 |

ADR-F01 부터 ADR-F12 는 코어 뼈대가 정착하기 전에 작성됐다.
`맥락` 대신 `이유` 를 쓰고 `대안 기각` 이 없는 것이 많아 예시로 삼지 않는다.

## 검증

- 반복 함정 목록은 `frontend/.claude/skills/_shared/common-pitfalls.md` 다.
    - 전체를 읽지 않고 「작업종류→함정 인덱스」 에서 해당 행만 참조한다.
- `Server Action 작성` 은 ADR-F25(권한 3패턴)와 ADR-F06(Zod 검증)을 phase 작성 시 직접 확인한다.
- `frontend/` 아래 markdown(`docs/`, `.claude/skills/`)은 `pnpm lint:md` 가 Tailwind arbitrary class 위험 패턴을 검출한다. 루트 `tasks/` 는 Tailwind 스캔 범위 밖이다(ADR-F29).

## plan / ADR 네이밍

```bash
# cwd: <repo root>
# 완료된 계획서는 지우므로 사용한 번호는 git 이력에서 찾는다
bash "$SKILL_DIR/scripts/plan_number.sh" --prefix fe- | tail -1
find frontend/docs/adr -maxdepth 1 -name 'ADR-F*.md' | sed -E 's/.*ADR-F([0-9]+)-.*/\1/' | sort -n | tail -1
gh pr list --state open --json number,headRefName,title --jq '.[] | "\(.headRefName) \(.title)"'
```

서브넘버 규칙(동일 도메인 후속 작업)은 코어 기본값 그대로 (`plan{N}` → `plan{N}-2`).
