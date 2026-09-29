# docs-check 오버레이 — fos-accountbook-backend

공용 코어(`~/.claude/skills/docs-check`)에 fos-accountbook-backend 특화를 주입한다.
코어에 없는 항목만 채운다 — 6축 정의·Hybrid 실행 모델 등 코어와 겹치는 내용은 반복하지 않는다.

## docs-verifier 전용 에이전트 없음

이 레포에는 `.claude/agents/` 가 없다 — docs-check 전용 검증 에이전트를 억지로 만들지 않는다.
코어의 "무거운 의미 검사" 위임은 범용 read-only 에이전트(`oh-my-claudecode:architect` 또는 `verifier`)로 대신한다.

## docs 구조 (단일 파일 — 디렉터리 분리 없음)

모두 `docs/` 바로 아래 단일 파일. ADR 은 `docs/adr/*.md` 가 아니라 **`docs/adr.md` 한 파일**에 append.

| 문서 | 담당 |
|---|---|
| `docs/prd.md` | 제품 목적 + MVP 범위 + 우선순위 |
| `docs/flow.md` | 사용자 흐름 + 도메인 간 이벤트 흐름 |
| `docs/adr.md` | 기술 결정 + 왜 + 대안 기각 (`ADR-B` 접두어, backend 전용 번호 공간) |
| `docs/data-schema.md` | DB 테이블 + 관계 + 제약 (프론트와 공유) |
| `docs/code-architecture.md` | 도메인 기반 패키지 구조 + 레이어 + API 전략 |
| `docs/testing-strategy.md` | 테스트 피라미드 + OpenAPI 계약 검증 + Spring Profiles |

대상 파일 수집 명령:

```bash
# cwd: <repo root>
ls docs/*.md CLAUDE.md .claude/skills/*/SKILL.md .claude/build-with-teams-overlay.md .claude/docs-check-overlay.md .claude/planning-overlay.md
```

## ADR Index 동기화 — 단일 파일 변형

코어의 `<ADR_DIR>/*.md` 순회 명령은 이 레포에 안 맞는다 (ADR 이 여러 파일이 아니라 `docs/adr.md` 한 파일 안 heading). 앵커도 `<a id="adr-XXX">` 커스텀이 아니라 GitHub 자동 slug 다.

```bash
# cwd: <repo root>
BODY=$(grep -oE '^## ADR-B[0-9]+' docs/adr.md | grep -oE 'ADR-B[0-9]+' | sort -u)
INDEX=$(grep -oE '\[ADR-B[0-9]+\]' docs/adr.md | grep -oE 'ADR-B[0-9]+' | sort -u)
diff <(echo "$BODY") <(echo "$INDEX") && echo "OK: ADR Index synced"
```

## 부패 (A축) 검사 grep — 레포 특화 대상

- **엔티티 ↔ `data-schema.md`**: `src/main/java/com/bifos/accountbook/**/domain/*.java` 의 `@Entity`/`@Column` 필드와 `docs/data-schema.md` 테이블 정의 대조.
- **엔드포인트 ↔ `flow.md`/`code-architecture.md`**: Controller 의 `@GetMapping`/`@PostMapping` 등 경로가 문서 예시와 일치하는지.
- **삭제된 식별자 잔존 검사**:

```bash
# cwd: <repo root>
# ADR 이 "제거"라고 명시한 클래스/필드명이 src/ 에 실제로 없는지 역검증 (수동 대조 — 자동 grep 은 이름 뽑아서 실행)
grep -n "제거" docs/adr.md
```

## common-pitfalls 경로

`.claude/skills/_shared/common-critic-patterns.md` (파일명이 `common-pitfalls.md` 아님 — 다른 레포와 혼동 주의).

## 실행 주기·핸드오프

`build-with-teams` 대규모 plan 완료 후, 또는 외부 PR 머지 후 실행. 정리 대상 발견 시 별도 `chore/docs-cleanup-*` 브랜치 + PR — `main` 직접 push 는 branch protection 으로 차단된다 (`CLAUDE.md` Git & PR Conventions).
