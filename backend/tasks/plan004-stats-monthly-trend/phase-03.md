# Phase 03: 통합 테스트 작성

## 목표

monthly-trend + category-breakdown endpoint에 대한 Controller 통합 테스트를 작성한다.

## 작업 항목

1. **DashboardController 테스트에 monthly-trend 테스트 추가**
   - AbstractControllerTest 상속
   - fixtures로 3개월 분량 지출 데이터 생성
   - `GET /families/{familyUuid}/dashboard/stats/monthly-trend?from=YYYY-MM&to=YYYY-MM` 호출
   - points 개수, totalExpense 값, average 검증

2. **DashboardController 테스트에 category-breakdown 테스트 추가**
   - 2개 이상 카테고리에 지출 데이터 생성
   - `compareWithPrev=false`: deltaPercent가 null인지 검증
   - `compareWithPrev=true`: 전월 데이터도 생성 후 delta 값 검증

3. **엣지 케이스 테스트**
   - 데이터 없는 기간 조회 시 빈 points / items 반환
   - 전체 테스트 실행: `./gradlew test --no-daemon --console=plain`

## 검증 기준

- 신규 테스트 + 기존 테스트 모두 통과
