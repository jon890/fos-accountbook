# Phase 01. 등록자 응답 필드와 등록자별 일별 지출 합계

**Execution profile**: standard

## 목표

두 가지를 백엔드 응답에 더한다. 기존 필드는 이름, 타입, 의미를 바꾸지 않는다.

1. 지출과 수입 응답에 등록자 `userUuid` 를 담는다.
2. `GET /families/{familyUuid}/dashboard/daily-stats` 에 날짜별 `memberExpenses` 와 월 `memberExpenseTotals` 를 더한다.

**범위 외**: 프론트엔드 변경은 다른 계획(달력 홈)이 맡는다. 이 PR 은 프론트보다 먼저 머지되며, 필드를 더하기만 하므로 지금 프론트가 깨지지 않아야 한다. 수정·삭제 권한은 바꾸지 않는다(가족 구성원이면 누구나 수정·삭제).

## 컨텍스트

- 엔티티는 이미 등록자를 저장한다. `expense/domain/entity/Expense.java` 와 `income/domain/entity/Income.java` 의 `CustomUuid userUuid` (컬럼 `user_uuid`, NOT NULL).
- 응답 DTO: `expense/application/dto/ExpenseResponse.java`, `income/application/dto/IncomeResponse.java`. 각각 `from(entity, category)` 와 `fromWithoutCategory(entity)` 두 팩토리가 있다. 둘 다 고친다.
- 일별 통계 흐름: `dashboard/presentation/controller/DashboardController.java` 의 `getDailyStats` → `dashboard/application/service/DashboardService.java` 의 `getDailyStats` → `dashboard/domain/repository/DashboardRepository.java` 의 `getDailyExpenseAmounts`, `getDailyIncomeAmounts` → 구현 `dashboard/infra/repository/impl/DashboardRepositoryImpl.java` (QueryDSL, `expense.date.dayOfMonth()` 로 그룹).
- 응답 DTO: `dashboard/application/dto/DailyStatsResponse.java`, `DailyStat.java` (Lombok `@Builder`, `@Getter`).
- 테스트 선례: `src/test/java/com/bifos/accountbook/dashboard/presentation/controller/DashboardControllerTest.java` 의 `getDailyStats_*`, `src/test/java/com/bifos/accountbook/dashboard/infra/repository/DashboardRepositoryTest.java`.

**근거 문서**: `backend/docs/data-schema.md` 의 「응답에 담는 등록자」, `backend/docs/adr.md` 의 ADR-B16(패키지 배치)

## 의도 메모

- 이름과 사진은 응답에 넣지 않는다. 목록 항목마다 사용자를 조회하면 요청마다 조회가 늘어난다. 프론트는 가족 구성원 목록을 이미 받는다.
- 등록자별 지출 합계는 쿼리 하나로 구한다. 일별 지출 쿼리를 `(dayOfMonth, userUuid)` 로 그룹하고, 날짜 합계는 그 결과를 더해 만든다. 같은 달 지출을 두 번 읽지 않기 위해서다.
- 기존 `getDailyExpenseAmounts` 를 다른 곳이 쓰지 않으면 새 메서드로 바꾸고 지운다. 쓰는 곳이 있으면 남긴다.
- 정렬은 `userUuid` 문자열 오름차순이다. 응답 순서가 요청마다 바뀌지 않게 하기 위해서다.
- 등록자별 수입 합계는 넣지 않는다(`data-schema.md` 에 이유).

## 작업 항목

### 1. `ExpenseResponse`, `IncomeResponse` — `userUuid` 추가

- 필드 `private String userUuid;` 를 `familyUuid` 다음에 둔다.
- 두 팩토리에서 `.userUuid(entity.getUserUuid().getValue())` 를 채운다.

### 2. `dashboard/application/dto` — 등록자별 합계 DTO

- 새 DTO `MemberAmount` (`String userUuid`, `BigDecimal amount`), 같은 패키지, 기존 DTO 와 같은 Lombok 구성.
- `DailyStat` 에 `@Builder.Default private List<MemberAmount> memberExpenses = new ArrayList<>();`
- `DailyStatsResponse` 에 `@Builder.Default private List<MemberAmount> memberExpenseTotals = new ArrayList<>();`

### 3. `DashboardRepository`, `DashboardRepositoryImpl` — 날짜·등록자별 지출 조회

- 새 메서드 `Map<Integer, Map<String, BigDecimal>> getDailyExpenseAmountsByMember(CustomUuid familyUuid, int year, int month)`.
- 조건은 기존 `getDailyExpenseAmounts` 와 같다(가족, `ExpenseStatus.ACTIVE`, 연, 월). `groupBy(expense.date.dayOfMonth(), expense.userUuid)`.
- `userUuid` 는 `CustomUuid` 라 `getValue()` 로 문자열 키를 만든다.

### 4. `DashboardService.getDailyStats` — 조립

- 새 메서드로 날짜별·등록자별 지출을 받아 날짜 합계(`expense`)를 더해 만든다. 수입은 기존 `getDailyIncomeAmounts` 그대로.
- 날짜마다 `memberExpenses` 를 `userUuid` 오름차순으로 채운다. 월 `memberExpenseTotals` 는 등록자별로 모든 날을 더해 같은 순서로 채운다.
- 기존 `totalIncome`, `totalExpense`, 날짜 오름차순 정렬은 그대로 둔다.

### 5. 테스트

- `DashboardControllerTest`: 두 사용자가 같은 날과 다른 날에 지출을 등록한 데이터로 `daily-stats` 를 부른다.
  - 같은 날 `memberExpenses` 가 두 항목이고 `userUuid` 오름차순이며 합이 `expense` 와 같다
  - `memberExpenseTotals` 가 사용자별 월 합계다
  - 삭제된 지출은 두 필드 모두에서 빠진다
  - 거래가 없는 달이면 `memberExpenseTotals` 가 빈 배열이다
- 지출과 수입 조회 API 테스트(`ExpenseControllerTest` 또는 `ExpenseServiceIntegrationTest`, `IncomeControllerTest`)에 응답 `userUuid` 가 등록한 사용자 uuid 와 같은지 확인하는 단언을 더한다.

## 검증

```bash
# cwd: <repo root>
cd backend && ./gradlew checkstyleMain checkstyleTest test
```

`gradle-wrapper.jar` 가 없으면 먼저 루트 `CLAUDE.md` 의 안내대로 만든다. jar 는 커밋하지 않는다.

마지막으로 `tasks/be-plan001-member-daily-stats/index.json` 의 `status` 와 phase `status` 를 `completed` 로 바꾼다.

## Critical Files

| 파일 | 변경 |
|---|---|
| `backend/src/main/java/com/bifos/accountbook/expense/application/dto/ExpenseResponse.java` | 수정 |
| `backend/src/main/java/com/bifos/accountbook/income/application/dto/IncomeResponse.java` | 수정 |
| `backend/src/main/java/com/bifos/accountbook/dashboard/application/dto/MemberAmount.java` | 신규 |
| `backend/src/main/java/com/bifos/accountbook/dashboard/application/dto/DailyStat.java` | 수정 |
| `backend/src/main/java/com/bifos/accountbook/dashboard/application/dto/DailyStatsResponse.java` | 수정 |
| `backend/src/main/java/com/bifos/accountbook/dashboard/domain/repository/DashboardRepository.java` | 수정 |
| `backend/src/main/java/com/bifos/accountbook/dashboard/infra/repository/impl/DashboardRepositoryImpl.java` | 수정 |
| `backend/src/main/java/com/bifos/accountbook/dashboard/application/service/DashboardService.java` | 수정 |
| `backend/src/test/java/com/bifos/accountbook/dashboard/presentation/controller/DashboardControllerTest.java` | 수정 |
| `backend/src/test/java/com/bifos/accountbook/expense/...`, `income/presentation/controller/IncomeControllerTest.java` | 수정 |
