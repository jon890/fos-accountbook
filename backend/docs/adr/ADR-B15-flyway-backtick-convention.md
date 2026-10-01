# ADR-B15: Flyway SQL 백틱 컨벤션 (2026-04-05)

**결정**: Flyway SQL과 JPA `@Column` 매핑에서 예약어 가능성이 있는 컬럼명·테이블명에 백틱(`` ` ``)을 사용한다.

**이유**:

- H2 `MODE=MySQL`은 실제 MySQL 예약어를 검증하지 못함 → `year_month`(MySQL 예약어) 이슈가 프로덕션 배포 시점에야 발견됨
- Flyway SQL만 백틱 처리 후에도 JPA `@Column(name = "year_month")`에서 동일 문제 재발 → Hibernate INSERT SQL도 예약어 이스케이프 필요
- 백틱을 일관 사용하면 예약어 충돌을 원천 차단
- 가장 가벼운 방어 수단. 문제가 반복되면 단계적으로 강화:
  1. **(현재)** 백틱 컨벤션
  2. Testcontainers로 CI에서 실제 MySQL 마이그레이션 검증
  3. local Flyway validate 사전 실행

**적용 범위**:

- **Flyway SQL**: V15부터 적용. 이미 적용된 마이그레이션(V1~V14)은 체크섬 불일치 방지를 위해 수정하지 않음
- **JPA `@Column`**: 예약어 가능성이 있는 컬럼명은 `@Column(name = "`column_name`")`으로 작성. Hibernate가 dialect에 맞게 자동 이스케이프

---

