# Phase 02. 백엔드: daily-stats 응답에서 memberExpenseTotals 를 지운다

**Execution profile**: fast

## 목표

`GET /api/v1/families/{familyUuid}/dashboard/daily-stats` 응답에서 그 달 등록자별 누적 합계 `memberExpenseTotals` 를 지운다.
phase 01 이후 이 필드를 읽는 곳이 없다.

**범위 외**: 날짜별 등록자 지출 `dailyStats[].memberExpenses` 와 `totalIncome`, `totalExpense` 는 그대로 둔다. 달력 칸과 분석 화면이 쓴다.

## 컨텍스트

- 응답 DTO: `backend/src/main/java/com/bifos/accountbook/dashboard/application/dto/DailyStatsResponse.java` 의 `@Builder.Default private List<MemberAmount> memberExpenseTotals = new ArrayList<>();`
- 서비스: `backend/src/main/java/com/bifos/accountbook/dashboard/application/service/DashboardService.java` 의 `getDailyStats`. 지역 변수 `Map<String, BigDecimal> expenseByMember` 를 만들고, 날짜마다 `memberExpenses.forEach(... expenseByMember.merge(...))` 로 더한 뒤 빌더에서 `.memberExpenseTotals(toMemberAmounts(expenseByMember))` 로 넣는다.
- `toMemberAmounts` 는 `dailyStats[].memberExpenses` 를 만들 때도 쓰므로 지우지 않는다.
- 연동 토큰 허용 경로(`backend/src/main/java/com/bifos/accountbook/config/security/ApiTokenAccessPolicy.java`)에 dashboard 경로가 없어 외부 에이전트는 이 필드를 받지 않는다.

**근거 문서**: `backend/docs/data-schema.md` 의 `daily-stats` 필드 표.

## 의도 메모

- 필드를 남겨 두는 안은 기각했다. 읽는 곳이 없는 응답 필드는 다음 사람이 「어디서 쓰나」 를 매번 찾게 만든다.
- 배포 순서: 운영 중인 이전 프론트엔드는 이 필드를 필수로 검증한다. 프론트엔드 이미지가 이 백엔드보다 늦게 배포되면 그 사이 홈이 오류를 낸다. PR 본문에 「프론트엔드 이미지를 백엔드와 같이 또는 먼저 배포」 를 적는다.

## 작업 항목

### 1. `DailyStatsResponse.java`

- `memberExpenseTotals` 필드와, 그 필드만 쓰던 import(`java.util.ArrayList`)를 지운다.

### 2. `DashboardService.getDailyStats`

- `expenseByMember` 지역 변수, `memberExpenses.forEach(...)` 누적 줄, 빌더의 `.memberExpenseTotals(...)` 를 지운다.
- 더 쓰지 않는 import(`java.util.HashMap` 등)가 생기면 지운다. 다른 메서드가 쓰면 남긴다.

### 3. `backend/src/test/java/com/bifos/accountbook/dashboard/presentation/controller/DashboardControllerTest.java`

- `getDailyStats_MemberExpenseTotals` 테스트의 `$.data.memberExpenseTotals...` 단언 다섯 줄을 지운다. 날짜별 `memberExpenses` 단언은 남긴다.
- 테스트 이름을 `getDailyStats_MemberExpensesByDay` 로, `@DisplayName` 을 「일별 통계는 날짜마다 등록자 순서로 지출을 반환하고 삭제 및 다른 기간과 가족은 제외한다」 로 바꾼다.
- 같은 테스트 끝에 `.andExpect(jsonPath("$.data.memberExpenseTotals").doesNotExist())` 를 더한다.
- 단언을 지우면 같은 테스트의 지역 변수 `earlierMonthlyAmount`, `laterMonthlyAmount` 가 쓰이지 않게 된다. 두 변수와 그 대입을 지운다.
- 다른 두 테스트의 `jsonPath("$.data.memberExpenseTotals").isEmpty()` 단언은 지운다. `getDailyStats_IncomeOnly` 의 `@DisplayName` 에서 「등록자별 지출 합계가 빈 배열이다」 를 날짜별 등록자 지출에 맞는 말로 고친다.

## 검증

`backend/gradle/wrapper/gradle-wrapper.jar` 가 없으면 먼저 `cd backend && mise exec gradle@9.8.0 -- gradle wrapper --gradle-version 9.8.0` 으로 만든다. jar 는 커밋하지 않는다.

```bash
cd backend && ./gradlew test --tests '*DashboardControllerTest'
cd backend && ./gradlew qualityCheck test
```

```bash
# 저장소 루트에서 실행한다. 운영 코드에 남은 참조가 없어야 한다. 테스트에는 doesNotExist 단언 한 곳만 남는다
! git grep -n "memberExpenseTotals" -- backend/src/main
```

## 변경 파일

| 파일 | 변경 |
|---|---|
| `backend/src/main/java/com/bifos/accountbook/dashboard/application/dto/DailyStatsResponse.java` | 수정 |
| `backend/src/main/java/com/bifos/accountbook/dashboard/application/service/DashboardService.java` | 수정 |
| `backend/src/test/java/com/bifos/accountbook/dashboard/presentation/controller/DashboardControllerTest.java` | 수정 |
