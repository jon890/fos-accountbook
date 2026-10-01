# ADR-F03: NextAuth v5 JWT 전략

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


