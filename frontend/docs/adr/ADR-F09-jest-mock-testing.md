# ADR-F09: MSW vs jest.mock — 테스트 방식

**결정**: Server Action 테스트에서 MSW 대신 jest.mock 사용

**이유**:

- Server Actions는 HTTP 레이어 없이 직접 함수 호출
- MSW는 fetch interceptor 기반 → Server Component 환경에서 설정 복잡
- jest.mock으로 `api/client`, `auth-helpers` 모킹 → 단순하고 빠름

**트레이드오프**: 실제 HTTP 요청 경로는 검증 안 됨 → 통합 테스트는 별도 필요

---


