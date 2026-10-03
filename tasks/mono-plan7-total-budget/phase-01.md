# Phase 01. 예산 합계 규칙과 예산 요약 응답

**Execution profile**: standard

## 목표

월 통계의 `monthlyExpense` 와 예산 알림을 예산 합계(고정지출을 뺀 모든 지출, 항목 포함)로 되돌리고, 예산 요약 응답에 전체 예산 줄과 계산된 생활비 한도를 담는다.
사용자는 월 예산을 전체 예산(180만원)으로 쓰고, 용돈 항목 한도를 뺀 나머지를 생활비로 본다.

**범위 외**: 프론트엔드는 phase 02 다. `daily-stats`, `category-breakdown`, `monthly-trend` 는 바꾸지 않는다.

## 컨텍스트

모든 경로는 저장소 root 기준이다. 명령은 `backend/` 에서 돌린다.

**근거 문서**: `backend/docs/adr/ADR-B26-monthly-budget-is-total.md`, `backend/docs/adr/ADR-B25-budget-items.md`, `backend/docs/data-schema.md` 의 「예산 요약과 생활비 합계」 절, `backend/docs/flow.md` 의 「8. 예산 항목과 예산 요약」 절.

코드에서 확인한 사실:

- `backend/src/main/java/com/bifos/accountbook/dashboard/infra/repository/impl/DashboardRepositoryImpl.java` 의 `getMonthlyExpenseAmount(CustomUuid familyUuid, int year, int month)` 는 지금 생활비 규칙이다. 조건은 ACTIVE, `expense.excludeFromBudget = false`, 카테고리 예산 제외 아님, `expense.recurringExpenseUuid.isNull()`, `QBudgetItemCategory` 에 대한 `notExists` 다.
  - 이 메서드를 쓰는 곳은 `DashboardService.getMonthlyStats`(`monthlyExpense`)와 `DashboardService.getBudgetSummary`(`livingSpent`) 둘이다.
- `backend/src/main/java/com/bifos/accountbook/expense/infra/repository/jpa/ExpenseJpaRepository.java` 의 `sumAmountByFamilyUuidAndDateBetween` 도 같은 생활비 규칙이고 `BudgetAlertService.checkAndCreateBudgetAlert` 가 쓴다. 마지막 조건이 `AND NOT EXISTS (SELECT 1 FROM BudgetItemCategory bic WHERE bic.categoryUuid = e.categoryUuid)` 다.
- `DashboardService.getBudgetSummary` 는 `livingLimit` 을 `family.getMonthlyBudget()`(null 이면 0)으로, 항목 목록을 `budgetItemRepository.findAllActiveByFamilyUuid(familyUuid)` 로 만든다.
- 응답 DTO 는 `backend/src/main/java/com/bifos/accountbook/dashboard/application/dto/` 의 `BudgetSummaryResponse`(`year`, `month`, `living`, `items`), `BudgetSummaryLiving`(`spent`, `limit`), `BudgetSummaryItem` 이다.
- 이 규칙에 기대는 테스트:
  - `backend/src/test/java/com/bifos/accountbook/dashboard/application/service/DashboardServiceLivingExpenseTest.java`: 항목 카테고리 지출이 `monthlyExpense` 에서 빠진다고 단언한다.
  - `backend/src/test/java/com/bifos/accountbook/notification/application/service/BudgetAlertServiceIntegrationTest.java`: 항목 카테고리 지출 90,000 만 있으면 알림이 없다고 단언한다.
  - `backend/src/test/java/com/bifos/accountbook/dashboard/presentation/controller/DashboardControllerTest.java`: `budget-summary` 의 `living.limit` 을 월 예산으로 단언한다.

## 의도 메모

- 예산 합계 규칙: ACTIVE, 지출 예산 제외 아님, 카테고리 예산 제외 아님, `recurringExpenseUuid` null. 항목 카테고리 지출을 **포함**한다.
- 생활비 규칙: 예산 합계 규칙에 「카테고리가 `budget_item_categories` 에 없음」 을 더한 것. 지금 `getMonthlyExpenseAmount` 의 조건 그대로다.
- `getMonthlyExpenseAmount` 의 뜻을 예산 합계로 바꾸고, 생활비는 새 메서드 `getMonthlyLivingExpenseAmount` 로 둔다. 이름을 이렇게 나누는 이유는 `monthlyExpense` 를 만드는 쪽이 이미 `getMonthlyExpenseAmount` 를 부르기 때문이다.
- 예산 합계 규칙은 QueryDSL 과 JPQL 두 곳에 있다. 두 쿼리의 주석이 서로와 ADR-B26 을 가리키게 고친다.
- `living.limit = max(total.limit - Σ 항목 limit, 0)`. 금액은 `BigDecimal` 로 계산한다(ADR-B07).
- `allocationExceeded = total.limit > 0 && Σ 항목 limit > total.limit`.
- 항목 한도 합이 월 예산을 넘어도 저장을 막지 않는다(ADR-B26 대안 기각).

## 작업 항목

### 1. 저장소 규칙 분리

- `DashboardRepositoryImpl.getMonthlyExpenseAmount` 에서 `notExists` 조건을 뺀다.
- `DashboardRepository` 와 `DashboardRepositoryImpl` 에 `BigDecimal getMonthlyLivingExpenseAmount(CustomUuid familyUuid, int year, int month)` 를 더한다. 조건은 지금 `getMonthlyExpenseAmount` 의 조건 그대로다.
- `ExpenseJpaRepository.sumAmountByFamilyUuidAndDateBetween` 에서 `NOT EXISTS` 조건을 뺀다.
- 세 곳의 주석을 ADR-B26 기준으로 고친다.

### 2. 예산 요약 DTO

- `BudgetSummaryLiving` 을 `BudgetSummaryAmount`(`spent`, `limit`)로 이름을 바꾼다. 예산 줄과 생활비 줄이 함께 쓴다.
- `BudgetSummaryResponse` 에 `total`(`BudgetSummaryAmount`)과 `allocationExceeded`(`Boolean`)를 더한다.

### 3. `DashboardService.getBudgetSummary`

- `total.spent` = `getMonthlyExpenseAmount`, `total.limit` = 월 예산(null 이면 0).
- `living.spent` = `getMonthlyLivingExpenseAmount`, `living.limit` = 의도 메모의 식.
- `allocationExceeded` = 의도 메모의 식.

### 4. 이 phase 를 검증하는 테스트

- `DashboardServiceLivingExpenseTest`: 일반 지출 10,000, 반복 지출이 만든 지출 20,000, 항목 카테고리 지출 30,000 이면 `monthlyExpense` 는 40,000 이다. 항목을 지워도 40,000 이다.
- `BudgetAlertServiceIntegrationTest`: 월 예산 100,000 인 가족에 항목 카테고리 지출 90,000 만 있으면 `BUDGET_80_EXCEEDED` 알림이 생긴다. 반복 지출이 만든 지출 90,000 만 있으면 알림이 없다(기존 케이스 유지).
- `DashboardControllerTest` 의 `budget-summary` 케이스:
  - 월 예산 1,800,000, 항목 「남편 용돈」(한도 400,000, 카테고리 A)과 「아내 용돈」(한도 400,000, 카테고리 B). 카테고리 A 지출 150,000, B 지출 410,000, 다른 카테고리 620,000, 반복 지출이 만든 지출 50,000.
  - 응답은 `total.spent` 1180000, `total.limit` 1800000, `living.spent` 620000, `living.limit` 1000000, `allocationExceeded` false.
  - 월 예산 500,000 에 위 두 항목이면 `living.limit` 0, `allocationExceeded` true.
  - 월 예산 0 이면 `living.limit` 0, `allocationExceeded` false.

## 검증

```bash
cd backend && ./gradlew test --tests "*DashboardServiceLivingExpenseTest*" --tests "*BudgetAlertServiceIntegrationTest*" --tests "*DashboardControllerTest*" --tests "*DashboardServiceBudgetExclusionTest*" --no-daemon --console=plain
cd backend && ./gradlew qualityCheck test --no-daemon --console=plain
```

둘 다 `BUILD SUCCESSFUL` 이어야 한다. 마이그레이션과 엔티티는 바꾸지 않으므로 `backend/scripts/check-migrations-mysql.sh` 는 필요 없다.

## 변경 파일

| 파일 | 변경 |
|---|---|
| `backend/src/main/java/com/bifos/accountbook/dashboard/domain/repository/DashboardRepository.java` | 수정 |
| `backend/src/main/java/com/bifos/accountbook/dashboard/infra/repository/impl/DashboardRepositoryImpl.java` | 수정 |
| `backend/src/main/java/com/bifos/accountbook/expense/infra/repository/jpa/ExpenseJpaRepository.java` | 수정 |
| `backend/src/main/java/com/bifos/accountbook/dashboard/application/dto/BudgetSummaryLiving.java` | 삭제 |
| `backend/src/main/java/com/bifos/accountbook/dashboard/application/dto/BudgetSummaryAmount.java` | 신규 |
| `backend/src/main/java/com/bifos/accountbook/dashboard/application/dto/BudgetSummaryResponse.java` | 수정 |
| `backend/src/main/java/com/bifos/accountbook/dashboard/application/service/DashboardService.java` | 수정 |
| `backend/src/test/java/com/bifos/accountbook/dashboard/application/service/DashboardServiceLivingExpenseTest.java` | 수정 |
| `backend/src/test/java/com/bifos/accountbook/notification/application/service/BudgetAlertServiceIntegrationTest.java` | 수정 |
| `backend/src/test/java/com/bifos/accountbook/dashboard/presentation/controller/DashboardControllerTest.java` | 수정 |
