# ADR-B19: access token 과 refresh token 을 typ 클레임으로 구분한다 (2026-10-01)

- **status**: `accepted`
- **결정**: 백엔드가 발급하는 JWT 에 `typ` 클레임을 넣는다. access token 은 `access`, refresh token 은 `refresh` 다.
  API 인증 필터는 `access` 만, `/auth/refresh` 는 `refresh` 만 받는다. `typ` 이 없는 토큰은 둘 다 거부한다.
- **맥락**: 두 토큰의 클레임이 `sub`, `iat`, `exp` 로 같아 서로 구별되지 않았다(ADR-B04 의 발급 방식).
  7일짜리 refresh token 으로 API 를 그대로 부를 수 있었고, 15분짜리 access token 으로 새 토큰 쌍을 받을 수도 있었다.
  응답 로깅이 두 토큰을 운영 로그에 남기고 있었다(2026-10-01 점검, ADR-B20 이 로그 쪽을 다룬다).
- **대안 기각**:
  - 서명 키를 토큰 종류마다 나누기: 키 설정이 둘로 늘고, 프론트엔드와 공유하는 `AUTH_SECRET` 하나로 운영하는 구성(ADR-B17)과 맞지 않는다.
  - refresh token 회전과 DB 저장: 탈취된 토큰을 폐기할 수 있지만 테이블과 동시 갱신 경쟁 처리가 필요하다. 이번 문제(종류 혼용)는 클레임 하나로 막힌다. 회전은 ADR-B04 의 향후 검토로 남긴다.
  - `typ` 없는 토큰을 기존 토큰으로 보고 계속 받기: 로그에 남은 옛 토큰이 만료될 때까지 유효하게 남는다.
- **결과**:
  - 얻는 것: 토큰 종류가 섞여 쓰이지 않는다. 배포 시점에 `typ` 없는 옛 토큰이 모두 무효가 되어, 로그에 남은 토큰을 따로 폐기하지 않아도 된다.
  - 감당할 것: 배포 직후 모든 사용자가 한 번 다시 로그인한다. 새 종류의 JWT 를 만들면 `typ` 값을 정하고 검증 쪽도 함께 고친다.
- **적용 범위**: `JwtTokenProvider`, `JwtAuthenticationFilter`, `AuthService.refreshToken`. 소셜 로그인 서명(ADR-B17)과 연동 토큰(ADR-B18)은 해당하지 않는다.
