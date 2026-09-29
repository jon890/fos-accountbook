# 📅 캘린더/대시보드 API 명세 (요청)

현재 프론트엔드에서 대시보드 캘린더 뷰를 구현하기 위해 **일별 거래 내역을 집계**하고 있습니다.
지금은 **지출/수입 목록 조회 API**를 호출하여 클라이언트에서 일별로 합산하고 있으나, 데이터가 많아질 경우 성능 이슈가 발생할 수 있습니다.

따라서 백엔드에서 **월별 일일 요약 데이터**를 제공해주는 전용 API를 요청합니다.

## ✅ 필요한 API

### 1. 월별 일일 수입/지출 요약 조회

특정 연도/월의 일별 수입 및 지출 합계 데이터를 반환합니다.

- **Endpoint**: `GET /api/v1/families/{familyUuid}/dashboard/daily-stats`
- **Query Params**:
  - `year` (Integer, 필수): 조회할 연도 (예: 2024)
  - `month` (Integer, 필수): 조회할 월 (예: 1)

#### Response Example

```json
{
  "success": true,
  "data": {
    "year": 2024,
    "month": 1,
    "dailyStats": [
      {
        "date": "2024-01-01",
        "income": 0,
        "expense": 50000
      },
      {
        "date": "2024-01-02",
        "income": 3000000,
        "expense": 15000
      }
      // ... 거래가 있는 날짜만 포함하거나, 해당 월의 모든 날짜 포함
    ],
    "totalIncome": 3000000,
    "totalExpense": 65000
  }
}
```

---

## 📝 구현 제안 (Backend)

1.  **DashboardController**에 해당 엔드포인트 추가
2.  **DashboardService**에서 `QueryDSL`을 사용하여 일별 그룹핑 집계 (`GROUP BY day(date)`)
    - 지출(`Expense`) 테이블 집계
    - 수입(`Income`) 테이블 집계
    - 두 결과를 날짜 기준으로 병합

이 API가 구현되면 프론트엔드에서는 1000개의 데이터를 가져와 루프를 돌 필요 없이, 한 번의 가벼운 요청으로 캘린더를 렌더링할 수 있습니다.
