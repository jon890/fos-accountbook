# ADR-F04: Actions/Services 계층 분리

**결정**: `actions/`(인증·검증)와 `services/`(API 호출·로직) 엄격 분리

**이유**:

- `"use server"` 코드와 비즈니스 로직이 섞이면 테스트가 어려움
- Services는 순수 함수에 가까워 단위 테스트 용이
- revalidatePath, requireAuth 같은 Next.js 전용 코드를 Actions에만 격리

**규칙**:

- `actions/`: `"use server"`, 인증, Zod 검증, revalidatePath만 담당
- `services/`: API 호출, 데이터 변환, 쿼리 빌딩만 담당. `"use server"` 사용 금지

---


