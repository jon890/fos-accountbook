# CLAUDE.md — fos-accountbook

프론트엔드에서 Claude Code가 항상 따라야 할 규칙과 참조 문서 포인터.
저장소 공통 규칙(워크플로우 스킬, Task, 문서 작성, Git & PR)은 루트 `CLAUDE.md` 가 소유한다.

## 컨텍스트 문서

| 문서                                         | 내용                                 | 언제 읽을까                    |
| -------------------------------------------- | ------------------------------------ | ------------------------------ |
| [`docs/prd.md`](docs/prd.md)                 | 제품 목적, 기능 범위, v2 계획        | 새 기능 추가 전                |
| [`docs/adr/INDEX.md`](docs/adr/INDEX.md)                 | 프론트엔드 기술 결정 기록 (ADR-F)    | 기술 결정 시, 아키텍처 질문 시 |
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
| Jest 테스트 추가 | ADR-F09 — MSW 아닌 jest.mock 방식 |
| 실시간 업데이트 vs revalidate | ADR-F10 — Server Action + `revalidatePath` 유지 |
| CI 코드 리뷰 워크플로 수정 | ADR-F11 — 트리거/모델/봇 허용 정책 |

---

## 아키텍처 레이어 규칙

`Page (app/) → Action (actions/) → Service (services/) → lib/server/api`.
레이어 책임은 [`docs/code-architecture.md`](docs/code-architecture.md) 를 따른다.

---

## 코딩 규칙

### 스타일링

상황별 ADR 필수 참조 표의 ADR-F07, F13, F14, F15, F23 을 따른다.
하드코딩 색상은 쓰지 않는다.

---

## 금지사항

- `alert()`, `confirm()`, `prompt()` 는 쓰지 않는다. ADR-F08 의 sonner 토스트를 사용한다.
- 클라이언트 코드에 `console.log` 를 남기지 않는다. 서버 로그는 `lib/server/api/logging.ts` 를 거친다.
- 클라이언트 컴포넌트가 `@/lib/env` 의 `serverEnv` 를 import 하지 않는다.
- Server Action 권한 검증은 ADR-F25 의 3 패턴 중 하나로 명시한다.
  - (a) **Single-family**: `getSelectedFamilyUuid()` + 입력 familyUuid 가 있으면 session 비교 (`updateExpenseAction` 패턴)
  - (b) **Multi-family**: `assertFamilyAccess(familyUuid)` helper (`updateFamilyAction` 패턴)
  - (c) **Entity ownership**: entity 의 familyUuid 가 본인 소속인지 확인 (`deleteInvitationAction` 패턴)
  - `formData.get("familyUuid")` 단순 신뢰 금지 — 클라이언트 주입 시 권한 상승 위험
  - 신규 Action 작성 시 3 패턴 분류 자체 점검 필수
- **ActionError 코드 분리** — 권한·검증 실패 시 에러 코드를 정확히 구분한다. 클라이언트가 코드로 분기하므로 묶으면 핸들러 오동작 위험.
  - 가족 미선택 (`getSelectedFamilyUuid() === null`): `ActionError.familyNotSelected()` (F002). `ActionError.invalidInput("familyUuid", ...)` 는 쓰지 않는다.
  - 기준 패턴은 `actions/notification/mark-notification-read-action.ts` 이다.
  - 가족 불일치 (다른 familyUuid 접근): `new ActionError(ErrorCode.NOT_FAMILY_MEMBER, "...")` (F003)
  - 인증 실패: `ActionError.unauthorized()`
- **외부 UUID 입력 형식 검증 필수** — Server Action 파라미터로 받은 UUID 가 API 경로에 직접 삽입될 때는 형식 검증 후 사용한다 (예: `notificationUuid`, `categoryUuid`).
  - 기준 패턴: `actions/invitation/_schemas.ts` 의 Zod `z.string().uuid()` 스키마
  - 세션에서 가져오는 `familyUuid` 는 검증 불필요 (서버 신뢰 가능)

---

## 테스트

- 위치: `src/__tests__/`
- 실행: `pnpm test` / `pnpm test:ci`
