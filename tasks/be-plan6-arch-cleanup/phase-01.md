# Phase 01. Family 의 지출과 수입 컬렉션 제거 (#363)

**Execution profile**: standard
**Domain**: backend-domain

## 목표

`Family` 에서 `expenses`, `incomes` 컬렉션과 `addExpense`, `addIncome` 을 없애고, 지출과 수입 등록이 가족의 다른 행을 읽지 않는다.

**범위 외**: `Expense.family`, `Income.family` 의 `@ManyToOne` 과 `members` 컬렉션은 그대로 둔다.

## 컨텍스트

모든 경로는 저장소 root 기준이다. 명령은 `backend/` 에서 돌린다. `gradle-wrapper.jar` 가 없으면 먼저 `mise exec gradle@9.8.0 -- gradle wrapper --gradle-version 9.8.0` 으로 만들고 커밋하지 않는다.

**기준 파일 규칙**(ADR-B22, `backend/CLAUDE.md` 코드 스타일 표): 위반을 고친 뒤 `./gradlew archTest -Parchunit.freeze.store.default.allowStoreUpdate=true` 로 기준에서 사라진 항목만 줄인다. 이 옵션으로 새 위반을 기준에 넣지 않는다. 실행 전후 `git diff backend/config/archunit/store/` 로 줄어들기만 했는지 확인한다.

**근거 문서**: `backend/docs/adr/ADR-B24-family-without-transaction-collections.md`, `backend/docs/adr/ADR-B03-soft-delete-strategy.md`.

코드에서 확인한 사실:

- `backend/src/main/java/com/bifos/accountbook/family/domain/entity/Family.java` 71-82행: `@OneToMany(mappedBy="family", cascade={PERSIST, MERGE}) List<Income> incomes`, `List<Expense> expenses`. 131-162행 `addIncome`, 172-203행 `addExpense` 가 `.family(this)` 로 만들고 컬렉션에 `add` 한다(지연 로딩 컬렉션 전체 조회). 3인자 오버로드는 `LocalDateTime.now()` 를 쓴다. 84-88행 Javadoc 이 컬렉션을 둔 이유를 설명한다.
- `backend/src/main/java/com/bifos/accountbook/expense/application/service/ExpenseService.java` 86행 `family.addExpense(...)`, 100행 저장소 저장. `backend/src/main/java/com/bifos/accountbook/income/application/service/IncomeService.java` 68행 `family.addIncome(...)`, 78행 저장소 저장.
- `getExpenses()`, `getIncomes()` 를 읽는 코드는 main, test 모두 없다. 테스트 픽스처(`ExpenseFixtures`, `IncomeFixtures`)는 `builder().family(family)` 와 저장소 저장을 쓴다.
- `Expense`, `Income` 은 `@Builder` 가 있고 `family` 는 `nullable=false` 다.

## 의도 메모

- 서비스가 `Expense.builder().family(family)...build()` 로 만들고 저장소로 저장한다. `addExpense` 가 하던 기본값(날짜, 메모 등. 예산 제외는 서비스의 `setExcludeFromBudget` 이 이미 처리한다)을 그대로 옮긴다. 날짜 기본값은 서비스에 이미 주입된 `Clock`(`BusinessTime.ZONE`)을 쓴다.
- Javadoc 의 「JPA 연관관계 정책」 문단을 ADR-B24 에 맞게 고친다.
- 회귀 확인: 서비스 통합 테스트에서 지출을 하나 등록할 때 같은 가족의 기존 지출을 조회하는 SQL 이 나가지 않는지 확인한다. 방법은 하나로 정한다. 테스트에서 `EntityManagerFactory.unwrap(SessionFactory.class).getStatistics().setStatisticsEnabled(true)` 로 통계를 켜고(저장소에 `hibernate.generate_statistics` 설정이 없다), 가족에 지출 N건을 만든 뒤 영속성 컨텍스트를 비우고 등록해 `getEntityLoadCount()` 가 N 만큼 늘지 않음을 단언한다. 변경 전 코드에서 이 테스트가 실패하는지 먼저 확인하고 결과를 커밋 본문에 적는다. 변경 전에도 통과하면(지연 컬렉션 `add` 가 초기화하지 않는 경우) 회귀 테스트를 `Family` 에 `expenses`, `incomes` 필드가 없다는 리플렉션 단언으로 바꾸고 그 사실을 커밋 본문에 적는다. 수입은 `IncomeService` 등록 후 `Family` 에 컬렉션이 없다는 같은 단언으로 갈음한다.

## 작업 항목

### 1. `Family.java` 컬렉션, 메서드, Javadoc 정리

### 2. `ExpenseService.java`, `IncomeService.java` 생성 경로 교체

### 3. 테스트

- `backend/src/test/java/com/bifos/accountbook/expense/application/service/ExpenseServiceIntegrationTest.java`(수정): 등록 시 기존 지출을 불러오지 않는다.
- 기존 등록 관련 테스트가 모두 통과한다.

## 검증

`backend/` 에서 실행한다.

```bash
./gradlew qualityCheck test --tests '*ExpenseServiceIntegrationTest*'
./gradlew qualityCheck test build
```

기대값: 모든 명령이 성공한다.

## 변경 파일

| 파일 | 변경 |
|---|---|
| `backend/src/main/java/com/bifos/accountbook/family/domain/entity/Family.java` | 수정 |
| `backend/src/main/java/com/bifos/accountbook/expense/application/service/ExpenseService.java` | 수정 |
| `backend/src/main/java/com/bifos/accountbook/income/application/service/IncomeService.java` | 수정 |
| `backend/src/test/java/com/bifos/accountbook/expense/application/service/ExpenseServiceIntegrationTest.java` | 수정 |
