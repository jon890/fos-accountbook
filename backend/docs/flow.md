# User Flow — fos-accountbook-backend

> 핵심 사용자 시나리오별 흐름. API 엔드포인트 목록은 `data-schema.md` 참고.

---

## 1. 온보딩 (최초 가입)

```
소셜 로그인 (Google/Naver)
    │
    ▼
POST /auth/social-login → JWT 발급
    │
    ▼
POST /families → 가족 생성
    │  └─ 기본 카테고리 10개 자동 생성 (미분류, 식비, 교통 등)
    │  └─ UserProfile.defaultFamilyUuid 자동 설정
    │
    ▼
가족 초대 링크 공유 (선택)
    │
    ├─ POST /invitations/families/{uuid} → 초대 링크 생성
    └─ 구성원이 GET /invitations/token/{token} → POST /invitations/accept
```

## 2. 지출 등록 ~ 예산 알림

```
POST /families/{familyUuid}/expenses
    │  body: { categoryUuid, amount, description, date }
    │
    ▼
ExpenseService.create()
    ├─ 카테고리 유효성 검증 (캐시)
    ├─ Expense 엔티티 저장
    └─ ExpenseCreatedEvent 발행
            │
            ▼  (트랜잭션 커밋 후, 비동기)
        BudgetAlertEventListener
            ├─ 월 예산 대비 지출 비율 계산
            ├─ 50% / 80% / 100% 초과 시 Notification 생성
            └─ 실패해도 지출 저장에 영향 없음
```

## 3. 반복 지출 자동 생성

```
사용자: POST /families/{familyUuid}/recurring-expenses
    │  body: { name, categoryUuid, amount, dayOfMonth }
    │
    ▼
RecurringExpense 템플릿 저장 (status=ACTIVE)

        ┌──────────────────────────────┐
        │  매일 새벽 1시 (스케줄러)       │
        │  RecurringExpenseScheduler    │
        └──────────┬───────────────────┘
                   │
                   ▼
        오늘 dayOfMonth인 ACTIVE 템플릿 조회
                   │
                   ▼  (각 템플릿마다)
        (recurring_expense_uuid, year_month) 중복 체크
                   │
            ┌──────┴──────┐
            │ 미생성       │ 이미 존재
            ▼             ▼
        Expense 생성   log.warn → skip
            │
            ▼
        RecurringExpenseCreatedEvent 발행
            │
            ▼
        Notification 생성 (RECURRING_EXPENSE_CREATED)
```

## 4. 카테고리 삭제 시 연쇄 처리

```
DELETE /families/{familyUuid}/categories/{categoryUuid}
    │
    ▼
CategoryService.deleteCategory()
    ├─ 기본 카테고리 여부 체크 (is_default=true → 삭제 불가)
    ├─ 기본 카테고리 조회 (이동 대상)
    ├─ ExpenseService.moveExpensesToDefaultCategory()
    ├─ RecurringExpenseService.moveRecurringExpensesToDefaultCategory()
    └─ Category status → DELETED + 캐시 무효화
```

## 5. 대시보드 조회

```
GET /families/{familyUuid}/dashboard/stats/monthly?yearMonth=2026-04
    │
    ▼
DashboardService.getMonthlyStats()
    ├─ 해당 월 총 지출 (exclude_from_budget 제외)
    ├─ 해당 월 총 수입
    ├─ 월 예산 대비 비율
    └─ 가족 멤버 수
```

## 6. 인증 갱신

```
Access Token 만료 (15분)
    │
    ▼
POST /auth/refresh  body: { refreshToken }
    │
    ├─ Refresh Token 유효 → 새 Access + Refresh Token 발급
    └─ Refresh Token 만료 (7일) → 401 → 재로그인 필요
```

---

## 도메인 간 이벤트 흐름 요약

| 이벤트                         | 발행자    | 구독자       | 트리거             |
| ------------------------------ | --------- | ------------ | ------------------ |
| `ExpenseCreatedEvent`          | expense   | notification | 지출 등록          |
| `ExpenseUpdatedEvent`          | expense   | notification | 지출 수정          |
| `RecurringExpenseCreatedEvent` | recurring | notification | 스케줄러 자동 생성 |

동기 호출 (향후 이벤트 전환 후보):

- `family → category`: 가족 생성 시 기본 카테고리 생성
- `category → expense/recurring`: 카테고리 삭제 시 기본 카테고리로 이동 (income은 미구현)
- `family → user`: 가족 생성 시 기본 가족 설정
