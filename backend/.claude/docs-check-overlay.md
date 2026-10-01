# docs-check 오버레이 — fos-accountbook-backend

공용 코어(`~/.claude/skills/docs-check`)에 fos-accountbook-backend 특화를 주입한다.
코어에 없는 항목만 채운다 — 6축 정의·Hybrid 실행 모델 등 코어와 겹치는 내용은 반복하지 않는다.

## 저장소 배치

| 값 | 값 |
| --- | --- |
| docs 경로 | `backend/docs/` |
| tasks 경로 | `tasks/` |
| plan 접두사 | `be-` |

## docs-verifier 전용 에이전트 없음

이 레포에는 `.claude/agents/` 가 없다 — docs-check 전용 검증 에이전트를 억지로 만들지 않는다.
코어의 "무거운 의미 검사" 위임은 범용 read-only 에이전트(`oh-my-claudecode:architect` 또는 `verifier`)로 대신한다.

## docs 구조

제품과 설계 문서는 `docs/` 바로 아래에 둔다.
ADR 은 `docs/adr/ADR-BNN-{slug}.md` 파일 하나와 `docs/adr/INDEX.md` 표 한 줄로 기록한다.

| 문서 | 담당 |
|---|---|
| `docs/prd.md` | 제품 목적 + MVP 범위 + 우선순위 |
| `docs/flow.md` | 사용자 흐름 + 도메인 간 이벤트 흐름 |
| `docs/adr/` | 결정별 ADR-B 파일에 기술 결정과 근거를 기록하고 `INDEX.md` 에서 찾는다 |
| `docs/data-schema.md` | DB 테이블 + 관계 + 제약 (프론트와 공유) |
| `docs/code-architecture.md` | 도메인 기반 패키지 구조 + 레이어 + API 전략 |
| `docs/testing-strategy.md` | 테스트 피라미드 + OpenAPI 계약 검증 + Spring Profiles |

대상 파일 수집 명령:

```bash
# cwd: backend
ls docs/*.md docs/adr/*.md CLAUDE.md .claude/build-with-teams-overlay.md .claude/docs-check-overlay.md .claude/planning-overlay.md
```

## ADR Index 동기화

INDEX 의 ADR 링크와 결정별 파일 목록을 대조한다.
링크는 앵커 없이 파일로 연결한다.

```bash
# cwd: backend
python3 ../scripts/check-adr-links.py
```

## 부패 (A축) 검사 grep — 레포 특화 대상

- **엔티티 ↔ `data-schema.md`**: `src/main/java/com/bifos/accountbook/**/domain/*.java` 의 `@Entity`/`@Column` 필드와 `docs/data-schema.md` 테이블 정의 대조.
- **엔드포인트 ↔ `flow.md`/`code-architecture.md`**: Controller 의 `@GetMapping`/`@PostMapping` 등 경로가 문서 예시와 일치하는지.
- **삭제된 식별자 잔존 검사**:

```bash
# cwd: backend
# ADR 이 "제거"라고 명시한 클래스/필드명이 src/ 에 실제로 없는지 역검증 (수동 대조 — 자동 grep 은 이름 뽑아서 실행)
grep -n "제거" docs/adr/ADR-B*.md
```

## common-pitfalls 경로

`backend/.claude/skills/_shared/common-critic-patterns.md` (파일명이 `common-pitfalls.md` 아님 — 다른 레포와 혼동 주의).

## 실행 주기·핸드오프

`build-with-teams` 대규모 plan 완료 후, 또는 외부 PR 머지 후 실행. 정리 대상 발견 시 별도 `chore/docs-cleanup-*` 브랜치 + PR — `main` 직접 push 는 branch protection 으로 차단된다 (`CLAUDE.md` Git & PR Conventions).
