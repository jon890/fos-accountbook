# ADR-F01: Next.js App Router 선택

- **결정**: Pages Router 대신 App Router 사용 (Next.js 16).
- **맥락**: Server Components 기본 지원으로 데이터 페칭 단순화 + 번들 크기 감소. Route Groups (`(authenticated)`) 로 인증 레이아웃 분리 가능. Server Actions 로 API Route 없이 폼 처리 가능.
- **대안 기각**: (생략 — 신규 프로젝트의 일반적 표준 선택)
- **트레이드오프**: Next.js 16 일부 API 가 beta 상태 → 문서 변경 빈도 높음.

---


