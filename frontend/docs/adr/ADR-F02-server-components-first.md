# ADR-F02: Server Components 우선 전략

- **결정**: 클라이언트 상태가 필요한 경우에만 `"use client"` 추가. 모든 `page.tsx` 는 Server Component, 인터랙션이 필요한 부분만 `*Client.tsx` 로 분리.
- **맥락**: 데이터 페칭을 서버에서 처리 → 백엔드 토큰을 클라이언트에 노출하지 않음. 초기 HTML 에 데이터 포함 → 로딩 플리커 없음. `"use client"` 경계를 말단 컴포넌트로 밀어내 번들 최소화.
- **대안 기각**: (생략 — Next.js App Router 의 권장 패턴 일치)

---


