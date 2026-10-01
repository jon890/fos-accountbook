# Phase 01. 메타데이터, 검색 노출 범위, robots, sitemap, manifest

**Execution profile**: standard
**Domain**: app-router

## 목표

탭 제목과 링크 미리보기 문구가 「우리집 가계부」 로 일정하게 나오고, 검색 엔진은 랜딩과 로그인 화면만 수집한다. 홈 화면에 추가할 manifest 가 생긴다.

**범위 외**: 미리보기 이미지와 아이콘 파일은 phase 02 다.

## 컨텍스트

모든 경로는 저장소 root 기준이다. 명령은 `frontend/` 에서 돌린다.

**근거 문서**: `frontend/docs/adr/ADR-F36-seo-and-link-preview.md`, 브라우저 테스트는 `frontend/docs/testing-strategy.md` 의 「6. 브라우저 테스트」 절.

코드에서 확인한 사실:

- `frontend/src/app/layout.tsx`: `metadata = { title: "우리집 가계부", description: "가족을 위한 스마트 가계부 앱" }`, `viewport` 에 `viewportFit: "cover"` 등. `metadataBase` 가 없다.
- `frontend/src/app/page.tsx`: 랜딩. 세션이 있으면 `/calendar` 나 `/families/create` 로 redirect 하고, 없으면 랜딩을 그린다. `metadata` 의 title 이 `fos-accountbook — 가족과 함께 쓰는 가계부`, `openGraph` 는 title 과 description 만 있다.
- 로그인 뒤 화면은 `frontend/src/app/(authenticated)/layout.tsx` 아래에 있다. 초대 화면 `frontend/src/app/(authenticated)/invite/[token]/` 도 그 아래다. 로그인 화면은 `frontend/src/app/auth/signin/`.
- 운영 주소는 `https://accountbook.fosworld.co.kr` 다. 서버 환경 변수 `AUTH_URL`(`frontend/src/lib/env/schemas/server.env.schema.ts`)이 같은 값이다.
- 브랜드 색: `frontend/src/app/globals.css` 의 `--color-brand-500: oklch(0.640 0.190 257)`. manifest 와 viewport 의 `themeColor` 는 hex 가 필요하다. 이 oklch 를 hex 로 바꾼 값을 쓴다(ADR-F36 의 예외).
- 브라우저 테스트: `frontend/browser/` 의 Playwright, 가짜 백엔드, 세션 fixture. 세션 쿠키를 넣지 않는 context 로 `/` 를 열면 랜딩이 그려진다(`notifications.spec.ts` 의 세션 없는 테스트 참고).

## 의도 메모

- root `generateMetadata` 는 `await connection()` 뒤 `AUTH_URL` 에서 `metadataBase` 를 만든다. Docker 빌드에는 `AUTH_URL` 이 없으므로 모듈 상단에서 URL을 만들지 않는다. `robots` 와 `sitemap` 은 `dynamic = "force-dynamic"` 으로 요청 시 주소를 읽는다.
- root에 Open Graph 공통값을 모두 두고, 랜딩에서는 `openGraph` 를 재정의하지 않아 중첩 객체 대체로 공통값이 사라지지 않게 한다.
- title 은 `template: "%s | 우리집 가계부"`, `default: "우리집 가계부"`. 랜딩은 `absolute` 로 「우리집 가계부 — 가족과 함께 쓰는 가계부」 처럼 둔다.
- `(authenticated)` 레이아웃에 `robots: { index: false, follow: false }` 를 둔다. 하위 화면은 이를 이어받는다.
- `/auth/error`, `/auth/signout` 에도 같은 `robots` 를 둔다. `/auth/signin` 만 공개 색인을 허용한다.
- sitemap 에는 `/` 와 `/auth/signin` 만 넣는다.
- manifest: `name`, `short_name`(「우리집 가계부」), `start_url: "/calendar"`, `display: "standalone"`, `background_color`, `theme_color`, `icons` 는 phase 02 가 만들 `/icon` 과 `/apple-icon` 경로를 가리킨다.
- `/icon` 은 512×512 PNG, `/apple-icon` 은 180×180 PNG다. manifest의 크기와 경로를 동일하게 선언한다. 색은 brand-500의 sRGB 변환값을 사용한다.

## 작업 항목

### 1. `frontend/src/app/layout.tsx` 와 `frontend/src/app/page.tsx` 의 메타데이터

- `metadataBase`, title template, description, `openGraph`(`siteName`, `locale: "ko_KR"`, `type: "website"`, `url: "/"`), `twitter.card: "summary_large_image"`, `applicationName`.
- `viewport.themeColor` 를 brand 색 hex 로.
- 랜딩 title 과 openGraph 문구에서 `fos-accountbook` 을 뺀다.

### 2. 인증 레이아웃과 `/auth/error`, `/auth/signout` 에 `noindex`

### 3. `frontend/src/app/robots.ts`, `frontend/src/app/sitemap.ts`, `frontend/src/app/manifest.ts`

- robots: 모두 허용하되 로그인 뒤 경로(`/calendar`, `/transactions`, `/analytics`, `/budget`, `/categories`, `/notifications`, `/settings`, `/menu`, `/families`, `/invite`, `/api`)는 disallow, `sitemap` 주소 포함.
- `/dashboard`, `/expenses`, `/auth/error`, `/auth/signout` 도 disallow 한다.

### 4. 이 phase 를 검증하는 브라우저 테스트 `frontend/browser/seo.spec.ts`

- 세션 없는 context 로 `/` 를 열면 `<title>` 에 「우리집 가계부」 가 있고 `fos-accountbook` 이 없다. `og:site_name`, `og:locale`, `og:url` 메타가 있다.
- 세션이 있는 기본 fixture 로 `/categories` 를 열면 `meta[name="robots"]` 에 `noindex` 가 있다.
- `GET /robots.txt` 가 200 이고 `Disallow: /calendar` 와 `Sitemap:` 줄이 있다. `GET /sitemap.xml` 이 200 이다. `GET /manifest.webmanifest` 가 200 이고 `start_url` 이 `/calendar` 다.
- 가짜 백엔드가 모르는 경로를 받으면 fixture 가 실패시킨다. 이 spec 이 새 백엔드 경로를 부르면 `frontend/browser/fake-backend.mjs` 에 응답을 더한다.
- sitemap의 URL 집합은 현재 테스트 origin의 `/` 와 `/auth/signin` 정확히 둘인지 단언한다. robots는 모든 비공개 경로와 현재 origin의 sitemap URL을 단언한다. 로그인 화면은 noindex가 없고 오류/로그아웃 화면과 초대 화면은 noindex인지 확인한다.
- manifest의 이름, 표시 모드, 색 형식, 두 아이콘의 경로·PNG 타입·크기를 단언한다. 운영과 같은 `AUTH_URL` 없는 빌드가 성공하고, 런타임 테스트 origin을 메타데이터/robots/sitemap에 쓰는지 검증한다.

## 검증

`frontend/` 에서 실행한다.

```bash
pnpm install --frozen-lockfile
pnpm exec playwright install chromium
pnpm tsc --noEmit && pnpm lint && pnpm lint:md && pnpm test
pnpm test:browser browser/seo.spec.ts
```

기대값: 모든 명령이 성공한다.

## 변경 파일

| 파일 | 변경 |
|---|---|
| `frontend/src/app/layout.tsx` | 수정 |
| `frontend/src/app/page.tsx` | 수정 |
| `frontend/src/app/(authenticated)/layout.tsx` | 수정 |
| `frontend/src/app/auth/error/page.tsx` | 수정 |
| `frontend/src/app/auth/signout/page.tsx` | 수정 |
| `frontend/browser/web-server.mjs` | 수정 |
| `frontend/src/app/robots.ts` | 신규 |
| `frontend/src/app/sitemap.ts` | 신규 |
| `frontend/src/app/manifest.ts` | 신규 |
| `frontend/browser/seo.spec.ts` | 신규 |
| `frontend/browser/fake-backend.mjs` | 수정 |
