# planning 오버레이 — fos-accountbook-backend

공용 코어(`~/.claude/skills/planning`)에 fos-accountbook-backend 특화를 주입한다.
코어의 8단계 skeleton 을 이 레포의 도메인(Spring Boot 백엔드)·docs 컨벤션·검증에 맞춰 채운다.

## 도메인: 백엔드 (Java 21 / Spring Boot / Gradle)

- **3단계 (호출 흐름)**: 주요 API 호출 시퀀스를 구체화. 요청 → Service → Repository → 응답 흐름과 인증/권한 체크 지점, 에러 흐름(4xx/5xx)·빈 상태·동시성 충돌을 점검.
- **4·5단계는 병합**: 화면이 없으므로 "엔드포인트별 요청/응답 스키마"로 한 번에 설계 (경로·메서드·DTO 필드·검증 규칙).
- **6단계**: 엔티티/마이그레이션 변경 시 cascade·soft delete 정책(ADR-B03) 위반 여부를 반드시 점검.

## docs 컨벤션

갱신 대상 문서 (모두 `docs/` 아래 단일 파일, 디렉터리 분리 없음):

| 내용 유형 | 단일 소스 | 다른 문서 |
|---|---|---|
| 제품 목적 / 기능 요구사항 | `docs/prd.md` | flow 는 흐름만 재언급 |
| 호출 흐름 / 시나리오 | `docs/flow.md` | prd 는 목표만, ADR 은 결정만 |
| DB 테이블 / 관계 / 제약 | `docs/data-schema.md` | ADR 은 결정 근거만 |
| 디렉터리 / 레이어 / API 전략 | `docs/code-architecture.md` | ADR 은 결정 근거만 |
| 기술 결정 근거 (왜) | `docs/adr.md` (append, 개별 파일 신설 금지) | 다른 docs 는 `ADR-BNN` 번호 링크 |

### ADR 자명성 점검 (작성 전 필수 자문)

아래 3개에 **모두 NO** 여야 ADR 로 기록. 하나라도 YES 면 대안 채널(CLAUDE.md 규칙/코드 주석/커밋 메시지/다른 docs)로 내려보낸다.

1. `build.gradle` · lockfile · `docker-compose.yml` · JPA 엔티티 · 디렉터리 트리 · Checkstyle 설정 중 어느 하나를 보면 같은 정보를 얻는가?
2. "왜 X 를 선택했다" 를 1~2 문장 이상으로 설명하기 어려운가?
3. 다른 프로젝트에서도 일반적으로 하는 선택인가?

**유지 적격**(3개 모두 NO): 라이브러리 고유 함정 / 실험 결과(수치) / 대안 기각 근거 / 정책·규칙 / 비용·성능 트레이드오프.

### ADR 구조 템플릿

```markdown
## ADR-BNN: {제목 — 결정의 한 줄 요약}

**결정**: {무엇을 — 1~3 문장}

**이유**:

- {맥락 / 대안 기각 근거를 항목별로}
```

**금지**: 코드 블록 10줄 이상(1~3줄 식별자 예시만 허용) · 파일 경로 3개 이상 나열 · "변경 항목 1/2/3/4" 작업 내역 · CLAUDE.md 스택 규칙 반복.

## 검증

- **critic 패턴 경로**: `.claude/skills/_shared/common-critic-patterns.md` — 이 레포는 파일명이 `common-pitfalls.md` 가 아니라 `common-critic-patterns.md` 이니 혼동 금지.
- 시드 P1~P7 은 코어 `verify-task.sh` 5 패턴과 겹치는 항목이 자동 검출된다. 나머지는 self-check.
- **backend-fos 전용 +α** (같은 파일 "backend-fos" 절): `@Transactional` 경계 누락(BE1), Entity-DTO 노출(BE2), AOP 자기호출 우회(BE3). 엔드포인트·서비스 phase 마다 self-check.

## plan / ADR 네이밍

```bash
# cwd: <repo root>
ls tasks/ | grep "plan{후보번호}"
grep "^## ADR-B{후보번호}" docs/adr.md
gh pr list --state open --json number,headRefName,title --jq '.[] | "\(.headRefName) \(.title)"'
```

ADR 번호는 `ADR-B` 접두어(backend 전용, 프론트엔드 `fos-accountbook` 과 번호 공간 분리).

## index.json 스키마 (레포 특화 — 코어 예시와 필드명 다름)

```jsonc
{
  "plan": "plan{N}",
  "slug": "{kebab-slug}",
  "title": "한 줄 제목",
  "issue": "#{GitHub 이슈 번호}",   // 없으면 생략
  "status": "pending",              // pending | in_progress | completed | failed
  "phases": [
    {
      "id": "phase-01",
      "title": "phase 제목",
      "file": "phase-01.md",
      "model": "sonnet",           // haiku | sonnet | opus
      "status": "pending"
    }
  ]
}
```

`total_phases`/`created_at`/`current_phase`/`depends_on`/`related_docs` 필드는 이 레포에서 쓰지 않는다.

## branch / 커밋 / 핸드오프

- **branch**: `plan/{N}-{slug}` (origin/main 기준 신규 브랜치, 이전 plan 브랜치 위에 쌓지 않는다).
- **커밋**: docs 변경 + task 파일을 **한 커밋**으로 묶는다. 메시지: `docs(plan{N}): {plan 한 줄 요약}`.
- **push + PR 필수** — `main` 직접 push 가 branch protection 으로 차단되므로 `git push -u origin plan/{N}-{slug}` 후 `gh pr create --base main --head plan/{N}-{slug}`. PR 본문: docs 변경 + task phase 목록 요약 + Test plan(구현 PR 검증 항목).
- **main 복귀**: PR 생성 후 `git switch main`.
- **핸드오프**: `/build-with-teams plan{N}` 로 구현 시작 안내 (PR 머지 후 실행 가능 — task 파일이 origin/main 에 있어야 어디서든 시작 가능).
- **중복 실행 방지**: origin/main 의 최신 `index.json.status` 가 `"completed"` 면 `/build-with-teams plan{N}` 재실행 금지. 동일 plan 을 두 세션이 동시에 잡으면 PR 브랜치 충돌로 자연 감지.
