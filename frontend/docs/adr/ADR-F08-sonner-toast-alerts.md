# ADR-F08: alert() 대신 sonner 토스트

**결정**: `alert()`, `confirm()`, `prompt()` 전면 금지, sonner 사용

**이유**:

- `alert()`은 모달 차단으로 UX 저하, 스타일 제어 불가
- sonner는 스택형 토스트, 자동 dismiss, 커스텀 스타일 지원

---


