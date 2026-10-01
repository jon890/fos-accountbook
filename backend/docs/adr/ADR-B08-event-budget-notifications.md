# ADR-B08: 이벤트 기반 예산 알림

**결정**: 지출 생성·수정 시 Spring ApplicationEvent 발행 → BudgetAlertService 구독

**이유**:

- 지출 저장 로직과 알림 생성 로직 분리 → 단일 책임 원칙
- 트랜잭션 커밋 후 알림 처리 가능 (`@TransactionalEventListener`)
- 향후 비동기 처리(`@Async`) 전환 용이

**알림 타입**: `BUDGET_50_EXCEEDED` (50% 초과) | `BUDGET_80_EXCEEDED` (80% 초과) | `BUDGET_100_EXCEEDED` (100% 초과) | `RECURRING_EXPENSE_CREATED` (반복 지출 자동 생성)

**중복 방지**: `(familyUuid, userUuid, type, yearMonth)` 기준으로 알림 중복 체크. 가족의 ACTIVE 구성원마다 수신자 UUID 를 채워 알림 생성

---

