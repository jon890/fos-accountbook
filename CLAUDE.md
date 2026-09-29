# CLAUDE.md — fos-accountbook

Claude Code가 항상 따라야 할 규칙과 참조 문서 포인터.

## 핵심 워크플로우 스킬

| 시점 | 스킬 | 트리거 |
|---|---|---|
| 새 기능/변경 설계 | `/planning` | "/planning", "계획 세워보자", "설계해보자" |
| plan 실행 (Agent Teams) | `/build-with-teams` | "plan{N} 실행", "구현해줘" — 코드 구현은 항상 이 스킬, 가시적 협업, 4~5명 에이전트 파이프라인 |
| docs 정리 | `/docs-check` | docs/ 5축 검증, plan 완료 후 주기적 |
| UI 리뷰 | `/web-design-guidelines` | "review my UI", 접근성/UX 감사 |
| PR 리뷰 반영 | `/review-fix` | "리뷰 댓글 반영" |
| 커밋 | `/commit-convention` | "커밋해줘" |

`/planning` → docs 갱신 → task 생성 → `/build-with-teams` 실행 흐름이 표준.
`/planning` 은 공용 코어(`~/.claude/skills/planning`) + `.claude/planning-overlay.md` 조합으로 동작한다.

---

## 컨텍스트 문서

| 문서                                         | 내용                                 | 언제 읽을까                    |
| -------------------------------------------- | ------------------------------------ | ------------------------------ |
| [`docs/prd.md`](docs/prd.md)                 | 제품 목적, 기능 범위, v2 계획        | 새 기능 추가 전                |
| [`docs/adr.md`](docs/adr.md)                 | 기술 결정 기록 (F=프론트, B=백엔드)  | 기술 결정 시, 아키텍처 질문 시 |
| [`docs/data-schema.md`](docs/data-schema.md) | DB 스키마, TypeScript 타입, API 구조 | API 연동, 타입 정의 시         |
| [`docs/flow.md`](docs/flow.md)               | 사용자 플로우, 데이터 흐름           | UI/UX 수정, 플로우 변경 시     |
| [`docs/code-architecture.md`](docs/code-architecture.md) | 디렉터리 구조, 레이어 분리, API 전략 | 디렉터리 구조 변경, 레이어 경계 검토 |
| [`docs/testing-strategy.md`](docs/testing-strategy.md) | 테스트 범위·전략·우선순위 | 테스트 추가/삭제 시 |

### 상황별 ADR 필수 참조

아래 작업을 할 때는 해당 ADR을 반드시 먼저 읽는다 — 라이브러리 고유 함정·실험 결과·정책 근거가 담겨 있어 모르고 진행하면 버그 재발 위험.

| 상황 | 필수 확인 ADR |
|---|---|
| Server Action 작성 / Actions-Services 경계 | ADR-F04 — `actions/`와 `services/` 엄격 분리 |
| Page에서 데이터 조회 | ADR-F12 — Page에서 `serverApiGet` 직접 호출 금지, Action 경유 |
| HTTP 클라이언트 / 재시도 설정 | ADR-F05 — ky 사용, 408/429/5xx 최대 2회 재시도 |
| NextAuth 세션/토큰 수정 | ADR-F03 — JWT 전략, profile 캐싱, 만료 5분 전 갱신 |
| 401 응답 / 토큰 만료 처리 | ADR-F26 — 401 을 `A002`(세션 만료) 로 변환, 인증 에러는 기본값으로 숨기지 않고 로그인 리다이렉트 |
| DropdownMenu 안 Server Action 호출 | ADR-F27 — `form` submit 금지, `onSelect` 에서 preventDefault 후 직접 호출 |
| Server Action 입력 검증 | ADR-F06 — Zod 런타임 검증 필수 |
| Shadcn / Tailwind v4 스타일 | ADR-F07 — 시맨틱 그라디언트 클래스, 하드코딩 금지 |
| 색 토큰 작성 (brand/semantic/surface) | ADR-F13 — OKLCH 평면 값. hex/rgb/hsl 금지 |
| 강조 배경 위 텍스트 색 (Badge / 강조 라벨) | ADR-F23 — `text-expense-fg` 같은 시맨틱 foreground 토큰 사용. `text-white` / `text-black` 금지 |
| 폰트 추가 / 수치 표기 | ADR-F14 — Pretendard Variable + Inter (`.num` / tabular-nums) |
| dark mode 셀렉터 | ADR-F15 — `[data-theme="dark"]` 만. `.dark` 신규 사용 금지 |
| 카테고리 분포·월 집계 stat 추가 | ADR-F16 — Server Action 측 집계. backend endpoint 신설 전 임계 트리거 확인 |
| URL searchParams 기반 input/필터 | ADR-F17 — useEffect 안 setState 금지, `draft ?? current` derived value 패턴 |
| `alert/confirm/prompt` 대체 | ADR-F08 — sonner 토스트 사용 |
| Jest 테스트 추가 | ADR-F09 — MSW 아닌 jest.mock 방식 |
| 실시간 업데이트 vs revalidate | ADR-F10 — Server Action + `revalidatePath` 유지 |
| CI 코드 리뷰 워크플로 수정 | ADR-F11 — 트리거/모델/봇 허용 정책 |

---

## 팀 소통

- **프론트엔드 ↔ 백엔드 협의는 GitHub Issues** — Slack/Dooray/구두 합의 금지. 추적 가능성 + 컨텍스트 보존 목적.
- **프론트엔드 레포**: `jon890/fos-accountbook-frontend`
- **백엔드 레포**: `jon890/fos-accountbook-backend`
- **백엔드 이슈 작성**: `/backend-issue` 스킬 사용 (`~/.claude/skills/backend-issue/`)

---

## 기술 스택

Next.js 16 (App Router) · TypeScript 6 (strict) · Tailwind CSS v4 · Radix UI + Shadcn · NextAuth v5 · pnpm 10 · Jest + Testing Library

---

## 아키텍처 레이어 규칙

```
Page (app/) → Action (actions/) → Service (services/) → lib/server/api
```

| 레이어            | 담당                                           | 금지                                        |
| ----------------- | ---------------------------------------------- | ------------------------------------------- |
| `actions/`        | `"use server"`, 인증, Zod 검증, revalidatePath | API 직접 호출, 비즈니스 로직                |
| `services/`       | API 호출, 쿼리 빌딩, 데이터 변환               | `"use server"`, revalidatePath, requireAuth |
| `lib/server/api/` | HTTP 클라이언트                                | —                                           |

---

## 코딩 규칙

### TypeScript

- `strict: true` — `any` 타입 금지
- Server Actions에 명시적 반환 타입 권장
- 입력값은 Zod로 런타임 검증

### React / Next.js

- **Server Component가 기본** — 클라이언트 상태가 필요할 때만 `"use client"`
- `"use client"` 지시어는 파일 최상단 첫 줄
- `useRouter`, `useState`, `useEffect` 등 훅은 Client Component에서만

### 스타일링

- **OKLCH 토큰 강제** (ADR-F13) — `globals.css` 의 `@theme` 블록 외부에서 hex/rgb/hsl 직접 작성 금지
  - brand: `--color-brand-{50..900}` (Toss Blue h=257)
  - semantic: `--color-{income|expense|warning}`
  - surface: `--color-{bg|bg-elev|bg-muted|fg|fg-muted|fg-subtle|border|border-strong}` (light/dark 분리)
- **시맨틱 그라디언트 클래스 필수** — 하드코딩 색상 금지
  - `gradient-expense` · `gradient-income` · `gradient-budget`
  - `gradient-family` · `gradient-category` · `gradient-primary`
- **Dark mode**: `[data-theme="dark"]` 셀렉터만 사용 (ADR-F15). `.dark` 클래스 신규 추가 금지
- **폰트**: `--font-sans` (Pretendard Variable, ADR-F14) + `--font-num` (Inter, 수치 전용 + tabular-nums)
- 인라인 `style={{ }}` 최소화 — 단일 토큰은 `text-[var(--token)]` arbitrary class
- `cn()` 유틸리티로 클래스 병합

### 컴포넌트

- `src/components/ui/` Shadcn 컴포넌트 우선 사용
- CVA(class-variance-authority)로 variant 관리

---

## 금지사항

- `alert()` · `confirm()` · `prompt()` → `toast` (sonner) 사용
- `console.log` 프로덕션 코드에 남기지 않기
- `any` 타입 사용 금지
- `NEXT_PUBLIC_` 없는 환경 변수를 클라이언트 번들에 노출 금지
- Server Action 권한 검증은 ADR-F25 의 3 패턴 중 하나로 명시한다.
  - (a) **Single-family**: `getSelectedFamilyUuid()` + 입력 familyUuid 가 있으면 session 비교 (`updateExpenseAction` 패턴)
  - (b) **Multi-family**: `assertFamilyAccess(familyUuid)` helper (`updateFamilyAction` 패턴)
  - (c) **Entity ownership**: entity 의 familyUuid 가 본인 소속인지 확인 (`deleteInvitationAction` 패턴)
  - `formData.get("familyUuid")` 단순 신뢰 금지 — 클라이언트 주입 시 권한 상승 위험
  - 신규 Action 작성 시 3 패턴 분류 자체 점검 필수
- **ActionError 코드 분리** — 권한·검증 실패 시 에러 코드를 정확히 구분한다. 클라이언트가 코드로 분기하므로 묶으면 핸들러 오동작 위험.
  - 가족 미선택 (`getSelectedFamilyUuid() === null`): `ActionError.familyNotSelected()` (F002) — `ActionError.invalidInput("familyUuid", ...)` 사용 금지. 기준 패턴은 `create-category-action.ts`
  - 가족 불일치 (다른 familyUuid 접근): `new ActionError(ErrorCode.NOT_FAMILY_MEMBER, "...")` (F003)
  - 인증 실패: `ActionError.unauthorized()`
- **외부 UUID 입력 형식 검증 필수** — Server Action 파라미터로 받은 UUID 가 API 경로에 직접 삽입될 때는 형식 검증 후 사용한다 (예: `notificationUuid`, `categoryUuid`).
  - 기준 패턴: `mark-notification-read-action.ts` 의 `UUID_REGEX` 검증
  - 세션에서 가져오는 `familyUuid` 는 검증 불필요 (서버 신뢰 가능)

---

## 토큰 효율 (Opus/Sonnet 라우팅)

- **논의·계획·docs 작성**: main 세션 (opus 허용)
- **task phase 실행**: sonnet 기본 — rename, 리팩토링, 다중 파일 수정도 sonnet
- **task phase에서 opus 사용 금지 예외**:
  - 새 아키텍처 설계가 phase 안에 있는 경우
  - 복잡 알고리즘 설계 (도메인 핵심 신규 설계)
- **기계적 작업은 opus 금지** — rename/이동/경로 수정 등은 파일 수가 많아도 sonnet으로 충분
- 빌드 검증·커밋 phase는 haiku

---

## 파일 읽기 효율

- **전체 파일 읽기 금지** (200줄 초과 시) — offset+limit로 필요한 섹션만
- **같은 파일 반복 읽기 금지** — 같은 세션 내에서는 기억해서 재사용
- **대형 docs 파일** (`docs/adr.md` 등)은 grep으로 필요 섹션만 찾아 offset 지정

---

## 조사/탐색 접근 방식

- **직접 질문에는 직접 답변부터** — 사용자가 특정 파일/영역/패턴을 명시했다면 해당 위치부터 확인. 광범위한 codebase 탐색 금지
- **사용자가 조사 경로를 제시했으면 그 경로부터** — 지시받은 영역에서 codebase 전체를 먼저 뒤지지 않는다
- **Explore agent는 최후 수단** — Grep/Glob/Read로 3번 이상 시도한 후에도 못 찾을 때만 사용
- **가정 없이 주장하지 않기** — "dead code", "미사용" 같은 판단은 실제로 참조를 grep한 후에만 제기

---

## Task 작업 규칙

- 각 phase는 **원자적 단일 책임** — 다른 관심사면 별도 phase로 분리. **작업 항목 5개 이하** 엄수
- **task 파일 생성 즉시 git commit** — index.json + phase 파일을 실행 전에 커밋
- task 완료 즉시 git commit (index.json 상태 갱신 포함)
- 각 phase 프롬프트는 **자기완결적** (이전 대화 없이 독립 실행 가능)
- **docs 최신화는 task 생성 전 필수** — task phase 내에서 docs 변경 금지

"5개 이하" 근거: 작업 항목이 많으면 AI 에이전트가 뒤쪽을 누락하는 경향 (11개 중 뒤 3개 누락 실증 사례).

---

## 문서 작성 원칙

- **AI 에이전트 컨텍스트 효율** — docs는 AI 에이전트를 위한 것. 컨텍스트를 낭비하지 않도록 간결하게
- **반복·중복 제거** — 같은 내용을 두 문서에 쓰지 않는다
- **의사결정 의도 보존** — "왜 이렇게 했는가" 반드시 기록
- **구현 세부사항은 코드에, docs에는 "무엇을·왜"만** — ADR에 코드 스니펫/파일 경로 나열 금지
- **가독성 + 토큰 효율 6가지 패턴**: 아래 "docs / ADR 작성 형식" 섹션 참조

## 한국어 표현 정책

docs / skill / task 파일을 한국어로 작성할 때 **한국인이 자연스럽게 읽히는 표현을 우선** 한다.
영어 단어를 한자/한글 음차한 표현 (특히 "X 게이트", "X 트리아지", "X 매트릭스" 같은 외래어 합성) 은 사용 금지.

| 금지                  | 권장 대체                                                                     |
| --------------------- | ----------------------------------------------------------------------------- |
| 매트릭스 (matrix)     | **표** / **영향 표** / **분류 표** / **변경-docs 매핑 표**                    |
| 트리아지 (triage)     | **분류** / **우선순위 분류**                                                  |
| 베이스라인 (baseline) | **기준선** / **기준값**                                                       |
| 스파이크 (spike)      | **사전 조사** / **API 검증**                                                  |
| 게이트 (gate)         | **점검** / **사전 점검** / **통과 조건**                                      |
| 사전 소진             | **사전 해소** ("소진" 은 자원 고갈 비유 — 직관 어려움)                        |
| 단일 진실원           | **단일 소스** ("진실원" 은 truth-source 직역, 한국어 자연어 아님)             |
| 변질 의심             | **변질 우려** ("의심" 보다 "우려" 가 더 자연)                                 |
| 패턴 답습             | **동일 패턴 적용** / **그대로 적용** ("답습" 은 "낡은 것 베끼기" 부정 뉘앙스) |

이 정책은 **새 작성물에 우선 적용**한다. 기존 문서에서 위 표현이 발견되면:

- 현재 편집 중인 파일이면 함께 정리
- 작업 외 파일이면 사용자에게 알려 별도 정리 여부를 물어본다 (일괄 교체 PR 등)

표에 없는 외래어라도 같은 원칙 (한국인 독해 자연스러움) 으로 자체 판단.
단 **기술 용어 그대로 쓰는 게 표준인 경우** (예: `rebase`, `merge`, `commit`, `endpoint`, `payload`) 는 그대로 유지 — 한국어 대체가 오히려 어색.

## docs / ADR 작성 형식 (가독성 + 토큰 효율)

대상: `docs/*.md` / `CLAUDE.md` / `tasks/**/*.md` / `README.md` / `.claude/skills/*/SKILL.md`.

목표는 두 가지 — 작성자가 읽기 쉬울 것 (가독성), LLM 컨텍스트 비용을 늘리지 않을 것.
두 목표가 충돌할 때는 가독성을 우선한다.

### 1. semantic line break (문장당 1줄)

한 단락 안의 문장은 줄바꿈으로 분리.
markdown 렌더링 결과는 동일하지만 소스 가독성 ↑ + git diff 정밀 + 토큰 동일.

**금지**: 한 단락에 2 문장 이상 같은 줄에 이어쓰기.

### 2. enumerated inline 금지

`① ... ② ... ③ ...` / `1) ... 2) ... 3) ...` / 슬래시 나열 (`A / B / C` 3개 이상) 형식은 markdown bullet list 로 변환한다.

### 3. 괄호 중첩 2겹 이상 금지

`(... (...) ...)` 같은 중첩이 발생하면 단락 분리 또는 bullet 분리로 평탄화한다.

### 4. `=` / `→` 동치·인과 압축은 한 단락 1회만

여러 동치 / 인과 관계를 한 문장에 압축하지 않는다.
각 관계마다 별 문장 + 줄바꿈으로 분리.

### 5. 한 문장이 길면 의미 단위 분할

한 문장이 약 80자 초과 + 백틱 3개 이상 또는 괄호 다수면 의미 단위로 나눈다.
"한국어 문장 + 영어 약어 + 코드 inline" 혼재는 가독성 손실의 주범.

### 6. 한 bullet 에 다중 속성 압축 금지 — sub-bullet 으로 분리

한 bullet 안에 **무엇 / 어떻게 / 예외 / 조건 / 근거** 중 2개 이상의 독립 속성을 다음 연결로 이어 압축하지 않는다.
각 속성은 sub-bullet 으로 분리.

- 마침표 (`. ... .`) — 여러 문장
- 콤마 (`A, B, C`) — 병렬 항목
- 더하기 (`A + B + C`) — 변경 사항·구성 요소 나열
- 슬래시 (`A / B / C` 3개 이상) — 패턴 2 와 중첩

### 적용 시점

- **신규 작성**: 위 6가지 패턴 자체 점검 후 commit
- **기존 docs**: 편집 중인 파일은 함께 정리. 일괄 정리는 별도 task
- **review**: code-reviewer / critic / docs-verifier 가 6가지 패턴 위반을 지적할 수 있음

출처: dooray-cli repo 의 같은 정리 작업 (task 034 + 일련의 commit).

---

## 테스트

- 위치: `src/__tests__/`
- 실행: `pnpm test` / `pnpm test:ci`
- Service 함수는 단위 테스트 권장
- Server Action 테스트: jest.mock 방식 (MSW 아님 — ADR-F09 참고)

---

## Git & PR Conventions

- **main 직접 push 차단** — branch protection 으로 거부됨. 모든 변경은 작업 브랜치 + PR (task 파일/docs 도 동일).
- **PR 제목**: `type(scope): description` — 절대 벗어나지 않는다.
- **commit 전 로컬 검증 필수** — `pnpm lint && pnpm test` 를 로컬에서 통과시킨 후에만 commit/push. CI 왕복 (push → 실패 → 진단 → 재푸시) 비용 회피 목적. ESLint unused-variable 같은 자명한 실패는 로컬에서 잡힌다.

### 브랜치 명명

| 단계 | 브랜치 | 내용 |
|---|---|---|
| 계획+구현 | `plan/{N}-{slug}` | `/planning` 이 task+docs commit + push (**PR 생성 안 함**) → `/build-with-teams` 가 **같은 브랜치**에서 구현 → `plan/{N}`→main **단일 PR** |
| 기타 | `chore/...` · `fix/...` · `refactor/...` · `docs/...` | 일반 작업 |

계획과 구현을 **단일 PR** 로 묶는다 (2026-06-02 갱신).
계획 PR 을 따로 머지하면 그 사이 main 변경과 구현 브랜치가 충돌하기 때문 (plan026 사례: #308 계획 PR 머지 → #311 구현 PR conflict).
`/planning` 은 `plan/{N}` 브랜치 push 까지만, PR 은 `/build-with-teams` 가 계획+구현 완료 후 1개만 생성한다.

### 예시

- `feat(backend): add Prometheus config`
- `fix(database): resolve Redis connection timeout`
- `docs(task): add NSC slot engine abstraction`

---

## PR 체크리스트

1. Server/Client Component 경계가 올바른가?
2. 새 색상/스타일이 시맨틱 클래스를 사용하는가?
3. TypeScript 타입이 충분히 엄격한가?
4. Server Actions에서 인증/권한 확인이 누락되지 않았는가?
5. `alert()` 등 브라우저 기본 UI 사용 여부
6. 에러 처리가 적절한가?
7. PR 제목이 `type(scope): description` 형식을 따르는가?
