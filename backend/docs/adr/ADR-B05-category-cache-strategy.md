# ADR-B05: Category 연관관계 없음 (캐시 전략)

**결정**: Expense/Income 엔티티에서 Category를 ORM 연관관계로 잇지 않고 UUID만 저장

**이유**:

- Category는 변경 빈도가 낮고 가족 단위로 공유 → 캐시 적합
- ORM 연관관계 시 Expense 조회마다 Category JOIN 발생 → N+1 문제
- Caffeine Cache에서 `familyUuid → List<Category>` 조회로 대체

**트레이드오프**: DB 수준 FK 없음 → 데이터 정합성은 애플리케이션이 보장

---

