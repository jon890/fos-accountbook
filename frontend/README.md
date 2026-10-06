# 우리집 가계부: 프론트엔드

가족 가계부의 웹 화면이다. 백엔드 API 는 서버에서만 부르고, 브라우저는 Server Action 을 거친다.
저장소 전체 소개는 [루트 README](../README.md) 에 있다.

## 기술 스택

| 영역 | 기술 |
| --- | --- |
| 프레임워크 | Next.js 16 (App Router), React 19, TypeScript |
| 스타일 | Tailwind CSS v4, shadcn/ui |
| 인증 | NextAuth.js v5 (Google, Naver) |
| 서버 HTTP | ky |
| 폼과 검증 | React Hook Form, Zod |
| 차트 | Recharts |
| 테스트 | Jest, Testing Library |

## 화면

| 경로 | 화면 |
| --- | --- |
| `/calendar` | 달력 홈. 날짜별 지출 확인과 등록 |
| `/transactions` | 지출과 수입 내역, 반복 지출, 할부 |
| `/analytics` | 월별 추이, 카테고리별 비중 |
| `/budget` | 월 예산과 진행률 |
| `/categories` | 카테고리 관리 |
| `/notifications` | 알림 센터 |
| `/families/select`, `/families/create`, `/invite/[token]` | 가족 선택과 생성, 초대 수락 |
| `/settings` | 기본 가족, 화면 테마, 외부 연동 토큰 |
| `/menu` | 전체 메뉴 |

`(authenticated)` 그룹의 레이아웃이 로그인을 확인하므로, 이 그룹 아래 화면은 따로 인증을 확인하지 않는다.

## 데이터 흐름

```text
Page (app/) → Action (actions/) → Service (services/) → lib/server/api (ky) → 백엔드
```

- `actions/` 는 인증, Zod 입력 검증, 가족 권한 검증, revalidate 를 맡는다.
- `services/` 는 API 호출과 응답 변환을 맡는다.

레이어 규칙과 디렉터리 배치는 [docs/code-architecture.md](docs/code-architecture.md) 가 소유한다.

## 환경 변수

`.env.local` 에 둔다. 값의 형식은 `src/lib/env/schemas/server.env.schema.ts` 가 시작할 때 검사한다.

```bash
AUTH_URL=http://localhost:3000
AUTH_SECRET=<32자 이상. 백엔드 AUTH_SECRET 과 같은 값>

AUTH_GOOGLE_ID=
AUTH_GOOGLE_SECRET=
AUTH_NAVER_ID=
AUTH_NAVER_SECRET=

BACKEND_API_URL=http://localhost:8080/api/v1
```

## 명령

```bash
pnpm install
pnpm dev            # 개발 서버
pnpm build          # 프로덕션 빌드
pnpm lint           # ESLint
pnpm lint:md        # 문서 속 Tailwind 클래스 검사
pnpm test           # 전체 테스트
pnpm test:coverage  # 커버리지
```

CI 는 `pnpm tsc --noEmit`, `pnpm lint`, `pnpm lint:md`, `pnpm test:ci` 를 돌린다.

## 문서

| 문서 | 내용 |
| --- | --- |
| [docs/prd.md](docs/prd.md) | 제품 요구사항 |
| [docs/flow.md](docs/flow.md) | 사용자 흐름 |
| [docs/code-architecture.md](docs/code-architecture.md) | 디렉터리와 레이어 규칙 |
| [docs/data-schema.md](docs/data-schema.md) | 화면이 쓰는 데이터 형태 |
| [docs/testing-strategy.md](docs/testing-strategy.md) | 테스트 전략 |
| [docs/adr/INDEX.md](docs/adr/INDEX.md) | 결정 기록 (ADR-F) |

작업 규칙은 [CLAUDE.md](CLAUDE.md) 가 정한다.
