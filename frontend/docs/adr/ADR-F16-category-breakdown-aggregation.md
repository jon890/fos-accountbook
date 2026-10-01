# ADR-F16: 카테고리 월 분포는 Server Action 측 집계

- **status**: `superseded`
- **대체된 부분**: 결정 전체. 월 합계는 [ADR-F30](ADR-F30-backend-monthly-aggregation.md) 에 따라 백엔드 집계 API 로 받는다. 아래는 2026-05 당시의 맥락이다.
- **결정**: 대시보드의 카테고리별 월 합계는 backend 신규 endpoint 없이 기존 `GET /expenses?month=YYYY-MM` 응답을 `services/dashboard/dashboard-service.ts` 의 `getMonthlyCategoryBreakdown(familyUuid, year, month)` 에서 집계한다.
- **맥락**: handoff dashboard 의 "카테고리 분포" 가 핵심 강조 요소. backend 에 신규 endpoint 신설 시 frontend plan002 이 backend 일정에 묶임. 1가구 월 거래 100~300건 추정 → 응답 사이즈 50~150KB 수준, Server Action 집계로 충분.
- **대안 기각**:
  - backend 신규 endpoint (`GET /families/{u}/stats/category-breakdown`): 가장 깔끔하나 frontend 가 backend 일정 의존. 추후 row 수 임계 초과 시 plan 분리해 재검토.
  - 기존 `getDashboardStats` 응답에 카테고리 합계 끼워넣기: stats DTO 비대해지고 다른 호출처가 불필요 데이터 수신.
- **임계 트리거** (재논의 조건): 가구당 월 평균 거래수 500건 초과 또는 dashboard 진입 TTI 700ms 초과 측정 시 backend endpoint 분리 검토.
- **적용 범위**: `services/dashboard/dashboard-service.ts`, `actions/dashboard/get-monthly-category-breakdown-action.ts`, `services/analytics/analytics-service.ts` (plan006 — `getMonthlyCategoryBreakdown` 을 service→service 재사용해 월별 추이/전월 delta 클라 집계. endpoint 분리 트랙은 옛 백엔드 저장소의 issue #126 에서 다뤘다. 닫힌 이슈였고 저장소를 지워 링크는 없다).


