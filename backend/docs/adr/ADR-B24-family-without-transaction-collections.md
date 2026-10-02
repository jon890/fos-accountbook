# ADR-B24: Family 는 지출과 수입 컬렉션을 갖지 않는다 (2026-10-02)

- **status**: `accepted`
- **결정**: `Family` 엔티티에서 `@OneToMany List<Expense> expenses` 와 `List<Income> incomes` 를 없앤다. 지출과 수입은 각 서비스가 엔티티를 만들고 자기 저장소로 저장한다. `Expense.family`, `Income.family` 의 `@ManyToOne` 은 그대로 둔다(쿼리가 `expense.family.uuid` 로 걸러서다). `members` 컬렉션은 응답과 대시보드가 읽으므로 유지한다.
- **맥락**: `Family.addExpense`, `addIncome` 이 지연 로딩 컬렉션에 새 행을 더해, 지출 하나를 등록할 때마다 그 가족의 지출 전체가 조회됐다. 서비스는 그 뒤 저장소로 다시 저장해 cascade 는 쓰이지 않았다. `getExpenses()`, `getIncomes()` 를 읽는 코드는 main 과 테스트에 없었다(#363, 2026-10-02 조사).
- **대안 기각**:
  - 컬렉션을 두고 `addExpense` 에서 `add` 만 빼기: 쓰이지 않는 양방향 관계가 남아 새 코드가 다시 컬렉션을 건드리면 같은 전체 조회가 돌아온다.
  - `@ManyToOne` 까지 없애고 `familyUuid` 만 두기: QueryDSL 경로와 저장소 쿼리를 모두 바꿔야 해 범위가 크다. ADR-B16 이 미룬 「JPA 연관관계 제거」 의 나머지로 남긴다.
- **결과**:
  - 얻는 것: 지출, 수입 등록이 가족의 다른 행을 읽지 않는다. 집합체 경계가 저장소 단위로 맞춰진다.
  - 감당할 것: 가족 삭제 시 지출, 수입 정리는 지금처럼 저장소의 `softDeleteAllByFamilyUuid` 가 맡는다. cascade 에 기대지 않는다.
- **적용 범위**: `family/domain/entity/Family.java`, `expense/application/service/ExpenseService.java`, `income/application/service/IncomeService.java`.
