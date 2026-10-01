# Phase 01. 카테고리 월 분포가 다음 달 1일 00:00 지출을 더하지 않게 한다

**Execution profile**: fast

## 목표

`GET /api/v1/families/{familyUuid}/dashboard/stats/category-breakdown` 의 월 합계와 전월 대비 변동률이 그 달의 지출만 센다. 지금은 다음 달 1일 00:00:00 지출을 이번 달에도 더한다.

**범위 외**: 시간대는 phase 02 다. `deltaPercent` 의 null 의미(#362)와 응답 필드 추가는 이 plan 밖이다. 사용자가 기간을 넘기는 다른 조회(`getCategoryExpenseSummary`)의 끝 날짜 포함 규칙은 바꾸지 않는다.

## 컨텍스트

모든 경로는 저장소 root 기준이다. 명령은 `backend/` 에서 돌린다.

**근거 문서**: `backend/docs/flow.md` 의 「5. 대시보드 조회」 절(월 범위는 반열린 구간).

코드에서 확인한 사실:

- `backend/src/main/java/com/bifos/accountbook/dashboard/application/service/DashboardService.java` 의 `getCategoryBreakdown(...)` 이 이번 달을 `startOfMonth`, `startOfNextMonth`(다음 달 1일 00:00)로, 전월을 `prevStart`, `prevStartOfNext` 로 정해 `dashboardRepository.getCategoryExpenseStats(familyUuid, null, start, end)` 에 넘긴다.
- `backend/src/main/java/com/bifos/accountbook/dashboard/infra/repository/impl/DashboardRepositoryImpl.java` 의 `getCategoryExpenseStats` 는 끝 날짜를 `dateLoe`(`expense.date.loe(endDate)`, 이하)로 거른다. 그래서 다음 달 1일 00:00 지출이 들어간다.
- 같은 `getCategoryExpenseStats` 를 `DashboardService.getCategoryExpenseSummary` 도 쓴다. 이 호출은 사용자가 준 `endDate` 를 포함하는 의미라 이하 조건이 맞다.
- 반복 지출과 UI 입력 지출은 그날 00:00 으로 저장된다. 그래서 다음 달 1일 지출이 실제로 경계에 걸린다.
- 테스트: `backend/src/test/java/com/bifos/accountbook/dashboard/infra/repository/DashboardRepositoryTest.java`(QueryDSL 통합), `backend/src/test/java/com/bifos/accountbook/dashboard/presentation/controller/DashboardControllerTest.java`.

## 의도 메모

- `dateLoe` 를 전부 미만으로 바꾸지 않는다. 사용자 기간 조회의 의미가 바뀐다.
- repository 에 `getCategoryExpenseStatsBefore` 메서드를 추가한다. 기존 집계 쿼리를 공유하되 이 메서드만 `lt(endDate)`를 적용한다. 기존 `getCategoryExpenseStats`는 `loe(endDate)`를 유지한다. 서비스의 이번 달과 전월 분포는 새 메서드를 호출한다.

## 작업 항목

### 1. 월 분포 조회를 반열린 구간 `[이번 달 1일 00:00, 다음 달 1일 00:00)` 으로 바꾸기

- 이번 달과 전월 조회 모두 같은 규칙이다.

### 2. 이 phase 를 검증하는 테스트

- `DashboardControllerTest` 나 서비스 통합 테스트에 케이스를 더한다: 3월 31일 23:59 지출과 4월 1일 00:00 지출을 만들고 2026-03 분포를 조회하면 3월 31일 지출만 합계에 들어간다. 4월 분포를 `compareWithPrev=true` 로 조회하면 전월 금액에 4월 1일 지출이 들어가지 않는다.
- 사용자 기간 조회에서 `expense.date == endDate`인 지출이 포함되는 회귀 테스트를 추가한다. 기존 `getCategoryExpenseSummary` 의 끝 날짜 포함 동작은 그대로다.

## 검증

`backend/` 에서 실행한다. `gradle/wrapper/gradle-wrapper.jar` 가 없으면 먼저 `mise exec gradle@9.8.0 -- gradle wrapper --gradle-version 9.8.0` 을 돌린다. jar 는 커밋하지 않는다.

```bash
./gradlew test --tests "com.bifos.accountbook.dashboard.*" --no-daemon
./gradlew checkstyleMain checkstyleTest test --no-daemon
```

기대값: 두 명령 모두 BUILD SUCCESSFUL.

## 변경 파일

| 파일 | 변경 |
|---|---|
| `backend/src/main/java/com/bifos/accountbook/dashboard/application/service/DashboardService.java` | 수정 |
| `backend/src/main/java/com/bifos/accountbook/dashboard/infra/repository/impl/DashboardRepositoryImpl.java` | 수정 |
| `backend/src/main/java/com/bifos/accountbook/dashboard/domain/repository/DashboardRepository.java` | 수정 |
| `backend/src/test/java/com/bifos/accountbook/dashboard/presentation/controller/DashboardControllerTest.java` | 수정 |
