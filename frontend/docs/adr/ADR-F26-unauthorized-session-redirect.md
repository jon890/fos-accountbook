# ADR-F26: 백엔드 401 응답을 인증 만료로 분류해 로그인으로 일관 리다이렉트 (2026-06-02)

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

