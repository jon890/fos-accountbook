# Phase 03. 분석과 대시보드 응답 스키마

**Execution profile**: fast
**Domain**: server-action

## 목표

분석과 대시보드 서비스의 응답이 스키마로 검증된다. 실패를 빈 값으로 대체하던 곳은 대체를 유지하되 검증 오류를 로그에 남긴다.

**범위 외**: 다른 도메인은 phase 02, 04 다.

## 컨텍스트

모든 경로는 저장소 root 기준이다. 명령은 `frontend/` 에서 돌린다.

**근거 문서**: `frontend/docs/adr/ADR-F42-service-response-validation.md`, `frontend/docs/data-schema.md`(응답 형태), phase 01 이 만든 `frontend/src/lib/schemas/responses/common.ts`.

코드에서 확인한 사실:

- `frontend/src/services/analytics/analytics-service.ts`: 지역 타입 `TrendResponse`(18행), `BreakdownResponse`(23행). 83, 111, 121행 호출. 39행 `emptyOnFailure` 는 401 만 다시 던지고 나머지는 빈 값으로 대체한다.
- `frontend/src/services/dashboard/dashboard-service.ts`: 35행(일별), 67행(`CategoryBreakdownResponse`, 지역 47행), 96행(`PaginationResponse<ExpenseResponse>`). 83-89행이 분류 실패를 빈 값으로 대체한다.
- 분석의 `BreakdownResponse` 와 대시보드의 `CategoryBreakdownResponse` 는 같은 엔드포인트(`category-breakdown`)를 따로 적은 사본이다. `previousAmount` 필드가 있다(#362).

## 의도 메모

- 스키마는 `z.object` 기본(모르는 필드는 버림)으로 쓴다. `.strict()` 를 쓰지 않는다.
- null 이 올 수 있는 필드는 실제 백엔드 DTO(`backend/src/main/java/**/dto/*Response*.java`, `*Item.java`)를 읽어 `.nullable()` 이나 `.optional()` 을 정한다. 기억으로 정하지 않는다. 백엔드는 null 필드를 JSON 에서 생략하므로 null 가능 필드는 `.nullish()` 로 둔다.
- `src/types/**` 의 기존 타입은 지우지 않는다. 스키마 파일에 `const _check: z.ZodType<기존타입> = 스키마;` 같은 컴파일 시점 대조를 둬 어긋나면 `tsc` 가 실패하게 한다. 서비스 안에만 있던 지역 타입은 `z.infer` 로 바꾼다.
- 서비스 호출에 `{ schema }` 를 넘긴다. 반환 타입은 바꾸지 않는다.
- `category-breakdown` 과 `monthly-trend` 스키마는 `frontend/src/lib/schemas/responses/dashboard.ts`(신규) 하나에 두고 두 서비스가 함께 쓴다. 두 지역 타입은 `z.infer` 로 바꾼다.
- `emptyOnFailure` 와 대시보드 대체 코드는 `ResponseValidationError` 면 `console.error` 를 남긴 뒤 대체한다(phase 01 래퍼가 이미 한 줄 남기므로 중복이면 생략해도 된다. 대체 때문에 로그가 사라지지 않는 것만 지킨다).

## 작업 항목

### 1. `dashboard.ts` 스키마(신규)

### 2. 분석, 대시보드 서비스 연결과 지역 타입 정리

### 3. 테스트

- `frontend/src/__tests__/services/analytics/analytics-service.test.ts`(수정), `frontend/src/__tests__/services/dashboard/getMonthlyCategoryBreakdown.test.ts`(수정): 필드가 빠진 응답이면 빈 값으로 대체되고 오류가 로그에 남는다.

## 검증

`frontend/` 에서 실행한다.

```bash
pnpm tsc --noEmit && pnpm lint && pnpm lint:md && pnpm test
pnpm test src/__tests__/services/analytics/analytics-service.test.ts src/__tests__/services/dashboard/getMonthlyCategoryBreakdown.test.ts
```

기대값: 모든 명령이 성공한다.

## 변경 파일

| 파일 | 변경 |
|---|---|
| `frontend/src/lib/schemas/responses/dashboard.ts` | 신규 |
| `frontend/src/services/analytics/analytics-service.ts` | 수정 |
| `frontend/src/services/dashboard/dashboard-service.ts` | 수정 |
| `frontend/src/__tests__/services/analytics/analytics-service.test.ts` | 수정 |
| `frontend/src/__tests__/services/dashboard/getMonthlyCategoryBreakdown.test.ts` | 수정 |
