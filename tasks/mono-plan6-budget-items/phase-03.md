# Phase 03. 예산 요약 API

**Execution profile**: standard

## 목표

`GET /api/v1/families/{familyUuid}/dashboard/budget-summary` 를 만든다. 달력 홈이 생활비와 예산 항목별 쓴 금액과 한도를 한 번에 받기 위해서다.

**범위 외**: 프론트엔드는 phase 04~06 이다.

## 컨텍스트

모든 경로는 저장소 root 기준이다. 명령은 `backend/` 에서 돌린다. phase 01 의 `budgetitem` 도메인과 phase 02 의 생활비 합계가 있어야 한다.

**근거 문서**: `backend/docs/data-schema.md` 의 「예산 요약과 생활비 합계」 절, `backend/docs/flow.md` 의 「5. 대시보드 조회」 절, `backend/docs/adr/ADR-B25-budget-items.md`.

응답 `BudgetSummaryResponse`:

```json
{
  "year": 2026,
  "month": 10,
  "living": { "spent": 620000, "limit": 1000000 },
  "items": [
    { "budgetItemUuid": "…", "name": "남편 용돈", "limit": 400000, "spent": 150000 }
  ]
}
```

코드에서 확인한 사실:

- 컨트롤러 `backend/src/main/java/com/bifos/accountbook/dashboard/presentation/controller/DashboardController.java`. `year`, `month` 를 필수로 받는 선례는 `getDailyStats`(`@RequestParam Integer year`, `@RequestParam Integer month`)다.
- 서비스 `backend/src/main/java/com/bifos/accountbook/dashboard/application/service/DashboardService.java`. `getMonthlyStats` 가 `familyRepository.findByUuid(familyUuid)` 로 가족을 읽고 `family.getMonthlyBudget()` 이 null 이면 0 으로 본다. 없으면 `ErrorCode.FAMILY_NOT_FOUND`.
- 생활비 합계는 `DashboardRepository.getMonthlyExpenseAmount(familyUuid, year, month)` 다(phase 02 에서 규칙을 바꿨다).
- 월 조건의 선례는 `DashboardRepositoryImpl.getMonthlyExpenseAmount` 의 `expense.date.year().eq(year)`, `expense.date.month().eq(month)` 다.
- DTO 선례는 `backend/src/main/java/com/bifos/accountbook/dashboard/application/dto/MonthlyStatsResponse.java`(`@Getter`, `@Builder`, `@NoArgsConstructor`, `@AllArgsConstructor`)다.
- `DashboardService` 는 read model 이라 다른 도메인의 Repository 를 직접 참조한다(`backend/docs/code-architecture.md` 의 「서비스 간 의존성 상세」).

## 의도 메모

- 항목 합계 규칙: 그 달, 그 가족의 ACTIVE 지출 가운데 카테고리가 그 항목에 속하고 `expense.excludeFromBudget = false` 인 것. 카테고리의 예산 제외 표시와 `recurringExpenseUuid` 는 보지 않는다(ADR-B25).
- 항목마다 쿼리를 돌리지 않는다. 한 쿼리에서 `budget_item_categories` 와 조인해 `budget_item_uuid` 로 묶어 합계를 받고, 지출이 없는 항목은 서비스에서 0 으로 채운다.
- 항목 순서는 `BudgetItemRepository` 의 ACTIVE 목록 순서(`id` 오름차순)를 따른다.
- `year`, `month` 는 필수다. 기본값을 두지 않는다. 달력이 항상 보고 있는 달을 넘긴다.

## 작업 항목

### 1. 저장소 쿼리

`DashboardRepository` 와 `DashboardRepositoryImpl` 에 `Map<String, BigDecimal> getMonthlyExpenseAmountsByBudgetItem(CustomUuid familyUuid, int year, int month)` 를 더한다. 키는 예산 항목 uuid 값이다.

### 2. DTO

`backend/src/main/java/com/bifos/accountbook/dashboard/application/dto/` 에 `BudgetSummaryResponse`(`year`, `month`, `living`, `items`), `BudgetSummaryLiving`(`spent`, `limit`), `BudgetSummaryItem`(`budgetItemUuid`, `name`, `limit`, `spent`)을 만든다. 금액은 `BigDecimal` 이다.

### 3. 서비스와 컨트롤러

- `DashboardService.getBudgetSummary(@UserUuid CustomUuid userUuid, @FamilyUuid CustomUuid familyUuid, int year, int month)`. `@ValidateFamilyAccess`.
- `DashboardController` 에 `@GetMapping("/budget-summary")`.

### 4. 이 phase 를 검증하는 테스트

- `backend/src/test/java/com/bifos/accountbook/dashboard/presentation/controller/DashboardControllerTest.java` 에 케이스를 더한다.
  - 정상: 월 예산 1,000,000 인 가족에 항목 「남편 용돈」(한도 400,000, 카테고리 A)을 만들고, 그 달에 카테고리 A 지출 150,000, 다른 카테고리 지출 620,000, 반복 지출이 만든 지출 50,000 을 넣는다. 응답은 `living.spent` 620000, `living.limit` 1000000, `items[0].spent` 150000, `items[0].limit` 400000 이다.
  - 빈 상태: 항목이 없고 월 예산이 0 이면 `items` 는 빈 배열이고 `living.limit` 은 0 이다.
  - 지출에 예산 제외 표시가 있으면 항목 합계에서 빠진다.
  - 실패: `year` 나 `month` 가 없으면 400 이다.
- `backend/src/test/java/com/bifos/accountbook/contract/OpenApiSnapshotTest.java` 에 `/api/v1/families/{familyUuid}/dashboard/budget-summary` 단언을 더한다.

## 검증

```bash
cd backend && ./gradlew test --tests "*DashboardControllerTest*" --tests "*OpenApiSnapshotTest*" --no-daemon --console=plain
cd backend && ./gradlew qualityCheck test --no-daemon --console=plain
```

둘 다 `BUILD SUCCESSFUL` 이어야 한다.

## 변경 파일

| 파일 | 변경 |
|---|---|
| `backend/src/main/java/com/bifos/accountbook/dashboard/domain/repository/DashboardRepository.java` | 수정 |
| `backend/src/main/java/com/bifos/accountbook/dashboard/infra/repository/impl/DashboardRepositoryImpl.java` | 수정 |
| `backend/src/main/java/com/bifos/accountbook/dashboard/application/dto/BudgetSummaryResponse.java` | 신규 |
| `backend/src/main/java/com/bifos/accountbook/dashboard/application/dto/BudgetSummaryLiving.java` | 신규 |
| `backend/src/main/java/com/bifos/accountbook/dashboard/application/dto/BudgetSummaryItem.java` | 신규 |
| `backend/src/main/java/com/bifos/accountbook/dashboard/application/service/DashboardService.java` | 수정 |
| `backend/src/main/java/com/bifos/accountbook/dashboard/presentation/controller/DashboardController.java` | 수정 |
| `backend/src/test/java/com/bifos/accountbook/dashboard/presentation/controller/DashboardControllerTest.java` | 수정 |
| `backend/src/test/java/com/bifos/accountbook/contract/OpenApiSnapshotTest.java` | 수정 |
