# ADR — fos-accountbook (프론트엔드)

> 프론트엔드(Next.js) 전용 기술 결정 기록.
> 백엔드 결정은 [`backend/docs/adr.md`](../../backend/docs/adr.md), 저장소 전체 결정은 [루트 `docs/adr.md`](../../docs/adr.md) 가 소유한다.

---

## ADR Index

- [ADR-F01](#adr-f01) — Next.js App Router 선택
- [ADR-F02](#adr-f02) — Server Components 우선 전략
- [ADR-F03](#adr-f03) — NextAuth v5 JWT 전략
- [ADR-F04](#adr-f04) — Actions/Services 계층 분리
- [ADR-F05](#adr-f05) — ky HTTP 클라이언트
- [ADR-F06](#adr-f06) — Zod 런타임 검증
- [ADR-F07](#adr-f07) — Shadcn + Tailwind CSS v4
- [ADR-F08](#adr-f08) — alert() 대신 sonner 토스트
- [ADR-F09](#adr-f09) — MSW vs jest.mock — 테스트 방식
- [ADR-F10](#adr-f10) — 반복 지출 상태 관리 — Server Action 방식 유지
- [ADR-F11](#adr-f11) — CI 코드 리뷰 워크플로 설계
- [ADR-F12](#adr-f12) — Page에서 serverApiGet 직접 호출 금지
- [ADR-F13](#adr-f13) — OKLCH 색 시스템 채택
- [ADR-F14](#adr-f14) — Pretendard Variable 폰트 도입
- [ADR-F15](#adr-f15) — next-themes attribute='data-theme'
- [ADR-F16](#adr-f16) — 카테고리 월 분포는 Server Action 측 집계 (superseded → ADR-F30)
- [ADR-F17](#adr-f17) — URL searchParams ↔ Client state 동기화는 draft 패턴
- [ADR-F18](#adr-f18) — react-day-picker → @daypicker/react 패키지 이전
- [ADR-F19](#adr-f19) — TypeScript 5.9 → 6.0 메이저 이전 + breaking 대응 패턴
- [ADR-F20](#adr-f20) — 인증 안 한 사용자의 `/` 진입은 Landing 표시
- [ADR-F21](#adr-f21) — Add/Edit Transaction 다이얼로그 단일화
- [ADR-F22](#adr-f22) — 민감 정보를 다루는 컴포넌트는 Server Component 로 유지 + Client 핸들러는 children 슬롯
- [ADR-F23](#adr-f23) — semantic foreground 토큰 (`--color-{semantic}-fg`) 으로 강조 배경 위 텍스트 색 명시
- [ADR-F24](#adr-f24) — sonner richColors OFF + Teal 토큰 직접 매핑
- [ADR-F25](#adr-f25) — Server Action 권한 검증 3-패턴 표준화
- [ADR-F26](#adr-f26) — 백엔드 401 응답을 인증 만료로 분류해 로그인으로 일관 리다이렉트
- [ADR-F27](#adr-f27) — Radix `DropdownMenuItem` 안에서 form submit 금지 — `onSelect` 직접 호출
- [ADR-F28](#adr-f28) — brand 색 Teal(h=188) → Toss Blue(h=257) 변경
- [ADR-F29](#adr-f29) — Tailwind v4 markdown 스캔 위험 패턴 차단 — md-lint 게이트 + 안전 표기
- [ADR-F30](#adr-f30) — 월 합계와 추이는 백엔드 집계 API 를 부른다
- [ADR-F31](#adr-f31) — 백엔드 호출 재시도는 GET 만 하고 타임아웃을 명시한다
- [ADR-F32](#adr-f32) — 달력을 첫 화면으로 두고 한 달 목록을 한 번에 받는다
- [ADR-F33](#adr-f33) — 메뉴는 하단 탭의 「전체」 에 모은다

---

<a id="adr-f01"></a>

## ADR-F01: Next.js App Router 선택

- **결정**: Pages Router 대신 App Router 사용 (Next.js 16).
- **맥락**: Server Components 기본 지원으로 데이터 페칭 단순화 + 번들 크기 감소. Route Groups (`(authenticated)`) 로 인증 레이아웃 분리 가능. Server Actions 로 API Route 없이 폼 처리 가능.
- **대안 기각**: (생략 — 신규 프로젝트의 일반적 표준 선택)
- **트레이드오프**: Next.js 16 일부 API 가 beta 상태 → 문서 변경 빈도 높음.

---

<a id="adr-f02"></a>

## ADR-F02: Server Components 우선 전략

- **결정**: 클라이언트 상태가 필요한 경우에만 `"use client"` 추가. 모든 `page.tsx` 는 Server Component, 인터랙션이 필요한 부분만 `*Client.tsx` 로 분리.
- **맥락**: 데이터 페칭을 서버에서 처리 → 백엔드 토큰을 클라이언트에 노출하지 않음. 초기 HTML 에 데이터 포함 → 로딩 플리커 없음. `"use client"` 경계를 말단 컴포넌트로 밀어내 번들 최소화.
- **대안 기각**: (생략 — Next.js App Router 의 권장 패턴 일치)

---

<a id="adr-f03"></a>

## ADR-F03: NextAuth v5 JWT 전략

**결정**: JWT 세션 방식, 프로필 정보를 JWT에 캐싱

**이유**:

- 서버 세션(DB) 없이 stateless 인증 가능
- `profile` 정보를 JWT에 캐싱 → 매 요청마다 `/users/me/profile` API 호출 불필요
- 만료 5분 전 자동 갱신으로 UX 중단 없음

**구현 세부사항**:

- JWT에 `backendAccessToken`, `backendRefreshToken`, `profile` 저장
- Access Token: 백엔드 기준 15분 만료
- 갱신 트리거: `token.backendTokenExpiredAt` 기준 5분 전
- Session TTL: 30일, updateAge: 1일

---

<a id="adr-f04"></a>

## ADR-F04: Actions/Services 계층 분리

**결정**: `actions/`(인증·검증)와 `services/`(API 호출·로직) 엄격 분리

**이유**:

- `"use server"` 코드와 비즈니스 로직이 섞이면 테스트가 어려움
- Services는 순수 함수에 가까워 단위 테스트 용이
- revalidatePath, requireAuth 같은 Next.js 전용 코드를 Actions에만 격리

**규칙**:

- `actions/`: `"use server"`, 인증, Zod 검증, revalidatePath만 담당
- `services/`: API 호출, 데이터 변환, 쿼리 빌딩만 담당. `"use server"` 사용 금지

---

<a id="adr-f05"></a>

## ADR-F05: ky HTTP 클라이언트 (v2 갱신)

**결정**: axios 대신 ky 사용. **2026-05-09**: ky 1.x → 2.x 업그레이드 (plan004).

**현재 설치 상태 (2026-09-30)**: lockfile 의 ky 버전은 1.14.3 이다. 현재 hook 은 1.x 의 위치 인자 방식을 사용한다.

**이유**:

- Node 22+ native fetch 기반 → 추가 polyfill 없음
- 번들 크기: ky ~4KB vs axios ~13KB
- TypeScript 타입 기본 제공
- 자동 재시도 설정이 간결 (`retry` 옵션)

**재시도 설정**: 408, 413, 429, 500, 502, 503, 504 → 최대 2회 재시도

**대체된 부분**: 재시도 대상 메서드와 타임아웃은 [ADR-F31](#adr-f31) 이 정한다. 재시도는 GET 만 한다.

**ky 2.x 마이그레이션 결정 (2026-05-09)**:

| 항목 | 결정 | 이유 |
|---|---|---|
| URL 베이스 옵션 | `prefixUrl` → `prefix` rename | 단순 string join 으로 현재 동작 유지. `baseUrl` 은 standard URL resolution 으로 leading slash 의미 달라져 회귀 위험 |
| Hook signature | 단일 state object (`{request, options, retryCount, ...}`) | ky 2.0 강제 변경. 기존 위치 인자 폐지 |
| `.json()` 빈 body 처리 | 204 / 빈 body 응답 분기에 명시 가드 | ky 2.0 이 빈 body / 204 에서 throw — 우리 응답 envelope (`ApiResponse<T>`) 가 모든 200 응답을 가정하므로 가드 필수 |
| `HTTPError.data` 활용 | `beforeError` / catch 의 `.json().catch(() => null)` 패턴 제거 | ky 2.0 이 자동 파싱 + resource leak 해결. 코드 단순화 |
| `beforeError` 시그니처 | 객체 인자 + 모든 에러 받음 (HTTPError 한정 아님) | ky 2.0 변경. `error.response` 가 undefined 가능 → 명시 가드 |

**적용 범위**: `src/lib/server/api/client.ts`, `src/__mocks__/ky.ts`.

---

<a id="adr-f06"></a>

## ADR-F06: Zod 런타임 검증

**결정**: 모든 Server Action 입력값을 Zod로 검증

**이유**:

- TypeScript 타입은 컴파일 타임만 보장 → 런타임 서버 액션에서 악의적 입력 가능
- Zod 스키마에서 TypeScript 타입을 derive → 타입 정의 중복 없음
- 에러 메시지가 필드 단위로 구조화 → UI 폼 에러 표시 직결

---

<a id="adr-f07"></a>

## ADR-F07: Shadcn + Tailwind CSS v4

**결정**: UI 컴포넌트는 Shadcn 패턴, 스타일링은 Tailwind CSS v4

**이유**:

- Shadcn: 소유권이 있는 UI (복사 방식) → 커스터마이징 자유도 높음
- Tailwind v4: `tailwind.config.js` 불필요, `@theme` 블록으로 CSS 변수 관리
- Radix UI 기반 → 접근성(ARIA) 자동 처리

**색상 규칙**: 시맨틱 클래스(`gradient-expense`, `gradient-income` 등) 사용, 하드코딩 금지

---

<a id="adr-f08"></a>

## ADR-F08: alert() 대신 sonner 토스트

**결정**: `alert()`, `confirm()`, `prompt()` 전면 금지, sonner 사용

**이유**:

- `alert()`은 모달 차단으로 UX 저하, 스타일 제어 불가
- sonner는 스택형 토스트, 자동 dismiss, 커스텀 스타일 지원

---

<a id="adr-f09"></a>

## ADR-F09: MSW vs jest.mock — 테스트 방식

**결정**: Server Action 테스트에서 MSW 대신 jest.mock 사용

**이유**:

- Server Actions는 HTTP 레이어 없이 직접 함수 호출
- MSW는 fetch interceptor 기반 → Server Component 환경에서 설정 복잡
- jest.mock으로 `api/client`, `auth-helpers` 모킹 → 단순하고 빠름

**트레이드오프**: 실제 HTTP 요청 경로는 검증 안 됨 → 통합 테스트는 별도 필요

---

<a id="adr-f10"></a>

## ADR-F10: 반복 지출 상태 관리 — Server Action 방식 유지

**결정**: 폴링·WebSocket 도입 없이 기존 Server Action + revalidatePath 방식 유지

**이유**:

- 스케줄러 실행이 새벽 1시 → 사용자가 앱 사용 중 실시간 업데이트 필요 없음
- 페이지 재방문 시 Server Component가 최신 데이터를 fetch → 충분한 일관성
- 폴링 추가 시 복잡도 증가 대비 사용자 경험 개선 미미

**결과**: 자동 생성된 지출은 다음 날 대시보드 방문 시 반영됨. 실시간 알림은 기존 NotificationBell로 대체

---

<a id="adr-f11"></a>

## ADR-F11: CI 코드 리뷰 워크플로 설계 (개정)

**결정**: Claude Code Action 기반 자동 코드 리뷰 워크플로를 아래 방침으로 운영. fos-blog 정착 패턴과 동일화 (2026-05-09 개정, 2026-06-02 단일 opus 리뷰어로 모델 전환, 2026-09-01 요약을 리뷰 body 로 통합, 2026-09-29 fos-assistant 판에 맞춰 호출 경계와 등급과 위험 라벨 추가).

**적용 범위**: 모노레포의 리뷰 워크플로 하나가 프론트엔드와 백엔드를 함께 리뷰한다([ADR-M01](../../docs/adr.md#adr-m01)). 백엔드의 ADR-B14 는 이 ADR 로 대체된다.

**핵심 결정 사항**:

| 항목 | 결정 | 이유 |
|------|------|------|
| 트리거 | `opened` + `/review` 수동 | `synchronize` 제거 — 매 push마다 토큰 소비 방지 |
| 호출 경계 | PR 은 이 저장소 브랜치에서 연 것만. `/review` 는 댓글이 그 명령으로 시작하고 OWNER / MEMBER / COLLABORATOR 가 단 것만. 포크 PR 은 댓글 트리거에서도 첫 단계에서 제외 | 공개 저장소라 누구나 PR 과 댓글을 남길 수 있다. 본문에 `/review` 가 들어 있기만 해도 우리 토큰으로 리뷰가 돌던 것을 막는다 |
| 체크아웃 | `refs/pull/N/head` | 리뷰어가 PR 에서 바뀐 파일과 지침을 Read / Grep 으로 읽는다. `issue_comment` 의 기본 체크아웃은 main 이다 |
| 도구 허용 | Read / Grep / Glob / Agent / Task 와 게시용 Bash(`gh`, `jq`, `mktemp`, `cat`, `rm`)만. Write / Edit 금지 | Agent 가 없으면 거르기 위임이 드러나지 않게 자가검토로 바뀐다. Bash 를 열어 두면 체크아웃한 PR 코드를 실행할 길이 생긴다 |
| 등급 | 🔴 P1 치명 ~ ⚪ P5 참고 다섯 단계. P4 와 P5 는 리뷰당 세 개까지 | 두 단계로는 꼭 고칠 것과 참고할 것 사이가 비었다. 등급은 반영하지 않았을 때 깨지는 것으로 정한다 |
| 거르기 | 수집한 지적의 통과 여부를 서브 에이전트가 판정. 맡기지 못하면 리뷰 본문 끝에 그 사실을 남긴다 | 지적을 만든 쪽이 판정하면 통과시키는 쪽으로 기운다 |
| 위험 라벨 | main 의 `scripts/pr-risk-labels.sh` 하나가 프론트와 백엔드 경로 규칙을 함께 보고 라벨을 달아 프롬프트에 넘긴다. 머지 규칙은 바꾸지 않는다 | LLM 위험 점수는 실행마다 달라 기준이 못 된다. PR head 의 스크립트를 쓰면 PR 이 자기 규칙을 바꿔 피할 수 있다 |
| Review Event | 항상 `COMMENT` (🔴 있어도 차단 안 함) | 리뷰는 권고. 머지 차단은 인간 reviewer 책임. `REQUEST_CHANGES` 사고 회피 |
| 요약 게시 | 인라인과 같은 리뷰의 `body` 로 통합 — `reviews` POST 1회 | 요약과 인라인이 리뷰 단위로 접힘. 일반 댓글로 분리하면 Conversation 탭에서 흩어짐 |
| 리뷰 요청 본문 전달 | `mktemp` 임시 파일 + `--input` | 인자로 직접 쓰면 shell 이 `\n` 을 literal 두 글자로 전달. 체크아웃 밖에 만들어 wrapper 의 `git add -A` 회피 |
| 댓글 정리 | 일반 댓글과 인라인은 DELETE (REST) | minimize 누적 시 PR 스레드 시각 답답. 이력은 GitHub event log 로 충분 |
| 리뷰 정리 | 리뷰 본문만 GraphQL `minimizeComment` (OUTDATED) | 제출된 COMMENT 리뷰는 REST 삭제가 없고 dismiss 도 APPROVED / CHANGES_REQUESTED 에만 가능. 실행당 1개라 누적량이 인라인과 다름 |
| Dummy 댓글 자동 정리 | post-step 에서 `jq` 로 길이, placeholder, 등급 표시(색 원과 P1~P5) 부재를 검사해 삭제 | Claude action 이 자연어 sanity check 무시하고 placeholder 게시하는 사고 (fos-blog PR #114) 강제 차단. 판정을 `jq` 안에서 해야 여러 줄 본문이 `while read` 를 깨뜨리지 않는다 |
| literal `\n` 자동 보정 | post-step bash 로 세 경로 검출 후 perl 교체 — 일반 댓글과 인라인은 comments PATCH, 리뷰 요약은 `reviews/{id}` PUT | Claude action 이 가이드 무시하고 `--field body="...\n..."` 호출 시 literal 두 글자 박힘 (PR #208 사고). 보정 후 정상 줄바꿈 |
| 모델 | opus 리뷰어 (`--model opus` 별칭). 실제 모델 ID 는 실행 기록에서 읽어 Job Summary 에 남긴다 | haiku specialist 는 추론 능력이 떨어져 오탐(false positive) 많고 실제 버그 놓침. 리뷰 신뢰도 > 토큰 절약. `opus` 별칭은 버전업 무수정 추종 |
| action 버전 | `anthropics/claude-code-action@v1` major 태그 | 릴리스마다 다시 고정하지 않는다. #1290 회귀로 걸었던 고정은 같은 설정의 다른 저장소가 `@v1` 로 정상 동작해 풀었다 |
| 실패 원인 기록 | 실행이 `is_error` 로 끝나면 실행 파일의 결과 문구나 마지막 assistant 문구를 500자까지 `::error` 와 Job Summary 에 남긴다 | action 은 `is_error` 만 남겨 사용량 한도와 토큰 오류를 가를 수 없었다. 공개 저장소라 리뷰 본문 전체는 남기지 않는다 |
| allowed_bots | `"*"` | 광범위 허용 — Dependabot/Claude 모두 차단되지 않음. 보안 검증은 리뷰어가 담당 |
| diff 필터 | `frontend/pnpm-lock.yaml`, `*.lock`, `*.snap`, `backend/gradle/wrapper/gradle-wrapper.jar`, `backend/build/`, `*.class` 제외. Flyway SQL 은 제외하지 않는다 | 노이즈 감소. `*` 가 없는 pathspec 은 저장소 루트 기준이라 하위 프로젝트 경로를 붙인다 |
| Job timeout | 15분 | agent hang 시 불필요한 비용 방지 |
| Check Run 수동 등록 | `issue_comment` 트리거 시 수동 생성 | issue_comment workflow run 이 PR Checks 탭에 자동 노출 안 됨 — 수동 Check Run 으로 진행 상태 가시화 |
| 프롬프트 관리 | 공통 본문 `.github/claude-review-prompt-common.txt` 와 점검 목록 `-frontend.txt`, `-backend.txt` 로 외부 분리. 바뀐 경로로 점검 목록을 고르고 둘 다 바뀌면 이어 붙인다. `frontend/`, `backend/` 어느 쪽도 바뀌지 않으면 두 목록을 모두 붙인다. 선택 스크립트 `scripts/review-checklist.sh` 는 보안 경계가 아니라 PR head 의 것을 쓴다. `envsubst` 로 `$PR_NUMBER`·`$REPO`·`$RISK_LABELS`·`$CHECKLIST` 치환 | ~180줄 인라인 heredoc 가독성·diff 정밀도 확보. `.md` 아닌 `.txt` 로 IDE 포맷터의 glob·식별자 깨짐 회피 |
| 소규모 PR 스킵 | 안 함 | 모든 PR 동일 리뷰 |

**대안 기각**:
- `REQUEST_CHANGES` event 유지: PR 머지 버튼 비활성으로 사용자가 매번 dismiss 해야 함 + Reviews 탭 빨간 X 가 시각적으로 부정적. 안전망 가치보다 마찰 비용 큼.
- minimize 유지: PR 스레드에 minimized 블록 누적 → "Show outdated" 토글이 보이고 답답. 이력은 GitHub Activity 탭에서 보존.
- 요약을 `gh pr comment` 일반 댓글로 분리 (2026-09-01 기각): 요약과 인라인이 Conversation 탭에서 흩어지고 등록 호출이 2회로 늘어남. 리뷰 `body` 도 Conversation 탭에 그대로 노출되므로 분리 이유가 없었음.
- 리뷰까지 포함해 전부 minimize: DELETE 결정을 뒤집게 되고 minimized 블록이 누적됨. REST 로 지울 수 없는 리뷰 본문 한 종류에만 예외를 둠.

**요청 본문 전달 강제 (실측 사고)**:
- 리뷰 요청 JSON 은 `mktemp` 로 만든 임시 파일에 담아 `--input` 으로 넘긴다.
- `--field body="...\n..."` 패턴은 shell 이 `\n` 을 literal 두 글자로 전달해 본문 줄바꿈이 깨진다.
- JSON 문자열 안의 `\n` 은 JSON parser 가 해석하므로 정상.
- 임시 파일은 체크아웃 밖에 만든다. action wrapper 의 `git add -A` 가 체크아웃 안 파일을 PR 브랜치 commit 으로 흘려보낸다 (fos-blog PR #83 사고).

---

<a id="adr-f12"></a>

## ADR-F12: Page에서 serverApiGet 직접 호출 금지
**결정**: Page(Server Component)에서 `serverApiGet`을 직접 호출하지 않고, 반드시 Action을 통해 데이터를 조회한다.

**이유**:

- ADR-F04의 `Page → Action → Service → lib/server/api` 계층 원칙 위반
- Page가 API 엔드포인트 URL을 직접 알면 안 됨 — Service 계층의 추상화가 무의미해짐
- Action을 거치지 않으면 인증(`requireAuth`) 검증이 누락될 위험
- `serverApiGet` 직접 호출 시 에러 핸들링이 try/catch + console.error로 산발적 → Action의 `ActionResult` 패턴으로 통일

**적용 사례**:

- `transactions/page.tsx`: `serverApiGet("/families")` → `getSelectedFamilyAction()` + `getFamilyCategoriesAction()`
- `categories/page.tsx`: `serverApiGet("/families/.../categories")` → `getFamilyCategoriesAction()`

**redirect 책임**: Action이 아닌 Page에서 결과를 보고 판단한다. Action은 `ActionResult`를 반환하는 순수 controller 역할만 담당하고, 동일 Action을 사용하는 다른 호출처(Client Component 등)에 영향을 주지 않기 위함.

---

<a id="adr-f13"></a>

## ADR-F13: OKLCH 색 시스템 채택
- **결정**: 모든 디자인 토큰을 OKLCH 색 공간으로 정의한다 (HSL 채널 패턴 폐기). brand 50~900, semantic(income/expense/warning), neutral 0~950, surface(bg/fg/border 등) 모두 `oklch(L C H)` 평면 값.
- **맥락**: Teal fintech 리디자인(`tokens.js` / `styleguide.css` handoff)에서 brand=Teal h=188(→ 현재 Toss Blue h=257, [ADR-F28](#adr-f28)) + semantic 분리 + dark mode 토큰을 한 번에 정의해야 함. HSL 은 어두운 색 명도가 hue 따라 다르게 인지됨 → 토큰 스케일이 시각적으로 균일하지 않음.
- **대안 기각**:
  - HSL 채널 + shadcn 패턴 유지: 어두운 색에서 명도 들쭉날쭉. brand 50~900 같은 단계 스케일에 부적합.
  - 하이브리드 (shadcn HSL + OKLCH 일부): 동일 토큰을 두 형식으로 관리 → 동기화 사고 위험.
- **트레이드오프**: 실측상 `src/components/ui/` 내 `hsl(var(--))` 패턴 0건 — `:root` 의 토큰 값 OKLCH 교체만으로 자동 호환. 별도 rewrite phase 불필요.
- **예외**: white/black alpha overlay (`rgba(255,255,255,α)`, `rgba(0,0,0,α)`) 는 functional alpha 표현이라 OKLCH 의무화 대상 외. `.glass`, `.gradient-card-overlay`, `.hover-lift` 등 글래스/딤 효과에 한정. brand/semantic 색은 OKLCH 강제.
- **적용 범위**: `src/app/globals.css` + `src/components/ui/*`.

---

<a id="adr-f14"></a>

## ADR-F14: Pretendard Variable 폰트 도입
- **결정**: 메인 sans 폰트를 Geist 에서 **Pretendard Variable** 로 교체. 수치 폰트는 **Inter** 도입 (tabular-nums + `.num` 유틸리티). next/font `localFont` 자체 호스팅 (woff2).
- **맥락**: 가족 단위 가계부 UI 는 한글 비중 100%. Geist 는 라틴 우선 — 한글은 system fallback 으로 떨어져 한 화면에 두 폰트가 섞임. Pretendard 는 한국 fintech 표준에 가까운 한글 가독성.
- **대안 기각**:
  - Geist 유지: 한글 fallback 으로 일관성 결여.
  - Apple SD Gothic Neo (system): 윈도우/안드로이드에서 다른 폰트로 렌더 → cross-platform 비일관.
  - CDN @import: 도메인 의존 + FOUT 위험. self-host woff2 + next/font 가 CLS 방지 + 결정적 빌드.
- **적용 범위**: `src/app/layout.tsx` + `src/app/globals.css` (`--font-sans`, `--font-num`).

---

<a id="adr-f15"></a>

## ADR-F15: next-themes attribute='data-theme'
- **결정**: `next-themes` 의 `attribute` 옵션을 기본 `class` 에서 `data-theme` 으로 전환. dark 토큰 적용 셀렉터는 `[data-theme="dark"]`.
- **맥락**: Handoff 토큰 컨벤션이 `[data-theme="dark"]` 로 정의됨. 또한 기존 `.dark` 셀렉터는 유틸리티 클래스 (`dark:bg-...`) 와 grep 시 동시에 잡혀 토큰-only 변경 추적이 어려움.
- **대안 기각**:
  - `attribute='class'` 유지: handoff 토큰을 그대로 import 하려면 셀렉터를 `.dark` 로 일괄 치환해야 하고, Tailwind v4 의 `dark:` 변형이 `.dark` 클래스 의존이라 둘 사이의 동작 차이를 매번 확인해야 함.
  - 두 셀렉터 병행 (`.dark, [data-theme="dark"]`): 토큰 정의 중복.
- **트레이드오프**: Tailwind v4 의 `dark:` 변형이 기본으로 `.dark` 클래스를 본다 — `@custom-variant dark (&:where([data-theme="dark"], [data-theme="dark"] *))` 커스텀 정의 필요. plan001 phase 1 에서 globals.css 에 추가.
- **적용 범위**: `src/app/providers.tsx` (or wherever `ThemeProvider` is) + `src/app/globals.css`.

---

<a id="adr-f16"></a>

## ADR-F16: 카테고리 월 분포는 Server Action 측 집계

- **status**: `superseded`
- **대체된 부분**: 결정 전체. 월 합계는 [ADR-F30](#adr-f30) 에 따라 백엔드 집계 API 로 받는다. 아래는 2026-05 당시의 맥락이다.
- **결정**: 대시보드의 카테고리별 월 합계는 backend 신규 endpoint 없이 기존 `GET /expenses?month=YYYY-MM` 응답을 `services/dashboard/dashboard-service.ts` 의 `getMonthlyCategoryBreakdown(familyUuid, year, month)` 에서 집계한다.
- **맥락**: handoff dashboard 의 "카테고리 분포" 가 핵심 강조 요소. backend 에 신규 endpoint 신설 시 frontend plan002 이 backend 일정에 묶임. 1가구 월 거래 100~300건 추정 → 응답 사이즈 50~150KB 수준, Server Action 집계로 충분.
- **대안 기각**:
  - backend 신규 endpoint (`GET /families/{u}/stats/category-breakdown`): 가장 깔끔하나 frontend 가 backend 일정 의존. 추후 row 수 임계 초과 시 plan 분리해 재검토.
  - 기존 `getDashboardStats` 응답에 카테고리 합계 끼워넣기: stats DTO 비대해지고 다른 호출처가 불필요 데이터 수신.
- **임계 트리거** (재논의 조건): 가구당 월 평균 거래수 500건 초과 또는 dashboard 진입 TTI 700ms 초과 측정 시 backend endpoint 분리 검토.
- **적용 범위**: `services/dashboard/dashboard-service.ts`, `actions/dashboard/get-monthly-category-breakdown-action.ts`, `services/analytics/analytics-service.ts` (plan006 — `getMonthlyCategoryBreakdown` 을 service→service 재사용해 월별 추이/전월 delta 클라 집계. endpoint 분리 트랙은 옛 백엔드 저장소의 issue #126 에서 다뤘다. 닫힌 이슈였고 저장소를 지워 링크는 없다).

<a id="adr-f17"></a>

## ADR-F17: URL searchParams ↔ Client state 동기화는 draft 패턴
- **결정**: URL searchParams 를 입력 폼 (input/select) 의 초기값으로 쓰면서 외부 URL 변경 (브라우저 뒤로/앞으로, 다른 컴포넌트의 router.replace) 에도 추종해야 할 때, **useEffect 안 setState 가 아닌 derived value 패턴** 을 사용한다.

  ```tsx
  // ✅ draft 패턴
  const [draft, setDraft] = useState<string | null>(null);
  const value = draft ?? searchParams.get("q") ?? "";
  // 사용자 입력: setDraft(newValue)
  // URL apply 후: setDraft(null) — URL 단일 소스 복귀
  ```

- **맥락**: React 19 의 `react-hooks/cascading-render` 규칙이 `useEffect` 안 `setState` 직접 호출을 차단. URL 변경을 감지해서 input state 를 다시 set 하는 직관적 코드가 lint 오류 + 잠재적 cascading render 위험. 사용자 입력 (draft) 과 URL (current) 의 두 진실원을 단일 derived value 로 합쳐 effect 제거.

- **대안 기각**:
  - `useEffect(() => setState(currentValue), [currentValue])`: eslint rule 위반 + cascading render 위험.
  - URL 만 진실원 + 모든 입력 즉시 router.replace: 사용자 타이핑마다 navigation 발생 → 성능/UX 저하.
  - `key={searchParams}` 로 force-remount: 컴포넌트 내부 다른 state (Popover open 등) 도 reset 되는 부수효과.

- **적용 범위**: URL searchParams 기반 client 필터 컴포넌트 전반. 첫 적용 사례 — `AmountRangeFilter.tsx` (plan003). props 기반 추종에도 변형 적용 가능 (`AddExpenseDialog.tsx` 의 `activeTypeDraft ?? defaultType`, plan005).

- **예외 — 외부 부수효과 진입 신호 (fetch trigger, subscription 등)**: `useEffect` 안 `setState(true)` 가 명백히 필요한 경우 (예: dialog open 시 fetch 시작 → `setIsLoadingCategories(true)` → fetch 결과로 `false`. derived value 로 대체 불가 — fetch 실패 시 영원히 loading) 는 해당 라인에 `// eslint-disable-next-line react-hooks/set-state-in-effect` + 1줄 사유 주석으로 허용. 신규 코드 작성 시 우선 derived 시도 → 막힐 경우만 적용. 첫 적용 사례 — `AddExpenseDialog.tsx:67` (plan005).

---

<a id="adr-f18"></a>

## ADR-F18: react-day-picker → @daypicker/react 패키지 이전
- **결정**: `react-day-picker` v9 → v10 메이저 업그레이드 + 패키지명을 공식 권장 신 namespace 인 `@daypicker/react` 로 이전. v10 의 폐기 props/event handler 일괄 교체.
- **맥락**: PR #222 (Dependabot) 가 단순 dep bump 만 제안 — 폐기 API 제거된 v10 에서 코드 마이그레이션 누락 시 빌드/런타임 회귀. 또 v10 공식 권장이 신 namespace `@daypicker/react` 로 이동 (장기 수명 + non-Gregorian calendar 들도 `@daypicker/*` 스코프). frontend 사용처는 단 2 파일 (`src/components/ui/calendar.tsx` shadcn wrapper + `src/components/dashboard/CalendarView.tsx`) 로 작아 한 PR 에 dep+코드 통합 적합.
- **대안 기각**:
  - `react-day-picker` 패키지명 유지: v10 호환 OK 이지만 신 namespace 가 공식 표준. 후속 add-on 패키지 (`@daypicker/persian` 등) 와 일관성.
  - v9 stick: 보안/유지보수 리스크 누적. 메이저 upgrade 가 작아 미루지 않는 게 합리적.
- **트레이드오프**: import 경로 + `style.css` 경로 갱신 필요. `DayPicker` API 자체는 동일 export. peer dep 충돌 점검 필요 (구 이름 의존 다른 dep 가 있으면).
- **폐기 prop 교체 매핑**:
  - `fromMonth/toMonth` → `startMonth/endMonth`
  - `fromDate/toDate` → `hidden={{ before/after }}`
  - `initialFocus` → `autoFocus`
  - `onWeekNumberClick/onDayKey*/onDayPointer*/onDayTouch*` → 커스텀 `WeekNumber`/`DayButton` 컴포넌트
- **적용 범위**: `package.json`, `src/components/ui/calendar.tsx`, `src/components/dashboard/CalendarView.tsx`.

---

<a id="adr-f19"></a>

## ADR-F19: TypeScript 5.9 → 6.0 메이저 이전 + breaking 대응 패턴
- **결정**: TypeScript 컴파일러를 `^5` 에서 `^6` 메이저로 이전. release note 의 stricter inference / lib.d.ts 변경 / decorator 표준 채택 등으로 발생하는 type 에러를 plan008 의 각 phase 에서 카테고리별 패턴 적용으로 일괄 수정.
- **맥락**: PR #179 (Dependabot) 가 단순 dep bump 만 제안 — typescript 메이저는 전체 `.ts/.tsx` 컴파일에 영향이라 tsc 실측 후 에러 카테고리 식별 필수. ky/react-day-picker (단일 파일) 대비 영향 면적 큼. 미루면 보안/성능 개선 누적 손실 + msw·jest·eslint-config-next 등 peer dep 가 ts6 로 먼저 옮겨가면 빌드 분리 위험.
- **대안 기각**:
  - ts5 stick: 보안/유지보수 + 신 inference 혜택 미수용. peer dep 호환 점진 분리 위험.
  - Dependabot PR #179 그대로 머지: tsc 에러 무대응으로 빌드 회귀.
- **트레이드오프**: 메이저 dep bump 의 첫 번째 적용. 발견 에러를 단순 fix 로 처리 못 하는 케이스 (예: inference 변경으로 라이브러리 측 타입 깨짐) 는 별도 plan 으로 분리.
- **breaking 대응 패턴 (plan008 실측)**:
  - lib.d.ts 변경: 0건 — `target: ES2017` + `skipLibCheck: true` 조합으로 신규 Temporal/ES2025 type 노출 없음.
  - inference 변경: 0건 — contextual typing 변화로 인한 에러 미발생.
  - 신 기본값 (`noUncheckedSideEffectImports: true`): 1건 — `src/app/layout.tsx` 의 `import './globals.css'` TS2882. `src/types/css.d.ts` 에 `declare module '*.css'` 선언으로 fix.
  - peer dep 충돌: `@typescript-eslint/*` 8.48.1 (`typescript <6.0.0` 제약) → 8.59.2 (`<6.1.0`) 직접 devDep 추가로 fix.
  - tsconfig.json 변경: 없음 — 기존 `strict: true` / `moduleResolution: bundler` / `module: esnext` 가 ts6 기본값과 일치.
  - 신 옵션 (`verbatimModuleSyntax` / `noUncheckedIndexedAccess` / `exactOptionalPropertyTypes`): 변경 폭 큼 → plan009 후속 검토로 분리.
  - 향후 ts7+ 이전 시 본 ADR 참조점.
- **적용 범위**: `package.json`, `tsconfig.json`, src/ 전체 (해당 파일만 fix).

<a id="adr-f20"></a>

## ADR-F20: 인증 안 한 사용자의 `/` 진입은 Landing 표시
- **결정**: `/` 라우트를 public 으로 변경. 인증 안 한 사용자는 Landing (Hero + Features 3 + CTA), 인증 사용자는 `/dashboard` 자동 redirect. `src/app/page.tsx` 가 page-level `auth()` 호출 후 세션 분기 처리. proxy.ts (ADR-F19) 는 전역 auth proxy 라 별도 matcher 수정 불필요.
- **맥락**: 기존 동작은 인증 안 한 모든 진입 = `/auth/signin` 강제 redirect. login 페이지가 사실상 첫 화면이라 "어떤 서비스인지" 가 부재 — 신규 사용자가 가입 가치를 판단할 정보 없음. 부부 가계부 라는 도메인 특성상 가치 제안 (가족·카테고리·분석) 을 먼저 보여줄 entry 가 필요.
- **대안 기각**:
  - `/auth/signin` 만 운영하고 그 안에 가치 제안 카피 추가: signin 페이지가 비대해지고 (form + marketing 혼재) 분석/추적 단위가 모호.
  - 별도 `/landing` 라우트 + `/` 는 그대로 redirect: URL 두 개로 분기되어 marketing 전환 추적 + SEO root domain 가치 분산.
- **트레이드오프**: protected route 직접 URL 진입 (예: `/dashboard` 의 deep link 공유) 시 Landing 으로 한 단계 더 거쳐야 함. `(authenticated)/layout.tsx` 의 unauth redirect 대상도 Landing 으로 통일.
- **적용 범위**: `src/app/page.tsx`, `src/app/(authenticated)/layout.tsx`.

<a id="adr-f21"></a>

## ADR-F21: Add/Edit Transaction 다이얼로그 단일화

**대체된 부분**: 거래 종류 전환 시 날짜를 초기화하던 정책은 [ADR-F32](#adr-f32)의 날짜 유지 정책으로 대체한다.
나머지 단일 다이얼로그 결정은 유지한다.

- **결정**: 지출/수입/고정지출 3 도메인의 Add 다이얼로그를 단일 `AddTransactionDialog` + 3 segmented 토글 (gradient-expense / gradient-income / gradient-budget) 로 통합. Edit 도 동일 패턴 (`EditTransactionDialog`, type 잠금). 위치: `src/components/transactions/dialogs/`.
- **맥락**: 같은 "추가" 진입점이 6 곳 (Dashboard QuickActions / BottomNav FAB / Transactions 의 지출·수입·고정지출 탭 / Settings 고정지출) 인데 호출하는 다이얼로그가 셋 (AddExpenseDialog / AddIncomeDialog / AddRecurringExpenseSheet) 으로 분기. 시각·반응형 (Sheet 방향 right vs bottom)·field 구성·legacy 토큰 (`text-destructive`, `text-gray-500`, `text-muted-foreground`) 모두 불일치 → 사용자 인지 부담 + 유지보수 비용.
- **대안 기각**:
  - 도메인별 분리 유지 + 시각·토큰만 통일: 진입점마다 다른 UI 가 그대로 노출. type 전환 (지출→수입) 시 다이얼로그 닫고 다른 진입점 찾아야 함 — 같은 의도 ("거래 추가") 가 분기됨.
  - "Add+ 페이지" 신설 (전용 라우트): 모달 흐름이 자연스러운 작업을 페이지로 격상 → 단순 추가가 무거워짐. recurring 처럼 가끔 쓰는 영역에서 매번 라우팅 비용.
- **트레이드오프**: 단일 컴포넌트가 3 type conditional 필드 분기 — form complexity ↑ but UX 일관성 ↑. type 전환 시 type-specific 필드 (date vs dayOfMonth+name) 가 mount/unmount 되며 입력 잔존 정책은 "이전 type 의 amount/category/description 은 유지, type-specific 필드만 초기화" 로 명시.
- **갱신 (2026-09-30)**: 진입점에 달력의 「이 날짜에 추가」 가 더해지고 대시보드 QuickActions 는 빠졌다. 진입점은 `defaultDate` 도 넘긴다. 수정 다이얼로그에 삭제 버튼을 둔다([ADR-F32](#adr-f32)).
- **적용 범위**: `src/components/transactions/dialogs/{Add,Edit}TransactionDialog.tsx`, `src/components/transactions/forms/TransactionFormFields.tsx`, 진입점 갱신, legacy 다이얼로그 6 파일 제거 (Add/EditExpenseDialog, Add/EditIncomeDialog, Add/EditRecurringExpenseSheet).

<a id="adr-f22"></a>

## ADR-F22: 민감 정보를 다루는 컴포넌트는 Server Component 로 유지 + Client 핸들러는 children 슬롯
- **결정**: `error.tsx` / `not-found.tsx` 같은 에러 경계 카드 (`StatusCard`) 는 **Server Component 로 고정**. 클라이언트 핸들러 (`reset()` 등) 가 필요한 영역은 별도 `"use client"` 래퍼 (`ErrorResetButton`) 를 만들어 Server Component 의 `children` 슬롯에 주입. `process.env.NODE_ENV` 분기를 포함한 dev-only 메시지 (`error.message`, stack trace, digest 등) 도 Server Component 본문에서 평가하여 production 트리에서 dev JSX 자체가 제외되도록 한다.
- **맥락**: Next.js App Router 에서 `error.tsx` 는 `"use client"` 필수 (Error boundary 규약). 직관적으로는 `error.tsx` 안의 모든 컴포넌트가 Client 가 되지만, Server Component 를 `children` 으로 받으면 그 본체는 서버에서 렌더된다. 이를 활용하면 (a) `error.message` 같은 민감 정보의 `process.env.NODE_ENV` 분기를 서버측에서 평가해 production 클라이언트 번들에 dev 텍스트 누출 차단, (b) `onClick` 같은 직렬화 불가 prop 을 Server Component 인터페이스에서 제거. PR #248 코드 리뷰에서 두 사고 가능성이 동시 지적됨.
- **대안 기각**:
  - 전체 `"use client"` (StatusCard 도 Client): `process.env.NODE_ENV` 가 클라이언트에서 평가되어도 Next.js 번들러가 dead code elimination 으로 dev 분기를 제거하지만, `error.message` 문자열 자체가 클로저에 캡처되어 production 번들에 포함될 위험 잔존. devtools 에서 함수 본문 확인 가능. 또한 Server Component 의 정적 렌더 + 데이터 페칭 이점도 포기.
  - `process.env.NODE_ENV` 분기를 `error.tsx` 측에서 수행 + StatusCard 는 단순 receiver: `devMessage` prop 자체를 `undefined` 로 전달해도 dev JSX 가 `error.tsx` 의 client 번들에 남음. 책임 분산이 안 됨.
- **트레이드오프**: Server Component + Client 래퍼 분리는 파일 수 증가 (`ErrorResetButton.tsx` 같은 1-호출 래퍼). 단 보안 + 직렬화 안전성 이득이 크고, 패턴이 일관되면 후속 영역 (예: Sentry wiring) 에서 동일 구조 재사용 가능.
- **적용 범위**: `src/components/error/StatusCard.tsx` (Server) + `src/components/error/ErrorResetButton.tsx` (Client) + `src/app/{,(authenticated)/}error.tsx` + `src/app/global-error.tsx`. 향후 server-side dev 분기를 포함하는 모든 컴포넌트에 동일 원칙 적용 (예: Sentry digest 카드, debug overlay).

---

<a id="adr-f23"></a>

## ADR-F23: semantic foreground 토큰 (`--color-{semantic}-fg`) 으로 강조 배경 위 텍스트 색 명시
- **결정**: `bg-expense` / `bg-income` / `bg-warning` 같은 채도 높은 시맨틱 배경 위에 텍스트를 얹을 때는 `text-white` / `text-black` 하드코딩 대신 **시맨틱 foreground 토큰** (`--color-expense-fg` 등) 을 사용한다. light/dark 양쪽에서 동일하게 강조 배경과 대비되는 near-white 값 `oklch(0.985 0.003 <배경 hue>)` 으로 정의 — surface `--color-fg` (light=어두움, dark=밝음) 와 분리. **hue 통일 원칙**: foreground 토큰의 hue 는 항상 대응 배경 토큰과 일치 (시맨틱 일관성). plan017 의 임시 `expense-fg hue=230` 은 plan022 에서 hue=25 로 통일.
- **맥락**: plan017 NotificationBell 의 `bg-expense text-white` Badge 가 ADR-F13 (OKLCH 토큰 강제, hex/rgb/hsl/named color 금지) 의 정신과 충돌. 단순 교체로 `text-bg` 같은 surface foreground 를 쓰면 dark mode 에서 `--color-bg` 가 어두운 색이 되어 빨간 expense 배경 위에서 가독성이 더 나빠짐. 강조 배경은 light/dark 무관하게 채도 유지가 의도이므로 foreground 도 모드 독립적 near-white 가 자연스럽다.
- **대안 기각**:
  - `text-white` 유지: ADR-F13 의 "globals.css `@theme` 외부에서 hex/rgb/hsl/named 색 금지" 원칙 위반. 디자인 토큰 단일 소스 깨짐.
  - `text-bg` (surface foreground): light/dark 가 반전되는 토큰이라 강조 배경 위 가독성 일관성 깨짐 (dark mode 에서 어두운 색 → expense 빨강 위 contrast 약화).
  - 인라인 `style={{ color: "white" }}`: ADR-F13 위반 + CLAUDE.md "인라인 style 최소화" 위반.
- **트레이드오프**: 토큰 수 증가 (brand-fg / expense-fg / income-fg / warning-fg 4 종). 단 ADR-F13 의 정합성 + dark mode 가독성 일관성 이득이 큼.
- **적용 범위 (plan022 완전 정착)**: `src/app/globals.css` 4 토큰 정의 + 51 호출처 일괄 마이그레이션. **매핑 룰**:
  - `gradient-budget` / `gradient-family` / `gradient-primary` / `gradient-category` / `bg-brand-*` 위 → `text-brand-fg`
  - `gradient-expense` / `bg-expense` / `bg-destructive` 위 → `text-expense-fg`
  - `gradient-income` / `bg-income` 위 → `text-income-fg`
  - `bg-warning` 위 → `text-warning-fg`
  - gradient/배경이 surface (bg-bg-elev 등) 인 경우는 본 ADR 비대상 — 일반 `text-fg` 사용

---

## ADR-F24: sonner richColors OFF + Teal 토큰 직접 매핑 (2026-05-19)

- **결정**: `Toaster` 의 `richColors` 옵션을 끄고, toast 타입별 색을 OKLCH 토큰으로 직접 매핑한다. success=`--color-brand-500` (Teal h=188), error=`--color-expense`, warning=`--color-warning`, info=`--color-brand-400`. 컨테이너 톤은 `bg-bg-elev` / `border-border` / `text-fg`. `AlertDialog` 도 동일 원칙으로 overlay=`bg-fg/60`, content=`bg-bg-elev`, description=`text-fg-muted` 로 통일.
- **맥락**: sonner `richColors=true` 의 자동 success(green h≈140)/error(red)/warning(amber)/info(blue) 가 plan001 Teal 시스템 (brand h=188) 과 충돌. 특히 success green 이 income (h=152) 과도 가까워 시맨틱 혼동 가능. AlertDialog 의 `bg-white` / `bg-black/80` / `text-muted-foreground` 잔재는 shadcn v3 legacy 로 dark mode 미지원.
- **대안 기각**:
  - `richColors` 유지 + 컨테이너만 토큰화: success green 이 brand Teal 과 충돌 + income 시맨틱 혼동 잔존. 가장 적은 변경이지만 핵심 문제 미해결.
  - richColors OFF + 단색 (popover-only): success/error 시각 강도 차이 사라져 critical 액션 ↔ confirmation 구분 약화. 토스트 본연의 즉시 인지 가치 손실.
- **트레이드오프**: 토큰 직접 매핑은 sonner 업데이트 시 className target (`[data-sonner-toast][data-type=...]`) 시그니처 변경 영향 받음 — 단 sonner 가 안정적 API 이고 toast 사용처가 20+ 곳이라 일관성 이득이 큼.
- **적용 범위**: `src/components/ui/sonner.tsx` + `src/app/providers.tsx` + `src/components/ui/alert-dialog.tsx`. AlertDialog 파괴적 Action (Delete*Dialog 4 호출처) 은 호출처에서 `variant="destructive"` 명시 (`buttonVariants({ variant: "destructive" })` 가 이미 expense 토큰으로 매핑됨).

## ADR-F25: Server Action 권한 검증 3-패턴 표준화 (2026-05-20)

- **결정**: 가족 식별자를 다루는 모든 Server Action 은 아래 3 패턴 중 하나로 권한 검증을 명시한다.
  - **A. Single-family** (현재 선택 가족만 다룸): `getSelectedFamilyUuid()` + 입력 `familyUuid` 가 있으면 session 과 비교. expense/income/category 의 update/delete + create.
  - **B. Multi-family** (settings 처럼 본인 속한 여러 가족 다룸): `assertFamilyAccess(familyUuid)` helper. `family/update`.
  - **C. Entity ownership** (entity UUID 로부터 family 유추): entity 의 familyUuid 가 본인 소속인지 확인. `invitation/delete`.
- **맥락**: PR #271 (plan021) 리뷰에서 `updateFamilyAction` 이 `requireAuth()` 만 수행 → 클라이언트가 본인이 속하지 않은 다른 가족 UUID 주입 시 권한 상승 가능 지적. 감사 결과 `category/create` 의 `familyUuid || getSelectedFamilyUuid()` fallback, `invitation/delete` 의 entity 권한 검증 부재도 발견. CLAUDE.md "금지사항" 의 `formData.get('familyUuid')` 금지 규칙이 모호하게 적용됨.
- **대안 기각**:
  - 단일 helper (예: `requirePermission`) 로 통합: input shape 가 패턴마다 달라 (single uuid / multi uuid / entity uuid) 인자 분기 복잡. 호출처에서 패턴이 보이지 않아 검토 부담 ↑.
  - backend trust only (frontend 검증 생략): backend 단일 장애 시 권한 상승 노출. 이중 방어 원칙에서 명시 권장.
- **트레이드오프**: `assertFamilyAccess` 는 매 호출마다 `getFamilies()` 페치 (단 backend 가 캐시 + 짧은 TTL). single-family 패턴의 session 비교는 캐시된 JWT 만 사용해 0 네트워크.
- **적용 범위**: `src/lib/server/auth/auth-helpers.ts` (helper) + `src/actions/family/update-family-action.ts` (B) + `src/actions/category/create-category-action.ts` (A, session 비교 추가) + `src/actions/invitation/delete-invitation-action.ts` (C). 다른 Action 은 이미 표준 패턴 준수.

## ADR-F26: 백엔드 401 응답을 인증 만료로 분류해 로그인으로 일관 리다이렉트 (2026-06-02)

- **결정**: 백엔드 401 응답은 "인증 만료" 단일 경로로 처리한다.
  - `handleActionError` (try-catch 변환기) 가 `ServerApiError.status === 401` 을 `ActionError.sessionExpired()` (코드 `A002`) 로 변환한다.
  - `getActionDataOrDefault` 는 결과 코드가 `A001`/`A002` (인증 에러) 일 때는 기본값을 반환하지 않고 `handleActionError` 로 redirect 한다.
  - refresh 실패는 jwt callback 에서 `token.error` 표시만 하고, 실제 무효화는 다음 API 호출이 401 을 받는 시점에 일어난다.
  - redirect 목적지는 `/auth/signin?error=auth` 이며, signin 진입 시 sonner 토스트로 만료를 고지한다.
- **맥락**: 기존엔 401 이 `ServerApiError(status:401)` 까지는 도달했다.
  그러나 `handleActionError` 가 status 를 검사하지 않고 모두 `internalError` (C 계열) 로 변환해 `onAuthError` (A001/A002) 분기에 닿지 못했다.
  그 결과 `getActionDataOrDefault` 를 쓰는 dashboard/budget 은 만료 응답을 빈 데이터(0)로 숨겨 무효 토큰인 채 페이지가 잔존했다.
  refresh 실패 시에도 jwt callback 이 만료 토큰을 유지해 무효 요청이 계속 나갔다.
- **대안 기각**:
  - HTTP 클라이언트 (`client.ts` afterResponse hook) 에서 직접 redirect: Service 레이어에서 호출되는데 `redirect()` 는 RSC/Action context 구분이 필요해 레이어 경계를 깬다. 변환은 에러 레이어에 두는 것이 책임에 맞다.
  - jwt callback 에서 refresh 실패 즉시 세션 무효화: NextAuth v5 동작 검증 부담이 크고, 페이지 진입 자체가 차단돼 토스트 고지 흐름과 맞물리기 어렵다. 401 시점 무효화가 기존 `action-result-handler` 흐름과 일관된다.
- **적용 범위**: `src/lib/errors/action-error.ts` (변환) + `src/lib/server/action-result-handler.ts` (인증 에러 가드) + `src/lib/server/auth/refresh-token.ts` (refresh 가드·token.error 표시) + `src/lib/server/auth/config.ts` (jwt callback 진입점) + signin 토스트.

## ADR-F27: Radix `DropdownMenuItem` 안에서 form submit 금지 — `onSelect` 직접 호출 (2026-06-02)

- **결정**: `DropdownMenuItem` 안에 Server Action 을 붙일 때는 `<form action={...}>` 대신, `onSelect` 에서 `event.preventDefault()` 로 자동 닫힘을 막고 Server Action 을 직접 호출한다.
- **맥락**: 로그아웃 버튼이 `DropdownMenuItem asChild` 안에 `<form action={signOutAction}>` + submit 버튼을 두는 구조였다.
  클릭하면 `DropdownMenuItem` 의 `onSelect` 가 메뉴를 닫으며 Portal 을 unmount 한다.
  그 과정에서 form 이 DOM 에서 제거되어 native submit 이 발생하기 전에 유실됐다.
  로그인 시점과 무관하게 로그아웃이 항상 동작하지 않았다.
- **대안 기각**:
  - form 을 `DropdownMenu` 바깥으로 분리: 메뉴 항목 레이아웃을 깨고, 메뉴 닫힘 타이밍과 submit 순서를 다시 맞춰야 해 복잡도만 늘어난다.
  - `onSelect` 유지 + setTimeout 으로 submit 지연: 타이밍 의존이라 취약하다.
- **적용 범위**: `src/components/layout/Header.tsx`. 향후 메뉴 항목에서 Server Action 호출 시 동일 패턴 적용.

---

<a id="adr-f28"></a>

## ADR-F28: brand 색 Teal(h=188) → Toss Blue(h=257) 변경 (2026-06-02)

- **결정**: brand 토큰 `--color-brand-{50..900}` + tint/fg, 그리고 brand 에서 파생되는 shadow·`--primary`·`--ring`·`gradient-{primary,family,category}` 의 hue 를 188(Teal) 에서 257(Toss Blue) 로 변경한다.
  - semantic(income 152 / expense 25 / warning 78) 과 neutral(230) 은 불변.
  - 카테고리 home 톤(`--color-cat-home`)은 brand 와 독립한 카테고리 팔레트라 188(teal) 유지.
  - dark mode `--primary`/`--ring` 도 257 로 일관 적용.
- **맥락**: Teal 보다 시원하고 선명한 파랑(Toss `#3182F6` ≈ `oklch(0.624 0.196 257)`) 을 brand 로 선호.
  brand 토큰만 바꾸면 헤더·버튼·FAB 는 자동 반영되지만, 예산 카드 gradient 는 바뀌지 않았다.
  gradient 클래스·shadow·`--primary`·`--ring` 이 brand 토큰을 참조하지 않고 hue 를 직접 하드코딩하고 있어, 이들도 257 로 함께 바꿔야 전역 적용이 완성됐다.
- **트레이드오프**: gradient/shadow 가 `var(--color-brand-*)` 를 참조했다면 토큰 한 곳만 바꾸면 됐다.
  hue 하드코딩이라 `globals.css` 전반의 188→257 일괄 치환이 필요했다.
  향후 brand 재변경 비용을 줄이려면 gradient 정의를 brand 토큰 참조로 리팩토링하는 별도 작업이 바람직하다.
- **적용 범위**: `src/app/globals.css`. ADR-F13 의 OKLCH 체계는 불변 — 본 ADR 은 brand hue 값만 갱신.

<a id="adr-f29"></a>

## ADR-F29: Tailwind v4 markdown 스캔 위험 패턴 차단 — md-lint 게이트 + 안전 표기 (2026-06-02)

- **결정**: `tasks/`·`docs/`·`.claude/skills/` markdown 의 위험 arbitrary class 패턴(닫힌 `[...]` 안 와일드카드·중괄호)을 `scripts/check-tailwind-md.mjs` 로 검출하고 CI(`pnpm lint:md`)에서 차단한다.
  패턴 자체를 안전 표기(placeholder)로 쓰는 것을 작성 규율로 삼는다.
- **맥락**: Tailwind v4 자동 content 탐지가 `tasks/`·`docs/`·`.claude/skills/` 의 `.md` 까지 스캔했다.
  arbitrary value 안에 와일드카드·중괄호가 든 표기가 invalid CSS 로 파싱돼 dev 서버가 통째로 500 을 반환했다(2026-06-02 직접 발생 — 함정 코드 CODE-3).
- **`@source not` 미채택 이유 (2026-06 실측)**: `globals.css` 에 `@source not "../../tasks/**"` 를 넣어도 Turbopack(Next 16 dev)에서 markdown 스캔이 계속됐다.
  원천 차단이 안 되므로 1차 방어로 부적합 → `globals.css` 에 넣지 않는다.
  유일하게 확실한 해결은 위험 패턴을 안전 표기로 바꾸는 것이며, lint 게이트가 이를 기계로 강제한다.
- **`next build` 부적합 이유**: production build 는 invalid CSS 를 경고로 넘기고 통과(`Compiled successfully`)한다.
  dev 에서만 500 이 발생하므로 CI 에 `next build` 를 추가해도 이 버그를 잡지 못한다.
- **대안 기각**:
  - `@source not` 1차 방어: Turbopack 미작동(위 실측)으로 무효.
  - `next build` CI 게이트: 위 이유로 부적합.
- **모노레포 이관 뒤 (2026-09-29 실측)**: Tailwind 스캔 기준 디렉터리는 `frontend/` 다. `frontend/docs/` 의 `.md` 는 스캔되고 루트 `tasks/` 의 `.md` 는 스캔되지 않는다.
  그래서 검사 대상은 `frontend/` 아래 `docs/`, `.claude/skills/` 다. 루트 `tasks/` 계획서는 이 위험 밖에 있다.
- **적용 범위**: `scripts/check-tailwind-md.mjs`, `package.json`, `.github/workflows/frontend-ci.yml`.
  함정 코드: `common-pitfalls.md` CODE-3(`auto-gate: md-lint`).

<a id="adr-f30"></a>

## ADR-F30: 월 합계와 추이는 백엔드 집계 API 를 부른다 (2026-09-30)

- **status**: `accepted`
- **결정**: 일별 합계, 카테고리 월 분포와 전월 대비, 월별 추이는 백엔드의 `/dashboard/daily-stats`, `/dashboard/stats/category-breakdown`, `/dashboard/stats/monthly-trend` 로 받는다.
  지출과 수입 목록을 `size=1000` 으로 받아 프론트에서 더하지 않는다.
  [ADR-F16](#adr-f16) 을 대체한다.
- **맥락**: 2026-09-30 운영에서 사용자가 느리다고 보고했다.
  분석 화면을 한 번 열 때 1000건 목록 조회가 기간 `y1` 기준 15회 넘게 나갔다. 월별 추이가 달마다 한 번, 전월 대비가 두 번, 일별 합계가 두 번 불렀다.
  같은 시점에 백엔드는 위 세 집계 API 를 이미 제공하고 있었고 처리 시간은 평균 6~30ms 였다.
  ADR-F16 이 걱정한 "프론트 일정이 백엔드에 묶이는 문제" 는 API 가 이미 있어 더는 해당하지 않는다.
- **대안 기각**:
  - 목록 집계를 유지하고 React `cache()` 로 중복 제거: 같은 렌더 안의 중복만 없앤다. 월별 추이의 달마다 조회는 그대로 남는다.
  - 새 통합 API 한 개로 분석 화면 전체를 받기: 기존 API 로 충분하고 백엔드 변경이 필요하다.
- **결과**:
  - 얻는 것: 분석 화면의 백엔드 호출이 1000건 목록 기준 15회 넘게에서 1회로 줄어든다. 남는 1회는 지출 상위 5건 표시용이다.
  - 감당할 것: 합산 규칙을 백엔드가 소유한다. 삭제되지 않은(`ACTIVE`) 지출을 모두 더하고 예산 제외 표시는 보지 않는다. 월별 추이 응답은 지출이 없는 달을 빼고 오므로 프론트가 0 으로 채운다. 카테고리 비율과 전월 대비는 백엔드가 소수 둘째 자리까지 주고 프론트가 반올림한다.
- **적용 범위**: `services/dashboard/dashboard-service.ts`, `services/analytics/analytics-service.ts`. 지출 상위 5건용 목록 조회는 백엔드가 금액 정렬을 지원하기 전까지 남긴다.

<a id="adr-f31"></a>

## ADR-F31: 백엔드 호출 재시도는 GET 만 하고 타임아웃을 명시한다 (2026-09-30)

- **status**: `accepted`
- **결정**: `lib/server/api/client.ts` 의 ky 재시도 대상 메서드를 `get` 하나로 둔다. 요청 타임아웃은 5초로 명시한다.
- **맥락**: 이전 설정은 POST, PUT, DELETE 도 5xx 에서 최대 2회 재시도했다.
  백엔드가 지출을 저장한 뒤 응답 전에 502 나 504 를 돌려주면 같은 지출이 두 번 이상 등록된다. 등록 API 는 멱등키를 받지 않는다.
  타임아웃은 ky 기본값 10초였다. 한 호출이 재시도까지 최대 30초를 넘게 붙잡을 수 있었다.
- **대안 기각**:
  - 등록 API 에 멱등키 도입: 백엔드 저장 모델을 바꿔야 한다. 두 사람이 쓰는 서비스에서 실패한 등록은 사용자가 다시 누르면 된다.
  - 재시도를 모두 끄기: GET 은 멱등이라 일시적인 502 를 재시도로 넘기는 이득이 남는다.
- **결과**:
  - 얻는 것: 쓰기 요청의 자동 재시도로 인한 중복 반영을 막는다. 요청 한 번의 타임아웃을 5초로 줄인다. GET 은 재시도와 대기 때문에 전체 호출이 5초를 넘을 수 있다.
  - 감당할 것: 쓰기 요청의 일시 오류는 사용자에게 그대로 토스트로 보인다. 5초를 넘는 정상 요청이 생기면 그 호출만 옵션으로 늘린다.
- **적용 범위**: `src/lib/server/api/client.ts`.
<a id="adr-f32"></a>

## ADR-F32: 달력을 첫 화면으로 두고 한 달 목록을 한 번에 받는다 (2026-09-30)

- **status**: `accepted`
- **결정**: 로그인 뒤 첫 화면을 `/calendar` 로 한다. 달을 열 때 일별 합계(`daily-stats`), 그 달 지출과 수입 목록, 구성원 목록을 서버에서 한 번에 받는다.
  날짜를 누르면 받아 둔 목록에서 그날 항목을 골라 보여 주고 서버를 다시 부르지 않는다. 합계는 `daily-stats` 가 주는 값을 쓴다([ADR-F30](#adr-f30) 과 같은 규칙).
  거래 추가에서 지출, 수입, 고정지출을 전환해도 선택한 날짜를 유지한다.
  고정지출을 거쳐 돌아올 때도 같은 날짜를 사용하며 이 결정이 [ADR-F21](#adr-f21)의 날짜 초기화 정책을 대체한다.
  통계, 분석과 예산의 현재 연월과 예산의 남은 일수는 세션 시간대로 계산하며 시간대가 없거나 잘못되면 서울을 사용한다.
  명시한 조회 연월과 기존 집계 방식은 유지한다.
- **맥락**: 두 사람이 휴대폰으로 가계부를 쓰며, 서로 무엇을 썼는지 날짜별로 빠르게 비교하는 것이 가장 잦은 동작이다(2026-09-30 사용자 요청).
  기존 첫 화면인 대시보드는 넓은 요약 카드 중심이라 휴대폰에서 이 비교가 어려웠다.
  운영은 한국 휴대폰에서 서버까지 왕복이 0.2초 안팎이라, 날짜를 누를 때마다 서버를 부르면 누를 때마다 기다리게 된다.
  한 가구의 월 거래는 100~300건이라 한 달 목록 응답은 수십 KB 다.
- **대안 기각**:
  - 날짜를 누를 때마다 그날 목록 조회: 응답은 작지만 누를 때마다 왕복을 기다린다. 비교하려고 날짜를 여러 번 오가는 사용 방식과 맞지 않는다.
  - 날짜 목록을 하단 시트로 띄우기: 달력 칸을 크게 쓸 수 있지만, 다른 날짜를 보려면 시트를 닫고 다시 눌러야 한다. 사용자가 달력 아래 목록을 골랐다.
  - 대시보드를 첫 화면으로 두고 달력을 탭으로 추가: 탭이 하나 늘고, 가장 잦은 동작이 두 번째 탭에 있게 된다.
- **결과**:
  - 얻는 것: 날짜를 바꿀 때 기다림이 없다. 달을 바꿀 때만 서버를 부른다.
  - 감당할 것: 한 달 거래가 1000건을 넘으면 목록이 잘린다. 그 전에 페이지를 나눠 받거나 날짜별 조회로 바꾼다. 등록, 수정, 삭제 뒤에는 그 달 전체를 다시 받는다.
- **적용 범위**: `src/app/(authenticated)/calendar/`, `src/components/calendar/`, `src/actions/calendar/`, `src/services/calendar/`. 대시보드 화면(`/dashboard`)은 없애고 `/analytics` 로 보낸다.

<a id="adr-f33"></a>

## ADR-F33: 메뉴는 하단 탭의 「전체」 에 모은다 (2026-09-30)

- **status**: `accepted`
- **결정**: 하단 탭을 달력, 내역, 추가 버튼, 분석, 전체로 둔다. 카테고리, 예산, 고정지출, 가족, 알림, 설정은 「전체」(`/menu`) 한 화면에 목록으로 모은다.
  하위 화면은 Header 에 뒤로 가기 버튼을 둔다.
- **맥락**: 카테고리 화면은 대시보드의 빠른 메뉴에서만, 예산 화면은 어디에서도 들어갈 수 없었다(2026-09-30 점검). 사용자가 카테고리를 찾기 어렵다고 했다.
  홈 화면에 추가해 앱처럼 쓰면 브라우저 뒤로 가기가 없어 하위 화면에서 빠져나올 방법이 없었다.
- **대안 기각**:
  - 햄버거 메뉴(왼쪽 위 아이콘을 누르면 열리는 서랍): 한 손으로 쥐었을 때 엄지가 닿지 않고, 메뉴가 아이콘 뒤에 숨어 있어 있는지부터 알기 어렵다.
  - 하단 탭에 카테고리를 직접 추가: 탭이 여섯이 되어 360px 폭에서 라벨이 좁아진다. 예산과 알림은 여전히 갈 곳이 없다.
- **결과**:
  - 얻는 것: 모든 화면이 하단 탭에서 두 번 안에 닿는다. 국내 금융 앱과 같은 구성이라 익숙하다.
  - 감당할 것: 새 화면을 만들면 `/menu` 목록에 넣어야 한다. 넣지 않으면 다시 들어갈 곳이 없는 화면이 생긴다.
- **적용 범위**: `src/components/layout/BottomNavigation.tsx`, `src/components/layout/Header.tsx`, `src/app/(authenticated)/menu/`.
