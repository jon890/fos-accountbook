# Phase 2: 도메인 레이어 — Entity + Repository 인터페이스

## 컨텍스트

`fos-accountbook-backend` Spring Boot 백엔드. 반복 지출 기능 구현 중.
Phase 1에서 Flyway 마이그레이션(V13, V14)이 완료된 상태다.

반드시 먼저 읽을 문서:
- `CLAUDE.md` — Entity 규칙, Repository 패턴, 코드 컨벤션
- `docs/code-architecture.md` — 레이어 의존성 규칙
- `docs/data-schema.md` — 확정 스키마

기존 코드 참조 (패턴 파악용):
- `src/main/java/com/bifos/accountbook/domain/entity/Expense.java`
- `src/main/java/com/bifos/accountbook/domain/entity/Category.java`
- `src/main/java/com/bifos/accountbook/domain/repository/ExpenseRepository.java`
- `src/main/java/com/bifos/accountbook/domain/value/CustomUuid.java`

## 목표

도메인 레이어에 반복 지출 관련 클래스를 추가한다.

## 작업 목록

- [ ] `src/main/java/com/bifos/accountbook/domain/entity/RecurringExpenseStatus.java` 생성
  - enum: `ACTIVE`, `ENDED`

- [ ] `src/main/java/com/bifos/accountbook/domain/entity/RecurringExpense.java` 생성
  - 어노테이션: `@Entity @Getter @Builder @NoArgsConstructor @AllArgsConstructor`
  - `@Data` 사용 금지
  - 필드:
    - `Long id` (@Id @GeneratedValue AUTO)
    - `CustomUuid uuid`
    - `String familyUuid` (VARCHAR(36), NOT NULL)
    - `String categoryUuid` (NOT NULL)
    - `String userUuid` (NOT NULL)
    - `String name` (VARCHAR(100), NOT NULL)
    - `BigDecimal amount` (NOT NULL)
    - `int dayOfMonth` (@Column(name="day_of_month"), NOT NULL)
    - `RecurringExpenseStatus status` (NOT NULL, DEFAULT ACTIVE)
    - `LocalDateTime createdAt`, `LocalDateTime updatedAt` (JPA Auditing)
  - 테이블명: `recurring_expenses`

- [ ] `src/main/java/com/bifos/accountbook/domain/entity/Expense.java` 수정
  - 기존 필드에 아래 2개 추가:
    - `String recurringExpenseUuid` (@Column(name="recurring_expense_uuid"), nullable=true)
    - `String yearMonth` (@Column(name="year_month"), nullable=true)

- [ ] `src/main/java/com/bifos/accountbook/domain/repository/RecurringExpenseRepository.java` 생성
  - 인터페이스만 선언 (구현체는 Phase 3)
  - 메서드:
    - `RecurringExpense save(RecurringExpense recurringExpense)`
    - `Optional<RecurringExpense> findActiveByUuid(CustomUuid uuid)`
    - `List<RecurringExpense> findAllActiveByFamilyUuid(String familyUuid)`
    - `List<RecurringExpense> findAllActiveByDayOfMonth(int dayOfMonth)`
    - `boolean existsByRecurringExpenseUuidAndYearMonth(String recurringExpenseUuid, String yearMonth)`
    - `BigDecimal sumActiveAmountByFamilyUuid(String familyUuid)` — 월 합계용

## 성공 기준

- `./gradlew build -x test -x checkstyleMain -x checkstyleTest --no-daemon` 성공
- 4개 파일이 올바른 경로에 존재

## 주의사항

- `CustomUuid` 타입은 `@Convert(converter = CustomUuidConverter.class)` 또는 기존 Entity의 방식 그대로 따름
- JPA Auditing (`@CreatedDate`, `@LastModifiedDate`)은 기존 Entity 방식 참조
- `@Data` 절대 금지 — equals/hashCode 무한루프 위험
- `domain` 레이어는 `infra`에 의존하지 않는다 — Repository는 인터페이스만
- 와일드카드 import 금지 (`import java.util.*` 금지)
