# Phase 02: category-breakdown endpoint

## 목표

`GET /families/{familyUuid}/dashboard/stats/category-breakdown?year=Y&month=M&compareWithPrev=true` endpoint를 추가한다.
카테고리별 지출 분포 + 전월 대비 변동률(delta)를 제공한다.

## 배경

- 기존 `getCategoryExpenseStats`가 카테고리별 집계 패턴을 이미 제공
- delta 계산: 현재 월과 전월을 각각 조회 → 카테고리별 비교
- `exclude_from_budget` 플래그는 이 쿼리에서 제외 조건 아님 (전체 지출 분포)

## 작업 항목

1. **DTO 생성**
   - `CategoryBreakdownItem`: `categoryUuid`, `name`, `icon`, `color` (String), `totalAmount` (BigDecimal), `percentage` (Double), `deltaPercent` (Double, nullable)
   - `CategoryBreakdownResponse`: `year`, `month` (int), `totalExpense` (BigDecimal), `items` (List<CategoryBreakdownItem>)
   - 위치: `dashboard/application/dto/`

2. **DashboardService에 메서드 추가**
   - `getCategoryBreakdown(userUuid, familyUuid, year, month, compareWithPrev)`
   - **기존 `getCategoryExpenseStats(familyUuid, null, startOfMonth, endOfMonth)` 재활용** — 별도 Repository 메서드 불필요
     - `startOfMonth = YearMonth.of(year, month).atDay(1).atStartOfDay()`
     - `endOfMonth = YearMonth.of(year, month).atEndOfMonth().atTime(23, 59, 59)`
   - `compareWithPrev=true`이면 전월 데이터도 조회하여 delta 계산
     - 전월 계산: `YearMonth.of(year, month).minusMonths(1)` 사용 (month=1일 때 전년도 12월 자동 처리)
   - delta = ((현재월 금액 - 전월 금액) / 전월 금액) * 100
   - 전월 해당 카테고리 지출이 0이면 deltaPercent는 null
   - `totalExpense=0`이면 모든 항목의 `percentage`를 0으로 설정 (0 나누기 방어)
   - `@ValidateFamilyAccess` 적용

3. **DashboardController에 endpoint 추가**
   - 전체 URL: `GET /api/v1/families/{familyUuid}/dashboard/stats/category-breakdown`
   - Controller 클래스 레벨 `@RequestMapping("/api/v1/families/{familyUuid}/dashboard")` 에 `@GetMapping("/stats/category-breakdown")` 추가
   - `@RequestParam Integer year, @RequestParam Integer month, @RequestParam(defaultValue = "false") boolean compareWithPrev`

## 검증 기준

- 카테고리별 percentage 합계가 약 100%
- compareWithPrev=false이면 deltaPercent가 모두 null
- compareWithPrev=true이면 전월 대비 delta가 계산됨
