# Phase 3: 인프라 레이어 — Repository 구현체

## 컨텍스트

`fos-accountbook-backend` Spring Boot 백엔드. 반복 지출 기능 구현 중.
Phase 2에서 `RecurringExpense` 엔티티와 `RecurringExpenseRepository` 인터페이스가 완료된 상태다.

반드시 먼저 읽을 문서:
- `CLAUDE.md` — Repository 패턴, QueryDSL 사용법
- `docs/code-architecture.md` — infra 레이어 구조

기존 코드 참조 (패턴 파악용):
- `src/main/java/com/bifos/accountbook/infra/persistence/` 디렉터리 구조 파악
- 기존 `*RepositoryImpl.java` 파일 하나를 읽어 JPA Spring Data + QueryDSL 결합 패턴 파악

## 목표

`RecurringExpenseRepository` 인터페이스의 구현체를 infra 레이어에 추가한다.

## 작업 목록

- [ ] 기존 infra/persistence 디렉터리 구조 파악 (`Glob`으로 `*RepositoryImpl.java` 패턴 검색)

- [ ] JPA 인터페이스 생성 (필요 시):
  `src/main/java/com/bifos/accountbook/infra/persistence/repository/RecurringExpenseJpaRepository.java`
  - `JpaRepository<RecurringExpense, Long>` 확장
  - 기본 CRUD는 Spring Data JPA 자동 제공

- [ ] `RecurringExpenseRepositoryImpl.java` 생성
  - 경로: `src/main/java/com/bifos/accountbook/infra/persistence/repository/impl/`
  - `@Repository @RequiredArgsConstructor` 어노테이션
  - `RecurringExpenseRepository` 구현
  - QueryDSL `QRecurringExpense` 활용 (Q타입은 빌드 후 자동 생성됨)
  - 구현 메서드:
    - `save()` — JPA save 위임
    - `findActiveByUuid()` — QueryDSL: `status = ACTIVE AND uuid = ?`
    - `findAllActiveByFamilyUuid()` — QueryDSL: `status = ACTIVE AND family_uuid = ?`
    - `findAllActiveByDayOfMonth()` — QueryDSL: `status = ACTIVE AND day_of_month = ?`
    - `existsByRecurringExpenseUuidAndYearMonth()` — expenses 테이블 조회 (ExpenseJpaRepository 활용)
    - `sumActiveAmountByFamilyUuid()` — QueryDSL sum 집계, null이면 BigDecimal.ZERO 반환

## 성공 기준

- `./gradlew build -x test -x checkstyleMain -x checkstyleTest --no-daemon` 성공
- Q타입 클래스(`QRecurringExpense`)가 build/generated 디렉터리에 생성됨

## 주의사항

- QueryDSL Q타입은 빌드 시 자동 생성되므로 직접 작성하지 않는다
- `existsByRecurringExpenseUuidAndYearMonth`는 `Expense` 테이블을 조회해야 하므로 `ExpenseJpaRepository` 또는 별도 QueryDSL 쿼리 사용
- 기존 구현체 패턴을 그대로 따른다 — 독자적인 방식 도입 금지
- 와일드카드 import 금지

## Blocked 조건

Q타입 빌드 실패로 인해 QueryDSL을 사용할 수 없으면:
`PHASE_BLOCKED: QueryDSL Q타입 생성 실패 — Gradle 설정 확인 필요`
