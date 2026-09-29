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

## Task 작업 규칙

- phase 하나의 작업 항목은 **5개 이하**로 둔다. 넘으면 phase 를 나눈다.
- 나머지 task 규칙은 공용 코어 `planning` 의 `task-create.md` 를 따른다.

---

## 문서 작성 원칙

- **AI 에이전트 컨텍스트 효율** — docs는 AI 에이전트를 위한 것. 컨텍스트를 낭비하지 않도록 간결하게
- **반복·중복 제거** — 같은 내용을 두 문서에 쓰지 않는다
- **의사결정 의도 보존** — "왜 이렇게 했는가" 반드시 기록
- **구현 세부사항은 코드에, docs에는 "무엇을·왜"만** — ADR에 코드 스니펫/파일 경로 나열 금지

한국어 표현과 markdown 가독성은 전역 `korean-check` 스킬이 판정한다.
편집 hook 이 검사기를 돌리므로 걸리면 그 자리에서 고친다.

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
