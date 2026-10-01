# ADR-B10: QueryDSL 동적 쿼리

**결정**: 동적 필터링(카테고리, 날짜 범위)은 QueryDSL 사용

**이유**:

- JPA Criteria API: 코드 장황, 타입 불안전
- QueryDSL: 컴파일 타임 타입 체크, IDE 자동완성, 가독성 높은 쿼리
- Optional 파라미터의 `WHERE` 조건을 `BooleanBuilder`로 동적 구성

---

