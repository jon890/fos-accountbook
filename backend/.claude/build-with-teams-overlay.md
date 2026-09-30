# build-with-teams 오버레이 — fos-accountbook-backend

공용 코어(`~/.claude/skills/build-with-teams`)에 fos-accountbook-backend 특화를 주입한다.
코어에 없는 항목만 채운다 — 코어와 겹치는 일반 원칙(재시도 한도·worktree 격리·자발적 실행 방지 등)은 반복하지 않는다.

## 저장소 배치

| 값 | 값 |
| --- | --- |
| docs 경로 | `backend/docs/` |
| tasks 경로 | `tasks/` |
| plan 접두사 | `be-` |

## 통합 검증 명령

`CLAUDE.md` "Commands" 섹션이 단일 소스. 통합 검증은 `./gradlew checkstyleMain checkstyleTest test build -x integrationTest --no-daemon`.

## 브랜치 규칙

브랜치와 PR 은 루트 `.claude/build-with-teams-overlay.md` 를 따른다.

## 에이전트 이름

- **executor**: 레포 전용 executor 없음 — 코어 기본값 `oh-my-claudecode:executor` 사용.
- **docs-verifier**: 레포 전용 docs-verifier 없음 — `oh-my-claudecode:architect` (opus, read-only) 를 대신 쓴다. 검증 항목은 아래 "docs-verifier 검증 관점" 참조.

## task 스키마 세부

`index.json` 필드명이 코어 예시와 다르다. 아래 필드는 미사용:

- `total_phases`
- `created_at`
- `current_phase`
- `depends_on`
- `related_docs`


```jsonc
{
  "plan": "be-plan{N}",
  "slug": "{kebab-slug}",
  "title": "한 줄 제목",
  "issue": "#{GitHub 이슈 번호}",   // 없으면 생략
  "status": "pending",              // pending | in_progress | completed | failed
  "phases": [
    { "id": "phase-01", "title": "...", "file": "phase-01.md", "execution_profile": "standard", "status": "pending" }
  ]
}
```

phase 파일 경로: `tasks/{plan}-{slug}/phase-{N}.md`. planning 이 이미 `plan/be-{N}-{slug}` 브랜치에 task 를 만들어 두므로, 이 스킬은 보통 별도 생성 없이 검토 후 실행만 한다.

## common-pitfalls 경로

`backend/.claude/skills/_shared/common-critic-patterns.md` — **파일명이 `common-pitfalls.md` 가 아니다** (다른 레포와 다름, 혼동 주의).

critic·code-reviewer 는 P1~P7(공통) + "backend-fos" 절의 아래 3개를 사전 해소 점검 대상으로 쓴다:

- BE1 — `@Transactional` 경계
- BE2 — Entity-DTO 노출
- BE3 — AOP 자기호출 우회

## docs-verifier 검증 관점 (architect 위임 시 전달)

전용 도메인 에이전트가 없으므로, `oh-my-claudecode:architect` 스폰 시 아래 항목을 프롬프트에 명시한다:

1. `docs/adr.md` 결정사항 위반 여부 (특히 상황별 필수 ADR — `CLAUDE.md` "상황별 ADR 필수 참조" 표).
2. 레이어 규칙 (`presentation → application → domain ← infra`, Controller 가 Repository 직접 주입 금지).
3. 코딩 규칙 — Entity `@Data` 금지, Response DTO `static from(Entity)`, wildcard import 금지, 한국어 발음 표기 식별자 금지.
4. 문서 부패 — 제거·변경된 기능이 `docs/*.md` 에 dead reference 로 남아 있는지 `grep -rn`.

## 커밋 컨벤션

`CLAUDE.md` "Git & PR Conventions" 섹션이 단일 소스 — PR 제목 `type(scope): description` 형식, phase 별 atomic commit.

## worktree 직후 환경 setup

```bash
# cwd: backend
mise exec gradle@9.8.0 -- gradle wrapper --gradle-version 9.8.0
./gradlew dependencies --no-daemon
docker compose -f docker/compose.yml up -d   # 로컬 MySQL — 테스트는 H2 in-memory 사용이라 선택
```
