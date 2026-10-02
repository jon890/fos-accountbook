# ADR-F06: Zod 런타임 검증

**결정**: 모든 Server Action 입력값을 Zod로 검증. services 가 받는 백엔드 응답 검증은 [ADR-F42](ADR-F42-service-response-validation.md) 가 정한다

**이유**:

- TypeScript 타입은 컴파일 타임만 보장 → 런타임 서버 액션에서 악의적 입력 가능
- Zod 스키마에서 TypeScript 타입을 derive → 타입 정의 중복 없음
- 에러 메시지가 필드 단위로 구조화 → UI 폼 에러 표시 직결

---


