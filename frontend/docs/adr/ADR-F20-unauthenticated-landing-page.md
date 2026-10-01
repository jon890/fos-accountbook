# ADR-F20: 인증 안 한 사용자의 `/` 진입은 Landing 표시

**대체된 부분**: 인증 사용자의 첫 화면은 [ADR-F32](#adr-f32)에 따라 `/calendar`로 바뀌었다. 비로그인 사용자의 Landing 표시는 유지한다.

- **결정**: `/` 라우트를 public 으로 변경. 인증 안 한 사용자는 Landing (Hero + Features 3 + CTA), 인증 사용자는 `/dashboard` 자동 redirect. `src/app/page.tsx` 가 page-level `auth()` 호출 후 세션 분기 처리. proxy.ts (ADR-F19) 는 전역 auth proxy 라 별도 matcher 수정 불필요.
- **맥락**: 기존 동작은 인증 안 한 모든 진입 = `/auth/signin` 강제 redirect. login 페이지가 사실상 첫 화면이라 "어떤 서비스인지" 가 부재 — 신규 사용자가 가입 가치를 판단할 정보 없음. 부부 가계부 라는 도메인 특성상 가치 제안 (가족·카테고리·분석) 을 먼저 보여줄 entry 가 필요.
- **대안 기각**:
  - `/auth/signin` 만 운영하고 그 안에 가치 제안 카피 추가: signin 페이지가 비대해지고 (form + marketing 혼재) 분석/추적 단위가 모호.
  - 별도 `/landing` 라우트 + `/` 는 그대로 redirect: URL 두 개로 분기되어 marketing 전환 추적 + SEO root domain 가치 분산.
- **트레이드오프**: protected route 직접 URL 진입 (예: `/dashboard` 의 deep link 공유) 시 Landing 으로 한 단계 더 거쳐야 함. `(authenticated)/layout.tsx` 의 unauth redirect 대상도 Landing 으로 통일.
- **적용 범위**: `src/app/page.tsx`, `src/app/(authenticated)/layout.tsx`.


