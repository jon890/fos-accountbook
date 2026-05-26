# Phase 01: monthly-trend endpoint

## 목표

`GET /families/{familyUuid}/dashboard/stats/monthly-trend?from=YYYY-MM&to=YYYY-MM` endpoint를 추가한다.
단일 GROUP BY 쿼리로 N개월 지출 합계를 집계한다.

## 배경

- 프론트엔드 plan006 (analytics 리디자인)에서 6~12개월 지출 추이 시각화 필요
- 기존 dashboard 도메인에 이미 월별 통계 패턴 존재 (`getMonthlyExpenseAmount`)
- 기존 패턴처럼 QueryDSL 사용. `exclude_from_budget` 플래그는 이 쿼리에서 제외 조건 아님 (전체 지출 추이)

## 작업 항목

1. **DTO 생성**
   - `MonthlyTrendPoint`: `year` (int), `month` (int), `totalExpense` (BigDecimal)
   - `MonthlyTrendResponse`: `points` (List<MonthlyTrendPoint>), `average` (BigDecimal)
     - points가 비어있으면 `average`는 `BigDecimal.ZERO`로 설정 (0 나누기 방어)
   - 위치: `dashboard/application/dto/`

2. **DashboardRepository에 메서드 추가**
   - 인터페이스: `List<MonthlyTrendPoint> getMonthlyExpenseTrend(CustomUuid familyUuid, LocalDateTime from, LocalDateTime to)`
   - 위치: `dashboard/domain/repository/DashboardRepository.java`

3. **DashboardRepositoryImpl에 QueryDSL 구현**
   - `SELECT YEAR(e.date), MONTH(e.date), SUM(e.amount) FROM Expense e WHERE e.familyUuid = :familyUuid AND e.status = ACTIVE AND e.date BETWEEN :from AND :to GROUP BY YEAR(e.date), MONTH(e.date) ORDER BY YEAR(e.date), MONTH(e.date)`
   - 위치: `dashboard/infra/repository/impl/DashboardRepositoryImpl.java`
   - 기존 `getMonthlyExpenseAmount` QueryDSL 패턴 참조

4. **DashboardService에 메서드 추가**
   - `getMonthlyTrend(userUuid, familyUuid, fromYearMonth, toYearMonth)`
   - from/to 파라미터를 LocalDateTime으로 변환
   - points 평균 계산
   - `@ValidateFamilyAccess` 적용

5. **DashboardController에 endpoint 추가**
   - 전체 URL: `GET /api/v1/families/{familyUuid}/dashboard/stats/monthly-trend`
   - Controller 클래스 레벨 `@RequestMapping("/api/v1/families/{familyUuid}/dashboard")` 에 `@GetMapping("/stats/monthly-trend")` 추가
   - `@RequestParam String from, @RequestParam String to` (YYYY-MM 형식)
   - 입력 검증: `YearMonth.parse()` 파싱 실패 시 400 Bad Request, `from > to` 역순 시 400 반환

## 검증 기준

- endpoint 호출 시 정상 응답
- 데이터 없는 월은 points에서 제외 (0으로 채우지 않음)
- average는 points에 있는 월들의 평균
