# Phase 02. 링크 미리보기 이미지와 아이콘을 코드로 그린다

**Execution profile**: standard
**Domain**: app-router

## 목표

메신저에 주소를 보내면 「우리집 가계부」 이름과 소개가 담긴 미리보기 이미지가 뜨고, 탭과 홈 화면에 전용 아이콘이 나온다.

**범위 외**: 메타데이터 문구, robots, manifest 는 phase 01 이 끝냈다.

## 컨텍스트

모든 경로는 저장소 root 기준이다. 명령은 `frontend/` 에서 돌린다.

**근거 문서**: `frontend/docs/adr/ADR-F36-seo-and-link-preview.md`.

- Next 16 파일 규약: `src/app/opengraph-image.tsx`(1200×630), `src/app/icon.tsx`(예: 32×32 또는 512×512), `src/app/apple-icon.tsx`(180×180). 모두 `next/og` 의 `ImageResponse` 로 그린다. `next/og` 는 Next 에 들어 있어 새 의존성이 필요 없다.
- 지금 `frontend/src/app/favicon.ico` 는 Next 기본 아이콘이다. 파일 규약 `icon` 과 함께 두면 둘 다 나가므로 지운다.
- 글꼴: `ImageResponse`(satori)는 woff2 를 읽지 못한다. `frontend/node_modules/pretendard/dist/public/static/Pretendard-Bold.otf` 같은 otf 를 `fs` 로 읽어 넘긴다. 운영은 `output: "standalone"` 빌드라 `node_modules` 파일이 standalone 결과에 들어가는지 확인해야 한다. 들어가지 않으면 `next.config.ts` 의 `outputFileTracingIncludes` 로 그 파일을 포함하거나, 글자 수가 적으므로 필요한 글리프만 담긴 글꼴 파일을 저장소에 둔다. 브라우저 테스트는 standalone 빌드로 돌므로 이 문제를 잡는다.
- 색: satori 는 oklch 를 읽지 못한다. `frontend/src/app/globals.css` 의 brand 토큰(`--color-brand-500: oklch(0.640 0.190 257)` 등)을 hex 로 바꾼 값을 그 파일 상단 상수로 두고 출처 토큰 이름을 주석으로 단다(ADR-F36 의 ADR-F13 예외).
- `src/proxy.ts` 의 matcher 는 이미지 확장자만 뺀다. `opengraph-image` 와 `icon` 경로가 인증 없이 열리는지 확인한다.

## 의도 메모

- 디자인: brand 색 배경, 흰 글자로 「우리집 가계부」 와 한 줄 소개 「가족이 함께 쓰는 가계부」. 아이콘은 같은 배경에 「가」 한 글자를 둔다. icon은 512×512, apple-icon은 180×180 PNG로 만든다.
- Pretendard-Bold.otf를 fs로 읽고, `next.config.ts`의 `outputFileTracingIncludes`에 세 이미지 경로용 글꼴 파일을 명시한다. 별도 글꼴 파일과 의존성은 추가하지 않는다.
- `opengraph-image` 에 `alt` export 를 둔다.

## 작업 항목

### 1. `frontend/src/app/opengraph-image.tsx`

### 2. `frontend/src/app/icon.tsx` 와 `frontend/src/app/apple-icon.tsx`, `frontend/src/app/favicon.ico` 삭제

### 3. `frontend/next.config.ts` 에 글꼴 tracing을 추가해 standalone 빌드에 포함하기

### 4. 이 phase 를 검증하는 브라우저 테스트

- `frontend/browser/seo.spec.ts` 에 더한다.
  - 세션 없는 context 로 `/` 의 `meta[property="og:image"]` 주소를 읽어 GET 하면 200, `content-type` 이 `image/png`, 응답 크기가 0 보다 크다.
  - `/icon` 과 `/apple-icon` 경로(실제 경로는 `link[rel="icon"]`, `link[rel="apple-touch-icon"]` 의 href 로 읽는다)가 200 과 `image/png` 다.
  - PNG IHDR로 OG 1200×630, icon 512×512, apple-icon 180×180을 확인하고, `og:image:alt`와 icon link sizes를 단언한다. manifest의 두 경로로도 직접 GET해 연결이 유효함을 확인한다.

## 검증

`frontend/` 에서 실행한다.

```bash
pnpm install --frozen-lockfile
pnpm exec playwright install chromium
pnpm tsc --noEmit && pnpm lint && pnpm lint:md && pnpm test
pnpm test:browser browser/seo.spec.ts
pnpm test:browser
```

기대값: 모든 명령이 성공한다. 브라우저 테스트는 standalone 빌드 서버로 돈다.

## 변경 파일

| 파일 | 변경 |
|---|---|
| `frontend/src/app/opengraph-image.tsx` | 신규 |
| `frontend/src/app/icon.tsx` | 신규 |
| `frontend/src/app/apple-icon.tsx` | 신규 |
| `frontend/src/app/favicon.ico` | 삭제 |
| `frontend/next.config.ts` | 수정 |
| `frontend/browser/seo.spec.ts` | 수정 |
