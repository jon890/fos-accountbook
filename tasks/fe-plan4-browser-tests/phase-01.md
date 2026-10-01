# Phase 01. Playwright 브라우저 테스트 기반과 첫 화면 검사

**Execution profile**: standard
**Domain**: app-router

## 목표

로그인 뒤 화면을 실제 브라우저에서 모바일(390×844)과 데스크톱(1280×900) 폭으로 열어,
위치와 계산된 스타일을 숫자로 단언하는 테스트 기반을 만든다.
jsdom 은 레이아웃을 계산하지 않아 Jest 로는 폭별 여백을 확인할 수 없다.

**범위 외**: CI job 은 phase 02 가 만든다. 화면 여백을 고치는 일은 이 plan 밖이다.

## 컨텍스트

모든 경로는 저장소 root 기준이다. 명령은 `frontend/` 에서 돌린다.

**근거 문서**: `frontend/docs/adr/ADR-F34-browser-tests-fake-backend.md`, `frontend/docs/testing-strategy.md` 의 「6. 브라우저 테스트」 절.
둘 다 이미 커밋돼 있다. 구조와 이름은 그 문서와 맞춘다.

참고 구현: 같은 사용자의 다른 저장소 `/Users/nhn/personal/fos-assistant/test/browser/` 가 같은 방식이다.
`playwright.config.ts`, `web-server.ts`, `fixtures.ts` 를 읽고 구조를 따른다. 그 저장소의 파일은 고치지 않는다.

### 인증이 동작하는 방식 (코드에서 확인한 사실)

- `frontend/src/lib/server/auth/config.ts`: NextAuth v5, `session.strategy: "jwt"`. `session` 콜백이 `token.userUuid` 와 `token.profile` 을 세션에 옮긴다.
- `frontend/src/types/next-auth.d.ts` 의 `JWT` 칸: `userUuid`, `backendAccessToken`, `backendRefreshToken`, `backendTokenExpiredAt`, `backendTokenIssuedAt`, `profile`.
- `frontend/src/types/auth/user-profile.ts` 의 `UserProfile`: `timezone`, `language`, `currency`, `defaultFamilyUuid`.
- `getSelectedFamilyUuid()`(`frontend/src/lib/server/auth/auth-helpers.ts`)는 `session.user.profile.defaultFamilyUuid` 를 돌려준다.
- `frontend/src/lib/server/auth/refresh-token.ts`: `backendTokenExpiredAt` 5분 전부터 refresh 를 시도한다. 테스트 세션은 만료를 먼 미래(예: 2099-01-01)로 둬 refresh 가 일어나지 않게 한다.
- 백엔드 호출은 `frontend/src/lib/server/api/client.ts` 가 `backend_access_token` 쿠키를 꺼내 `Authorization: Bearer` 로 보낸다. 이 쿠키도 테스트가 넣는다.
- `serverApiGet` 은 응답을 `{ success: true, data: T }` 봉투로 읽고 `data` 를 돌려준다. 가짜 백엔드는 이 봉투로 응답한다.
- http 에서 NextAuth 세션 쿠키 이름은 `authjs.session-token` 이다. `next-auth/jwt` 의 `encode({ salt: "authjs.session-token", secret: AUTH_SECRET, token })` 로 만든다.

### 서버 환경 변수

`frontend/src/lib/env/schemas/server.env.schema.ts` 가 환경 스키마를 정의하고,
`frontend/src/lib/env/server.env.ts` 가 시작할 때 검사한다:
`AUTH_URL`, `AUTH_SECRET`(32자 이상), `AUTH_GOOGLE_ID`, `AUTH_GOOGLE_SECRET`, `AUTH_NAVER_ID`, `AUTH_NAVER_SECRET`, `BACKEND_API_URL`.
빌드 때는 `SKIP_ENV_VALIDATION=true` 로 검사를 건너뛴다(`frontend/Dockerfile` 과 같다). 실행할 때는 `AUTH_TRUST_HOST=true` 도 준다.
`BACKEND_API_URL` 은 `/api/v1` 까지 담는다(예: `http://127.0.0.1:3101/api/v1`).

`frontend/next.config.ts` 는 `output: "standalone"` 이다. 빌드 뒤 `.next/standalone/server.js` 를 띄우고,
`frontend/Dockerfile` 처럼 `.next/static` 과 `public` 을 standalone 아래로 복사해야 정적 파일이 나간다.

### 첫 검사 화면이 부르는 백엔드 경로

| 화면 | 경로 (모두 `/api/v1` 아래) | 응답 `data` 타입 |
| --- | --- | --- |
| 공통 Header | `GET /families` | `Family[]` (`frontend/src/types/family.ts`) |
| 공통 알림 벨 | `GET /families/{familyUuid}/notifications/unread-count` | `UnreadCountResponse` (`frontend/src/types/actions/notification.ts`) |
| `/categories` | `GET /families/{familyUuid}/categories` | `CategoryResponse[]` (`frontend/src/types/category.ts`) |
| `/notifications` | `GET /families/{familyUuid}/notifications` | `NotificationListResponse` (같은 notification 타입 파일) |

인증 레이아웃 `frontend/src/app/(authenticated)/layout.tsx` 의 `main` 은 `px-3 sm:px-6 lg:px-8` 이다.
그래서 계산된 `padding-left` 는 390px 에서 12px, 1280px 에서 32px 다. 이 값으로 폭별 단언이 동작하는지 확인한다.

## 의도 메모

- 스크린샷 비교를 쓰지 않는다. 글꼴과 운영체제에 따라 픽셀이 달라진다(ADR-F34).
- `page.route` 로 백엔드 응답을 바꾸지 않는다. Server Action 은 Next 서버에서 백엔드를 불러 브라우저 요청에 잡히지 않는다.
- 가짜 백엔드가 모르는 경로를 받으면 404 를 주고 기록한다. 각 테스트 끝에 기록이 비었는지 단언한다. 화면이 새 API 를 부르기 시작한 것을 놓치지 않기 위해서다.
- Jest 의 기본 testMatch 는 `*.spec.ts` 를 모두 집는다. `browser/` 를 Jest 대상에서 빼지 않으면 `pnpm test` 가 Playwright 파일을 읽다 실패한다.
- 빌드한 서버를 기본으로 띄운다. 개발 서버와 운영 빌드는 동작이 다를 수 있다. `BROWSER_WEB_SERVER=dev` 면 개발 서버를 띄워 반복 수정할 때 빌드를 기다리지 않게 한다.

## 작업 항목

### 1. 의존성과 실행 명령 (`frontend/package.json`, `frontend/jest.config.js`)

- devDependencies 에 `@playwright/test` 를 더한다(`pnpm add -D @playwright/test`). `frontend/pnpm-lock.yaml` 이 함께 바뀐다.
- scripts 에 `"test:browser": "playwright test --config browser/playwright.config.ts"` 를 더한다.
- `frontend/jest.config.js` 의 `testPathIgnorePatterns` 에 `"<rootDir>/browser/"` 를 더한다.
- `frontend/.gitignore` 에 Playwright 결과 디렉터리(`/test-results`, `/playwright-report`, `/blob-report`)를 더한다. 이미 있으면 그대로 둔다.

### 2. 설정과 웹 서버 (`frontend/browser/settings.ts`, `frontend/browser/playwright.config.ts`, `frontend/browser/web-server.mjs`)

- `settings.ts`: 웹 포트(기본 3100), 가짜 백엔드 포트(기본 3101), 테스트용 `AUTH_SECRET`(32자 이상 고정 문자열), 고정 `FAMILY_UUID` 와 `USER_UUID` 를 export 한다. 포트는 `BROWSER_WEB_PORT`, `BROWSER_BACKEND_PORT` 로 바꿀 수 있게 한다.
- `playwright.config.ts`: `testDir: "."`, `testMatch: "*.spec.ts"`, `workers: 1`, `fullyParallel: false`, `trace: "retain-on-failure"`.
  project 는 `mobile`(390×844)과 `desktop`(1280×900) 둘이고, 둘 다 chromium 이다.
  `outputDir`은 설정 파일 위치에서 `../test-results`를 해석한 절대 경로로 설정한다.
  따라서 결과는 저장소 root 기준 `frontend/test-results`에 생긴다.
  `webServer` 는 배열로 두 개를 띄운다: 가짜 백엔드(`node browser/fake-backend.mjs` 같은 실행)와 웹 서버(`web-server.mjs`).
  웹 서버 env 에 위 「서버 환경 변수」 를 모두 준다. OAuth 값은 임의 문자열이다.
- `web-server.mjs`: `BROWSER_WEB_SERVER` 가 `dev` 면 `pnpm dev --hostname 127.0.0.1 --port <port>` 를 띄운다.
  아니면 `SKIP_ENV_VALIDATION=true` 로 `pnpm build` 를 하고, `.next/static` 과 `public` 을 `.next/standalone` 아래로 복사한 뒤 `node .next/standalone/server.js` 를 `PORT`, `HOSTNAME=127.0.0.1` 로 띄운다.
- TypeScript 파일을 node 로 바로 실행할 수 있는지 확인한다(Node 22 의 type stripping, 또는 Playwright 가 config 를 읽는 방식). 실행할 수 없으면 `.mjs` 로 쓴다.

### 3. 가짜 백엔드 (`frontend/browser/fake-backend.mjs`)

- `node:http` 로 띄우는 서버다. 새 의존성을 더하지 않는다.
- 위 「첫 검사 화면이 부르는 백엔드 경로」 표의 네 경로에 `{ success: true, data }` 로 응답한다. 응답 값은 각 타입의 필수 칸을 모두 채운다.
  카테고리는 3개 이상, 알림은 읽음과 읽지 않음을 섞어 2개 이상 둔다.
- 테스트 제어 경로를 둔다: `POST /__test/reset` 은 미처리 기록을 비우고, `GET /__test/unhandled` 는 미처리 요청의 `method path` 목록을 돌려준다.
- 모르는 경로는 404 와 `{ success: false, message }` 로 응답하고 미처리 기록에 더한다.

### 4. 세션 fixture (`frontend/browser/fixtures.ts`)

- `@playwright/test` 의 `test.extend` 로 `test` 와 `expect` 를 export 한다.
- 각 테스트 전: 가짜 백엔드의 `/__test/reset` 을 부르고, `authjs.session-token` 쿠키와 `backend_access_token` 쿠키를 context 에 넣는다.
  세션 토큰에는 `sub`, `userUuid`, `profile`(`defaultFamilyUuid` 는 `FAMILY_UUID`, `timezone: "Asia/Seoul"`, `language: "ko"`, `currency: "KRW"`), `backendAccessToken`, `backendRefreshToken`, `backendTokenExpiredAt: "2099-01-01T00:00:00Z"`, `backendTokenIssuedAt` 를 넣는다.
- 각 테스트 뒤: `/__test/unhandled` 가 빈 배열인지 단언한다. 실패 메시지에 미처리 경로를 담는다.

### 5. 첫 화면 검사 (`frontend/browser/categories.spec.ts`, `frontend/browser/notifications.spec.ts`)

- `categories.spec.ts`
  - 정상: `/categories` 를 열면 가짜 백엔드의 카테고리 이름이 모두 보인다.
  - 폭별 단언: `main` 의 계산된 `padding-left` 가 `mobile` 에서 `12px`, `desktop` 에서 `32px` 다. `testInfo.project.name` 으로 기대값을 나눈다.
- `notifications.spec.ts`
  - 정상: `/notifications` 를 열면 알림 제목이 보인다.
  - 실패 경로: 세션 쿠키 없이 `/notifications` 를 열면 로그인 화면이나 `/` 로 이동한다. 이 테스트는 쿠키를 넣지 않는 별도 context 를 쓴다.

## 검증

`frontend/` 에서 실행한다.

```bash
pnpm install
pnpm exec playwright install chromium
pnpm lint
pnpm exec tsc --noEmit
pnpm test
pnpm test:browser browser/categories.spec.ts browser/notifications.spec.ts
pnpm test:browser
```

기대값:

- `pnpm test` 는 기존 Jest 테스트만 돌고 통과한다. 출력에 `browser/` 의 파일이 없다.
- `pnpm test:browser` 는 4개 테스트를 `mobile` 과 `desktop` 에서 돌려 8건 모두 통과한다.
- `main` 의 `padding-left` 단언을 일부러 `13px` 로 바꾸면 `mobile` 에서 실패한다. 확인한 뒤 되돌린다.

### 가짜 백엔드와 fixture의 실패 검증

화면 spec 4개와 두 project의 8건은 유지한다. 다음 검증은 일회성 실행으로 하고,
임시 코드가 필요하면 `mktemp -d`로 `/tmp` 아래에 만들고 종료 시 제거한다.

1. 가짜 백엔드를 별도 포트로 띄우고 `POST /__test/reset`이 성공하는지 확인한다.
2. `GET /api/v1/unsupported`의 상태가 404이고 `success`가 false인지 단언한다.
3. `GET /__test/unhandled`가 `["GET /api/v1/unsupported"]`인지 단언한다.
4. 다시 reset한 뒤 unhandled가 빈 배열인지 단언한다. 하나라도 다르면 종료 코드 1로 끝낸다.
5. 화면 테스트 중 한 테스트에 미지원 API 요청을 잠깐 넣는다.
   fixture 종료 단언 때문에 테스트 명령이 실패하고, 실패 메시지에 해당 경로가 나오는지 확인한다.
   요청을 제거한 뒤 같은 테스트 명령이 통과하는지 확인한다.

가짜 백엔드 검증 프로세스는 성공과 실패 모두에서 종료한다.

## 변경 파일

| 파일 | 변경 |
|---|---|
| `frontend/package.json` | 수정 |
| `frontend/pnpm-lock.yaml` | 수정 |
| `frontend/jest.config.js` | 수정 |
| `frontend/.gitignore` | 수정 |
| `frontend/browser/settings.ts` | 신규 |
| `frontend/browser/playwright.config.ts` | 신규 |
| `frontend/browser/web-server.mjs` | 신규 |
| `frontend/browser/fake-backend.mjs` | 신규 |
| `frontend/browser/fixtures.ts` | 신규 |
| `frontend/browser/categories.spec.ts` | 신규 |
| `frontend/browser/notifications.spec.ts` | 신규 |
