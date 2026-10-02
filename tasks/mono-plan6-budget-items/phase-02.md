# Phase 02. 생활비 합계 규칙과 카테고리 삭제 연동

**Execution profile**: deep

## 목표

월 통계의 `monthlyExpense` 와 예산 알림의 기준 금액을 생활비 합계로 바꾸고, 카테고리를 지우면 예산 항목에서도 빠지게 한다. 예산 화면과 알림이 홈의 생활비와 같은 숫자를 쓰게 하기 위해서다.

**범위 외**: 예산 요약 API 는 phase 03 이다. `daily-stats`, `category-breakdown`, `monthly-trend`, `expenses/by-category` 의 합계는 바꾸지 않는다.

## 컨텍스트

모든 경로는 저장소 root 기준이다. 명령은 `backend/` 에서 돌린다. phase 01 이 만든 `budgetitem` 도메인이 있어야 한다.

**근거 문서**: `backend/docs/adr/ADR-B25-budget-items.md`, `backend/docs/data-schema.md` 의 「예산 요약과 생활비 합계」 절, `backend/docs/flow.md` 의 「4. 카테고리 삭제 시 연쇄 처리」, 「8. 예산 항목과 예산 요약」 절.

생활비 합계에 더하는 지출(그 달, 그 가족):

1. `expense.status = ACTIVE`
2. `expense.excludeFromBudget = false`
3. 카테고리가 ACTIVE 로 조인되면 `category.excludeFromBudget = false` (조인되지 않으면 통과. 지금 동작 그대로다)
4. `expense.recurringExpenseUuid IS NULL` (새 조건)
5. `budget_item_categories` 에 `category_uuid = expense.categoryUuid` 인 행이 없다 (새 조건)

코드에서 확인한 사실:

- 같은 규칙이 두 곳에 있다. 둘 다 고친다.
  - `backend/src/main/java/com/bifos/accountbook/dashboard/infra/repository/impl/DashboardRepositoryImpl.java` 의 `getMonthlyExpenseAmount(CustomUuid familyUuid, int year, int month)`: QueryDSL. 지금 조건은 1~3 이다. `DashboardService.getMonthlyStats` 가 이 값을 `monthlyExpense` 로 준다.
  - `backend/src/main/java/com/bifos/accountbook/expense/infra/repository/jpa/ExpenseJpaRepository.java` 의 `sumAmountByFamilyUuidAndDateBetween`: JPQL. `backend/src/main/java/com/bifos/accountbook/notification/application/service/BudgetAlertService.java` 의 `checkAndCreateBudgetAlert` 가 쓴다.
- `Expense.recurringExpenseUuid` 는 `String` 칸이다(`backend/src/main/java/com/bifos/accountbook/expense/domain/entity/Expense.java`). 반복 지출 생성기 `recurring/application/service/RecurringExpenseGenerator.java` 가 채운다.
- 카테고리 삭제: `backend/src/main/java/com/bifos/accountbook/category/application/service/CategoryService.java` 의 `deleteCategory`. 다른 서비스를 `ObjectProvider` 로 받아 부른다(`expenseServiceProvider`, `recurringExpenseServiceProvider`, `incomeServiceProvider`). `BudgetItemService` 가 `CategoryService` 에 의존하므로 같은 방식으로 순환을 피한다.
- 기존 테스트: `backend/src/test/java/com/bifos/accountbook/dashboard/application/service/DashboardServiceBudgetExclusionTest.java`, `backend/src/test/java/com/bifos/accountbook/notification/application/service/BudgetAlertServiceIntegrationTest.java`. 반복 지출이 만든 지출이나 항목 카테고리를 쓰지 않으면 결과가 그대로여야 한다.
- 테스트 fixture `backend/src/test/java/com/bifos/accountbook/shared/fixtures/ExpenseFixtures.java` 의 `ExpenseBuilder` 에는 `amount`, `description`, `date`, `user` 만 있다. `recurringExpenseUuid` 와 `excludeFromBudget` 을 줄 방법이 없다.

## 의도 메모

- 항목의 `status` 는 조인하지 않는다. phase 01 이 항목 삭제 때 `budget_item_categories` 행을 지우므로, 행이 있으면 ACTIVE 항목에 속한다.
- 두 쿼리의 규칙을 한 곳으로 합치는 리팩터링은 하지 않는다. 도메인이 다르고(`dashboard`, `expense`) 이 phase 의 범위가 커진다. 대신 두 쿼리 위 주석에 서로를 가리키는 한 줄과 ADR-B25 를 적는다.
- 배포하면 `monthlyExpense` 가 줄어든다. 의도한 변화다(ADR-B25 「감당할 것」).
- 카테고리 삭제는 `EXPENSE` 일 때만 항목 정리를 부른다. 수입 카테고리는 항목에 들어갈 수 없다.

## 작업 항목

### 1. `DashboardRepositoryImpl.getMonthlyExpenseAmount` 에 조건 4, 5 추가

조건 5 는 `QBudgetItemCategory` 에 대한 `notExists` 서브쿼리로 쓴다. 메서드 주석과 `backend/src/main/java/com/bifos/accountbook/dashboard/domain/repository/DashboardRepository.java` 의 같은 메서드 주석을 생활비 합계 정의로 고친다.

### 2. `ExpenseJpaRepository.sumAmountByFamilyUuidAndDateBetween` 에 조건 4, 5 추가

`AND e.recurringExpenseUuid IS NULL` 과 `AND NOT EXISTS (SELECT 1 FROM BudgetItemCategory bic WHERE bic.categoryUuid = e.categoryUuid)` 를 더한다.

### 3. 카테고리 삭제 때 예산 항목 정리

- `BudgetItemService` 에 `removeCategory(CustomUuid categoryUuid)` 를 더한다. `@Transactional` 이고 `@ValidateFamilyAccess` 는 붙이지 않는다(삭제 권한은 `deleteCategory` 가 이미 검증했다). 그 카테고리의 `budget_item_categories` 행을 지운다.
- `CategoryService.deleteCategory` 의 `EXPENSE` 분기에서 `ObjectProvider<BudgetItemService>` 로 `removeCategory(category.getUuid())` 를 부른다.

### 4. 테스트 fixture 보강

`ExpenseFixtures.ExpenseBuilder` 에 `recurringExpenseUuid(String)` 와 `excludeFromBudget(boolean)` 을 더한다. 기본값은 지금과 같다(null, false).

### 5. 이 phase 를 검증하는 테스트

- `backend/src/test/java/com/bifos/accountbook/dashboard/application/service/DashboardServiceLivingExpenseTest.java`(신규, `TestFixturesSupport` 상속). 한 달에 지출을 넣고 `DashboardService.getMonthlyStats` 의 `monthlyExpense` 를 단언한다.
  - 일반 지출 10,000, 반복 지출이 만든 지출 20,000(`recurringExpenseUuid` 있음), 예산 항목 카테고리의 지출 30,000 을 넣으면 `monthlyExpense` 는 10,000 이다.
  - 그 항목을 지우면(`BudgetItemService.deleteBudgetItem`) `monthlyExpense` 는 40,000 이 된다.
- `backend/src/test/java/com/bifos/accountbook/notification/application/service/BudgetAlertServiceIntegrationTest.java` 에 케이스를 더한다. 월 예산 100,000 인 가족에 항목 카테고리의 지출 90,000 만 있으면 `checkAndCreateBudgetAlert` 뒤에도 알림이 생기지 않는다.
- `backend/src/test/java/com/bifos/accountbook/category/application/service/CategoryServiceIntegrationTest.java` 에 케이스를 더한다. 항목에 속한 카테고리를 지우면 `BudgetItemService.getBudgetItems` 의 그 항목 `categoryUuids` 에서 빠지고, 항목 자체는 남는다.

## 검증

```bash
cd backend && ./gradlew test --tests "*DashboardServiceLivingExpenseTest*" --tests "*DashboardServiceBudgetExclusionTest*" --tests "*BudgetAlertServiceIntegrationTest*" --tests "*CategoryServiceIntegrationTest*" --no-daemon --console=plain
cd backend && ./gradlew qualityCheck test --no-daemon --console=plain
```

둘 다 `BUILD SUCCESSFUL` 이어야 한다. 기존 `DashboardServiceBudgetExclusionTest` 는 고치지 않고 통과해야 한다.

## 변경 파일

| 파일 | 변경 |
|---|---|
| `backend/src/main/java/com/bifos/accountbook/dashboard/infra/repository/impl/DashboardRepositoryImpl.java` | 수정 |
| `backend/src/main/java/com/bifos/accountbook/dashboard/domain/repository/DashboardRepository.java` | 수정 |
| `backend/src/main/java/com/bifos/accountbook/expense/infra/repository/jpa/ExpenseJpaRepository.java` | 수정 |
| `backend/src/main/java/com/bifos/accountbook/budgetitem/application/service/BudgetItemService.java` | 수정 |
| `backend/src/main/java/com/bifos/accountbook/budgetitem/domain/repository/BudgetItemRepository.java` | 수정 |
| `backend/src/main/java/com/bifos/accountbook/budgetitem/infra/repository/impl/BudgetItemRepositoryImpl.java` | 수정 |
| `backend/src/main/java/com/bifos/accountbook/budgetitem/infra/repository/jpa/BudgetItemCategoryJpaRepository.java` | 수정 |
| `backend/src/main/java/com/bifos/accountbook/category/application/service/CategoryService.java` | 수정 |
| `backend/src/test/java/com/bifos/accountbook/shared/fixtures/ExpenseFixtures.java` | 수정 |
| `backend/src/test/java/com/bifos/accountbook/dashboard/application/service/DashboardServiceLivingExpenseTest.java` | 신규 |
| `backend/src/test/java/com/bifos/accountbook/notification/application/service/BudgetAlertServiceIntegrationTest.java` | 수정 |
| `backend/src/test/java/com/bifos/accountbook/category/application/service/CategoryServiceIntegrationTest.java` | 수정 |
