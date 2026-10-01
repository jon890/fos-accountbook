# ADR-B07: BigDecimal 금액 처리

**결정**: 금액 필드 전체 `DECIMAL(12, 2)` + BigDecimal

**이유**:

- double/float: 부동소수점 오차 → 금액 계산 신뢰 불가
- BigDecimal: 정밀한 십진수 연산 보장
- API 응답에서 문자열로 직렬화 → 프론트에서 parseFloat 후 Number 처리

---

