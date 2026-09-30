# CLAUDE.md — fos-accountbook

프론트엔드에서 Claude Code가 항상 따라야 할 규칙과 참조 문서 포인터.
저장소 공통 규칙(워크플로우 스킬, Task, 문서 작성, Git & PR)은 루트 `CLAUDE.md` 가 소유한다.

## 컨텍스트 문서

| 문서                                         | 내용                                 | 언제 읽을까                    |
| -------------------------------------------- | ------------------------------------ | ------------------------------ |
| [`docs/prd.md`](docs/prd.md)                 | 제품 목적, 기능 범위, v2 계획        | 새 기능 추가 전                |
| [`docs/adr.md`](docs/adr.md)                 | 프론트엔드 기술 결정 기록 (ADR-F)    | 기술 결정 시, 아키텍처 질문 시 |
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
| HTTP 클라이언트 / 재시도 설정 | ADR-F05 — ky 사용. ADR-F31 — 재시도는 GET 만, 타임아웃 5초 |
| NextAuth 세션/토큰 수정 | ADR-F03 — JWT 전략, profile 캐싱, 만료 5분 전 갱신 |
| 401 응답 / 토큰 만료 처리 | ADR-F26 — 401 을 `A002`(세션 만료) 로 변환, 인증 에러는 기본값으로 숨기지 않고 로그인 리다이렉트 |
| DropdownMenu 안 Server Action 호출 | ADR-F27 — `form` submit 금지, `onSelect` 에서 preventDefault 후 직접 호출 |
| Server Action 입력 검증 | ADR-F06 — Zod 런타임 검증 필수 |
| Shadcn / Tailwind v4 스타일 | ADR-F07 — 시맨틱 그라디언트 클래스, 하드코딩 금지 |
| 색 토큰 작성 (brand/semantic/surface) | ADR-F13 — OKLCH 평면 값. hex/rgb/hsl 금지 |
| 강조 배경 위 텍스트 색 (Badge / 강조 라벨) | ADR-F23 — `text-expense-fg` 같은 시맨틱 foreground 토큰 사용. `text-white` / `text-black` 금지 |
| 폰트 추가 / 수치 표기 | ADR-F14 — Pretendard Variable + Inter (`.num` / tabular-nums) |
| dark mode 셀렉터 | ADR-F15 — `[data-theme="dark"]` 만. `.dark` 신규 사용 금지 |
| 카테고리 분포·월 집계 stat 추가 | ADR-F30 — 백엔드 집계 API 를 부른다. 목록을 받아 프론트에서 더하지 않는다 |
| URL searchParams 기반 input/필터 | ADR-F17 — useEffect 안 setState 금지, `draft ?? current` derived value 패턴 |
| `alert/confirm/prompt` 대체 | ADR-F08 — sonner 토스트 사용 |
| Jest 테스트 추가 | ADR-F09 — MSW 아닌 jest.mock 방식 |
| 실시간 업데이트 vs revalidate | ADR-F10 — Server Action + `revalidatePath` 유지 |
| CI 코드 리뷰 워크플로 수정 | ADR-F11 — 트리거/모델/봇 허용 정책 |

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

## 테스트

- 위치: `src/__tests__/`
- 실행: `pnpm test` / `pnpm test:ci`
- Service 함수는 단위 테스트 권장
- Server Action 테스트: jest.mock 방식 (MSW 아님 — ADR-F09 참고)

---

## PR 체크리스트

1. Server/Client Component 경계가 올바른가?
2. 새 색상/스타일이 시맨틱 클래스를 사용하는가?
3. TypeScript 타입이 충분히 엄격한가?
4. Server Actions에서 인증/권한 확인이 누락되지 않았는가?
5. `alert()` 등 브라우저 기본 UI 사용 여부
6. 에러 처리가 적절한가?
7. PR 제목이 `type(scope): description` 형식을 따르는가?
