# ADR-F36: 랜딩만 검색에 노출하고 링크 미리보기와 아이콘은 코드로 만든다 (2026-10-01)

- **status**: `accepted`
- **결정**: 서비스 이름은 「우리집 가계부」 로 통일한다. 검색 엔진에는 랜딩(`/`)과 로그인 화면만 노출하고, 로그인 뒤 화면과 초대 링크는 `noindex` 로 막는다. `robots.txt` 와 `sitemap.xml` 을 둔다.
  링크 미리보기(Open Graph, Twitter 카드), 파비콘, apple-touch-icon 은 Next 의 파일 규약(`opengraph-image`, `icon`, `apple-icon`)으로 코드에서 그린다. 홈 화면 추가용 `manifest` 를 두되 service worker 는 두지 않는다.
- **맥락**: 친구에게 주소를 보냈더니 미리보기 이미지가 없고, 탭에 저장소 이름(fos-accountbook)이 보이고, 파비콘이 Next 기본 아이콘이었다(2026-10-01). `robots.txt` 가 404 였다. 로그인 뒤 화면은 개인 가계부라 검색에 나올 이유가 없다.
- **대안 기각**:
  - 디자인한 PNG 를 `public/` 에 두기: 이미지가 준비될 때까지 기다려야 하고, 이름이나 색을 바꿀 때마다 다시 만들어야 한다. 코드로 그리면 브랜드 색과 문구를 한곳에서 바꾼다. 나중에 이미지로 바꾸는 것은 파일 하나를 바꾸면 된다.
  - 전부 `noindex`: 친구가 서비스 이름으로 검색해도 찾지 못한다. 랜딩은 공개해도 개인 정보가 없다.
  - service worker 로 오프라인 지원까지 넣기: 캐시 무효화를 관리해야 하고 이번 목적(미리보기와 홈 화면 아이콘)에 필요하지 않다.
- **결과**:
  - 얻는 것: 메신저 미리보기에 이름, 소개, 이미지가 나온다. 홈 화면 아이콘과 이름이 앱처럼 보인다. 개인 화면이 검색에 노출되지 않는다.
  - 감당할 것: 미리보기 이미지를 그리는 라이브러리(satori)는 woff2 와 oklch 를 읽지 못한다. 이미지에는 otf 글꼴과 hex 색을 쓰고, manifest 와 브라우저 테마 색에도 같은 hex 값을 쓴다. 이것은 ADR-F13 의 예외다. 색은 brand 토큰과 손으로 맞춘다. 새 공개 화면을 만들면 sitemap 과 robots 를 함께 고친다.
  - 배포 주소는 요청 시점의 `AUTH_URL` 을 사용한다. Docker 빌드에 서버 환경 변수를 넣지 않으므로 메타데이터와 검색 엔진용 주소를 빌드 시점에 고정하지 않는다. 오류 화면과 로그아웃 화면도 색인을 허용하지 않는다.
- **적용 범위**: `src/app/layout.tsx`, `src/app/page.tsx`, `src/app/(authenticated)/layout.tsx`, `src/app/auth/error/page.tsx`, `src/app/auth/signout/page.tsx`, `src/app/` 의 `opengraph-image`, `icon`, `apple-icon`, `robots`, `sitemap`, `manifest` 파일.
