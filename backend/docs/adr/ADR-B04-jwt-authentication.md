# ADR-B04: JWT 인증 (HS512, 15분/7일)

**결정**: Stateless JWT 인증, Access 15분 / Refresh 7일

**이유**:

- 세션 서버 불필요 → 수평 확장 용이
- Subject: `user.uuid` (내부 BIGINT id 미노출)
- HS512: 대칭키 방식, 단일 서버 환경에서 충분한 보안

**보안 고려**: Refresh Token 탈취 시 7일 유효 → 향후 Refresh Token Rotation 검토

**참고**: `application-local.yml`에서 access token을 24시간으로 오버라이드함 (개발 편의).
prod 프로파일은 15분 유지.

---

