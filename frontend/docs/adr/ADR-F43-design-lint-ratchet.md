# ADR-F43: 디자인 lint 는 `@shadcn/lint` 로 하고, 위반이 0건이 된 규칙부터 켠다 (2026-10-07)

- **status**: `accepted`
- **결정**: 디자인 시스템을 벗어난 className 을 `@shadcn/lint`(ESLint 플러그인)로 검사한다. 규칙은 `pnpm lint` 안에 둔다.
  위반이 0건이 된 규칙만 `error` 로 켠다. 켠 규칙은 다시 끄거나 `warn` 으로 낮추지 않는다. 남은 규칙은 꺼 둔 채 작은 PR 로 하나씩 정리한다.
  예외는 `eslint.config.mjs` 의 파일 단위 설정에 이유 주석과 함께 둔다. 코드 안의 `eslint-disable` 주석으로 예외를 만들지 않는다.
  0.x 패키지라 버전을 정확히 고정한다(`^` 없이). 버전을 올리는 Dependabot PR 은 리뷰로 새 위반 여부를 본다.
- **맥락**: 디자인 규칙(ADR-F07, F13, F15, F23)이 문서로만 있어, 사람과 에이전트가 쓴 화면이 조금씩 어긋나도 잡을 수단이 없었다.
  2026-10-07 에 6개 규칙을 모두 켜고 측정하니 위반이 약 1,000건이었다.

  | 규칙 | 건수 | 성격 |
  | --- | --- | --- |
  | `no-restyle` | 559 | 컴포넌트에 className 으로 모양을 덮어씀. Button 137, Card 계열 192 |
  | `no-arbitrary-values` | 271 | `w-[172px]` 같은 임의 값. 대부분 같은 값의 눈금 클래스가 있다 |
  | `no-unknown-classes` | 100 | Tailwind 가 CSS 를 만들지 않는 클래스 |
  | `no-inline-styles` | 59 | 30건은 OG 이미지와 아이콘 파일이다 |
  | `require-static-classes` | 6 | 변수로 조립해 검사할 수 없는 className |
  | `no-raw-colors` | 4 | 모두 Google 로고의 브랜드 색 |

  측정에서 실제 버그 두 개가 드러났다. `tw-animate-css` 를 설치하고도 `globals.css` 에서 가져오지 않아 다이얼로그와 시트의 `animate-in`, `fade-in-0` 류 클래스 약 80곳에 CSS 가 없었다.
  `font-num` 클래스는 `--font-num` 이 `@theme` 토큰이 아니어서 만들어지지 않았다. 숫자 폰트는 ADR-F14 의 `.num` 이 맡는다.
- **정리 순서**: 위반이 적고 기계적인 규칙부터 켠다. 디자인 판단이 필요한 `no-restyle` 은 마지막에 컴포넌트 묶음별로 계약(`contracts`)을 정한다.
  1. `no-unknown-classes`, `no-raw-colors`, `require-static-classes`
  2. `text-white`, `bg-black`, `.dark` 셀렉터를 막는 자체 규칙. 이 플러그인은 테마 토큰에 white 와 black 이 있어 이것들을 잡지 못한다(ADR-F23, F15)
  3. `no-inline-styles`. OG 이미지와 아이콘은 `ImageResponse` 가 inline style 만 받으므로 예외로 둔다
  4. `no-arbitrary-values`. 디렉터리별로 나눈다. 카테고리 색처럼 `bg-[var(--token)]` 으로 쓰던 관례는 `@theme` 토큰 클래스로 바꾼다
  5. `no-restyle`. Card, Button, 폼 컨트롤처럼 컴포넌트 묶음마다 허용 범위를 정한다
- **대안 기각**:
  - 모든 규칙을 `warn` 으로 켜기: 경고 1,000건이 다른 경고를 가리고, 에이전트가 경고를 무시하는 습관이 든다.
  - 별도 스크립트(`lint:design`)로 분리: 평소 `pnpm lint` 와 CI 가 보지 않아 새 위반이 계속 들어온다.
  - `no-restricted-syntax` 자체 규칙만으로 하기: 컴포넌트별 허용 범위(`contracts`)와 고치는 방법을 알려 주는 오류 문구를 직접 만들어야 한다. 플러그인이 못 잡는 둘(2번)만 자체 규칙으로 둔다.
  - `eslint-plugin-better-tailwindcss`: 클래스 정렬과 중복 위주라 디자인 시스템 토큰과 컴포넌트 계약을 다루지 않는다.
- **결과**:
  - 얻는 것: 디자인 규칙을 벗어난 className 이 커밋 전에 막힌다. 오류 문구가 대체 토큰이나 고칠 파일을 알려 줘 에이전트가 스스로 고친다.
  - 감당할 것: 0.x 라 버전을 올릴 때 규칙 동작이 바뀔 수 있다. lint 가 Tailwind 를 읽느라 느려진다. 규칙을 켜기 전까지는 그 종류의 위반이 계속 들어올 수 있다.
- **적용 범위**: `eslint.config.mjs`, `package.json`, `src/app/globals.css`. 함정 코드: `common-pitfalls.md` CODE-2 의 arbitrary class 관례는 4번 단계에서 바뀐다.
