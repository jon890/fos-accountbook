# CLAUDE.md — fos-accountbook

저장소 전체에 적용되는 규칙.
하위 프로젝트 전용 규칙은 각 디렉터리의 `CLAUDE.md` 가 소유한다.

## 저장소 배치

| 디렉터리 | 내용 | 지침 |
|---|---|---|
| `frontend/` | Next.js 프론트엔드 | `frontend/CLAUDE.md` |
| `backend/` | Spring Boot 백엔드 | `backend/CLAUDE.md` |
| `docs/adr/INDEX.md` | 저장소 전체 결정 (ADR-M) | — |

프론트엔드 결정은 `frontend/docs/adr/INDEX.md` 의 ADR-F, 백엔드 결정은 `backend/docs/adr/INDEX.md` 의 ADR-B, 저장소 전체 결정은 루트 `docs/adr/INDEX.md` 의 ADR-M 이 소유한다.
합친 배경은 ADR-M01 이다.
API 를 함께 바꾸는 변경은 PR 하나로 낸다.

## 핵심 워크플로우 스킬

| 시점 | 스킬 | 트리거 |
|---|---|---|
| 새 기능/변경 설계 | `/planning` | "/planning", "계획 세워보자", "설계해보자" |
| plan 실행 (Agent Teams) | `/build-with-teams` | "plan{N} 실행", "구현해줘" — 코드 구현은 항상 이 스킬, 가시적 협업, 4~5명 에이전트 파이프라인 |
| docs 정리 | `/docs-check` | docs/ 5축 검증, plan 완료 후 주기적 |
| UI 리뷰 | `/web-design-guidelines` | "review my UI", 접근성/UX 감사 |
| PR 리뷰 반영 | `/review-fix` | "리뷰 댓글 반영" |

`/planning` → docs 갱신 → task 생성 → `/build-with-teams` 실행 흐름이 표준.
`/planning` 은 공용 코어(`~/.claude/skills/planning`) + `.claude/planning-overlay.md` 조합으로 동작한다.

---

## Task 작업 규칙

- phase 하나의 작업 항목은 **5개 이하**로 둔다. 넘으면 phase 를 나눈다.
- 나머지 task 규칙은 공용 코어 `planning` 의 `task-create.md` 를 따른다.
- 구현이 끝난 계획서(`tasks/` 의 plan 디렉터리)는 지운다.
    - 현재 사실은 docs 와 코드가 소유한다.
    - 계획서는 구현 뒤 곧 낡는다. 에이전트나 사람이 다시 참조하면 틀린 근거가 된다.
    - 지난 계획이 필요하면 git 이력에서 찾는다.

---

## 문서 작성 원칙

- **AI 에이전트 컨텍스트 효율** — docs는 AI 에이전트를 위한 것. 컨텍스트를 낭비하지 않도록 간결하게
- **반복·중복 제거** — 같은 내용을 두 문서에 쓰지 않는다
- **의사결정 의도 보존** — "왜 이렇게 했는가" 반드시 기록
- **구현 세부사항은 코드에, docs에는 "무엇을·왜"만** — ADR에 코드 스니펫/파일 경로 나열 금지

한국어 표현과 markdown 가독성은 전역 `korean-check` 스킬이 판정한다.
편집 hook 이 검사기를 돌리므로 걸리면 그 자리에서 고친다.

---

## Git & PR Conventions

- **main 직접 push 차단** — branch protection 으로 거부됨. 모든 변경은 작업 브랜치 + PR (task 파일/docs 도 동일).
- **PR 제목**: `type(scope): description` — 절대 벗어나지 않는다.
- **커밋 메시지**: 제목과 본문은 한국어로 쓴다. 형식은 PR 제목과 같은 `type(scope): 설명` 이다. 본문에는 무엇을 왜 바꿨는지 쓴다.
- **commit 전 로컬 검증 필수** — 바뀐 하위 프로젝트의 검증 명령을 로컬에서 통과시킨 후에만 commit/push. CI 왕복 (push → 실패 → 진단 → 재푸시) 비용 회피 목적. ESLint unused-variable 같은 자명한 실패는 로컬에서 잡힌다.

```bash
cd frontend && pnpm lint && pnpm test
cd backend && ./gradlew checkstyleMain checkstyleTest test
```

- 검증 명령을 `&` 로 병렬 실행한 뒤 인자 없는 `wait` 로 기다리지 않는다. 인자 없는 `wait` 는 앞 명령이 실패해도 0 으로 끝난다.
- `--no-verify` 로 검증을 건너뛰지 않는다.

백엔드 `gradle-wrapper.jar` 는 추적하지 않는다.
jar 가 없으면 먼저 `cd backend && mise exec gradle@9.8.0 -- gradle wrapper --gradle-version 9.8.0` 으로 만든다. jar 는 커밋하지 않는다.
백엔드 CI 가 매번 `gradle wrapper` 로 만드는 관례와 같다.

### 브랜치 명명

| 단계 | 브랜치 | 내용 |
|---|---|---|
| 계획+구현 | `plan/{접두사}{N}-{slug}` (예 `plan/fe-001-login`) | `/planning` 이 task+docs commit + push (**PR 생성 안 함**) → `/build-with-teams` 가 **같은 브랜치**에서 구현 → `plan/{접두사}{N}`→main **단일 PR** |
| 기타 | `chore/...` · `fix/...` · `refactor/...` · `docs/...` | 일반 작업 |

계획과 구현을 **단일 PR** 로 묶는다 (2026-06-02 갱신).
계획 PR 을 따로 머지하면 그 사이 main 변경과 구현 브랜치가 충돌하기 때문 (plan026 사례: #308 계획 PR 머지 → #311 구현 PR conflict).
`/planning` 은 `plan/{접두사}{N}` 브랜치 push 까지만, PR 은 `/build-with-teams` 가 계획+구현 완료 후 1개만 생성한다.

### 예시

- `feat(frontend): add category filter`
- `fix(backend): resolve token refresh failure`
- `docs(task): add login flow plan`
