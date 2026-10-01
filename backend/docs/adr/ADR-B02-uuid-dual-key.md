# ADR-B02: UUID 이중 키 전략

**결정**: 내부 PK는 `BIGINT` auto-increment, 외부 노출 ID는 `VARCHAR(36)` uuid

**이유**:

- BIGINT PK: JOIN 성능 최적화, 인덱스 크기 최소화
- UUID 외부 ID: 순차 예측 불가 → 보안 강화, `GET /expenses/1` 같은 열거 공격 방지
- 외부 API는 uuid만 노출

---

