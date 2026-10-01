# planning 오버레이 — fos-accountbook-backend

공용 코어(`~/.claude/skills/planning`)에 fos-accountbook-backend 특화를 주입한다.
코어의 8단계 skeleton 을 이 레포의 도메인(Spring Boot 백엔드)·docs 컨벤션·검증에 맞춰 채운다.

## 저장소 배치

| 값 | 값 |
| --- | --- |
| docs 경로 | `backend/docs/` |
| tasks 경로 | `tasks/` |
| plan 접두사 | `be-` |

## 도메인: 백엔드 (Java 21 / Spring Boot / Gradle)

- **3단계 (호출 흐름)**: 주요 API 호출 시퀀스를 구체화. 요청 → Service → Repository → 응답 흐름과 인증/권한 체크 지점, 에러 흐름(4xx/5xx)·빈 상태·동시성 충돌을 점검.
- **4·5단계는 병합**: 화면이 없으므로 "엔드포인트별 요청/응답 스키마"로 한 번에 설계 (경로·메서드·DTO 필드·검증 규칙).
- **6단계**: 엔티티/마이그레이션 변경 시 cascade·soft delete 정책(ADR-B03) 위반 여부를 반드시 점검.

## docs 컨벤션

갱신 대상 문서는 `docs/` 아래에 두고, ADR 은 `docs/adr/` 에 결정별 파일로 둔다.

| 내용 유형 | 단일 소스 | 다른 문서 |
|---|---|---|
| 제품 목적 / 기능 요구사항 | `docs/prd.md` | flow 는 흐름만 재언급 |
| 호출 흐름 / 시나리오 | `docs/flow.md` | prd 는 목표만, ADR 은 결정만 |
| DB 테이블 / 관계 / 제약 | `docs/data-schema.md` | ADR 은 결정 근거만 |
| 디렉터리 / 레이어 / API 전략 | `docs/code-architecture.md` | ADR 은 결정 근거만 |
| 기술 결정 근거 (왜) | `docs/adr/ADR-BNN-{slug}.md` 파일 하나와 `docs/adr/INDEX.md` 한 줄 | 다른 docs 는 해당 ADR 파일 링크 |

### ADR 자명성 점검 (작성 전 필수 자문)

아래 3개에 **모두 NO** 여야 ADR 로 기록. 하나라도 YES 면 대안 채널(CLAUDE.md 규칙/코드 주석/커밋 메시지/다른 docs)로 내려보낸다.

1. `build.gradle` · lockfile · `docker-compose.yml` · JPA 엔티티 · 디렉터리 트리 · Checkstyle 설정 중 어느 하나를 보면 같은 정보를 얻는가?
2. "왜 X 를 선택했다" 를 1~2 문장 이상으로 설명하기 어려운가?
3. 다른 프로젝트에서도 일반적으로 하는 선택인가?

**유지 적격**(3개 모두 NO): 라이브러리 고유 함정 / 실험 결과(수치) / 대안 기각 근거 / 정책·규칙 / 비용·성능 트레이드오프.

### 채워진 ADR 예시

구조 뼈대와 넣지 않을 것의 단일 소스는 코어 `task-create.md` 의 「ADR 구조 템플릿」이다.
여기서는 그 뼈대를 어느 수준으로 채우는지를 이 레포의 실제 ADR 로 보여준다.
뼈대만 보고 쓰면 항목마다 분량과 구체성이 매번 달라지므로, 새 ADR 을 쓰기 전에 아래를 먼저 읽고 그 수준을 맞춘다.
예시 본문을 이 문서에 복제하지 않는다. 복제본은 원본이 바뀔 때 낡는다.

아래 ADR 은 [`docs/adr/INDEX.md`](../docs/adr/INDEX.md) 목록에서 찾는다.

| 무엇을 보려면 | 어느 ADR |
| --- | --- |
| 대안 기각을 어느 수준으로 쓰나 | ADR-B12 — Quartz 를 왜 쓰지 않았는지를 테이블 수와 가용성 정책으로 나눠 각각 한 줄로 남긴다 |
| 라이브러리 고유 함정을 어떻게 남기나 | ADR-B15 — H2 가 MySQL 예약어를 검증하지 못한 관찰과 재발 지점만 담고 구현은 코드에 맡긴다 |
| 트레이드오프를 어떻게 쓰나 | ADR-B13 — 감수한 제약과 사용자에게 안내할 우회 방법을 짝지어 적는다 |
| 적용 범위를 어떻게 한정하나 | ADR-B15 — 어느 버전부터 적용하고 이미 적용된 분은 왜 건드리지 않는지 적는다 |

기존 ADR-B01 부터 ADR-B16 까지 16건은 코어의 `맥락` 과 `대안 기각` 을 `이유` 한 항목으로 합쳐 쓴다.
새 ADR 은 코어 뼈대를 따른다. 기존 16건을 코어 절 이름으로 옮길지는 별도 판단으로 남긴다.

## 검증

- **critic 패턴 경로**: `backend/.claude/skills/_shared/common-critic-patterns.md` — 이 레포는 파일명이 `common-pitfalls.md` 가 아니라 `common-critic-patterns.md` 이니 혼동 금지.
- 시드 P1~P7 은 코어 `verify_task.py` 5 패턴과 겹치는 항목이 자동 검출된다. 나머지는 self-check.
- **backend-fos 전용 +α** (같은 파일 "backend-fos" 절): `@Transactional` 경계 누락(BE1), Entity-DTO 노출(BE2), AOP 자기호출 우회(BE3). 엔드포인트·서비스 phase 마다 self-check.

## plan / ADR 네이밍

```bash
# cwd: backend
bash ~/.claude/skills/planning/scripts/plan_number.sh --prefix be-
find docs/adr -maxdepth 1 -name 'ADR-B*.md' | sed -E 's/.*ADR-B([0-9]+)-.*/\1/' | sort -n | tail -1
gh pr list --state open --json number,headRefName,title --jq '.[] | "\(.headRefName) \(.title)"'
```

ADR 번호는 `ADR-B` 접두어(backend 전용, 프론트엔드 `fos-accountbook` 과 번호 공간 분리).
새 결정은 `docs/adr/ADR-BNN-{slug}.md` 를 만들고 `docs/adr/INDEX.md` 표에 한 줄을 더한다.
링크는 앵커 없이 파일로 연결한다.

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
      "execution_profile": "standard",   // fast | standard | deep
      "status": "pending"
    }
  ]
}
```

`total_phases`/`created_at`/`current_phase`/`depends_on`/`related_docs` 필드는 이 레포에서 쓰지 않는다.

## 브랜치, 커밋, 핸드오프

브랜치, 커밋, 핸드오프는 루트 `.claude/planning-overlay.md` 를 따른다.
