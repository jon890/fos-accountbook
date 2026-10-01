# ADR 목록 (프론트엔드)

프론트엔드 결정은 여기, 백엔드는 `backend/docs/adr/INDEX.md`, 저장소 전체는 `docs/adr/INDEX.md` 가 소유한다.
새 결정은 파일 하나를 만들고 아래 표에 한 줄을 더한다(ADR-M02).

| 번호 | 결정 | 상태 |
| --- | --- | --- |
| [ADR-F01](ADR-F01-app-router.md) | Next.js App Router 선택 | accepted |
| [ADR-F02](ADR-F02-server-components-first.md) | Server Components 우선 전략 | accepted |
| [ADR-F03](ADR-F03-nextauth-jwt-strategy.md) | NextAuth v5 JWT 전략 | accepted |
| [ADR-F04](ADR-F04-actions-services-separation.md) | Actions/Services 계층 분리 | accepted |
| [ADR-F05](ADR-F05-ky-http-client.md) | ky HTTP 클라이언트 | accepted |
| [ADR-F06](ADR-F06-zod-runtime-validation.md) | Zod 런타임 검증 | accepted |
| [ADR-F07](ADR-F07-shadcn-tailwind-css.md) | Shadcn + Tailwind CSS v4 | accepted |
| [ADR-F08](ADR-F08-sonner-toast-alerts.md) | alert() 대신 sonner 토스트 | accepted |
| [ADR-F09](ADR-F09-jest-mock-testing.md) | MSW vs jest.mock — 테스트 방식 | accepted |
| [ADR-F10](ADR-F10-recurring-server-actions.md) | 반복 지출 상태 관리 — Server Action 방식 유지 | accepted |
| [ADR-F11](ADR-F11-ci-code-review.md) | CI 코드 리뷰 워크플로 설계 | accepted |
| [ADR-F12](ADR-F12-page-action-data-access.md) | Page에서 serverApiGet 직접 호출 금지 | accepted |
| [ADR-F13](ADR-F13-oklch-color-system.md) | OKLCH 색 시스템 채택 | accepted |
| [ADR-F14](ADR-F14-pretendard-variable-font.md) | Pretendard Variable 폰트 도입 | accepted |
| [ADR-F15](ADR-F15-data-theme-attribute.md) | next-themes attribute='data-theme' | accepted |
| [ADR-F16](ADR-F16-category-breakdown-aggregation.md) | 카테고리 월 분포는 Server Action 측 집계 (superseded → ADR-F30) | superseded |
| [ADR-F17](ADR-F17-search-params-draft.md) | URL searchParams ↔ Client state 동기화는 draft 패턴 | accepted |
| [ADR-F18](ADR-F18-react-daypicker-migration.md) | react-day-picker → @daypicker/react 패키지 이전 | accepted |
| [ADR-F19](ADR-F19-typescript-major-migration.md) | TypeScript 5.9 → 6.0 메이저 이전 + breaking 대응 패턴 | accepted |
| [ADR-F20](ADR-F20-unauthenticated-landing-page.md) | 인증 안 한 사용자의 `/` 진입은 Landing 표시 | accepted |
| [ADR-F21](ADR-F21-transaction-dialog-unification.md) | Add/Edit Transaction 다이얼로그 단일화 | accepted |
| [ADR-F22](ADR-F22-sensitive-server-components.md) | 민감 정보를 다루는 컴포넌트는 Server Component 로 유지 + Client 핸들러는 children 슬롯 | accepted |
| [ADR-F23](ADR-F23-semantic-foreground-tokens.md) | semantic foreground 토큰 (`--color-{semantic}-fg`) 으로 강조 배경 위 텍스트 색 명시 | accepted |
| [ADR-F24](ADR-F24-sonner-teal-color-mapping.md) | sonner richColors OFF + Teal 토큰 직접 매핑 | accepted |
| [ADR-F25](ADR-F25-server-action-authorization.md) | Server Action 권한 검증 3-패턴 표준화 | accepted |
| [ADR-F26](ADR-F26-unauthorized-session-redirect.md) | 백엔드 401 응답을 인증 만료로 분류해 로그인으로 일관 리다이렉트 | accepted |
| [ADR-F27](ADR-F27-dropdown-direct-action.md) | Radix `DropdownMenuItem` 안에서 form submit 금지 — `onSelect` 직접 호출 | accepted |
| [ADR-F28](ADR-F28-toss-blue-brand-color.md) | brand 색 Teal(h=188) → Toss Blue(h=257) 변경 | accepted |
| [ADR-F29](ADR-F29-tailwind-markdown-scan.md) | Tailwind v4 markdown 스캔 위험 패턴 차단 — md-lint 게이트 + 안전 표기 | accepted |
| [ADR-F30](ADR-F30-backend-monthly-aggregation.md) | 월 합계와 추이는 백엔드 집계 API 를 부른다 | accepted |
| [ADR-F31](ADR-F31-get-retry-timeout.md) | 백엔드 호출 재시도는 GET 만 하고 타임아웃을 명시한다 | accepted |
| [ADR-F32](ADR-F32-calendar-home-monthly-list.md) | 달력을 첫 화면으로 두고 한 달 목록을 한 번에 받는다 | accepted |
| [ADR-F33](ADR-F33-bottom-tabs-menu.md) | 메뉴는 하단 탭의 「전체」 에 모은다 | accepted |
| [ADR-F34](ADR-F34-browser-tests-fake-backend.md) | 브라우저 테스트는 가짜 백엔드와 직접 만든 세션으로 돌린다 | accepted |
| [ADR-F35](ADR-F35-mobile-spacing.md) | 화면 바깥 여백은 레이아웃이 갖고 카드 여백은 카드 부품이 갖는다 | accepted |
| [ADR-F37](ADR-F37-single-transaction-row.md) | 거래 목록은 공용 행 하나로 그리고 누르면 수정 시트를 연다 | accepted |
