# Phase 03. 분석과 대시보드 응답 스키마

**Execution profile**: standard
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
- 분석의 `BreakdownResponse` 와 대시보드의 `CategoryBreakdownResponse` 는 같은 엔드포인트(`category-breakdown`)를 따로 적은 사본이다. `deltaPercent`(`Double`, `compareWithPrev=false` 면 null)가 있고 `previousAmount` 는 백엔드 DTO(`CategoryBreakdownItem.java`)에 없다. 스키마에 `previousAmount` 를 필수로 두지 않는다.

## 의도 메모

- 스키마는 `z.object` 기본(모르는 필드는 버림)으로 쓴다. `.strict()` 를 쓰지 않는다.
- null 가능 여부는 실제 백엔드 DTO(`backend/src/main/java/**/dto/*Response*.java`, `*Item.java`)를 읽어 정한다. 기억으로 정하지 않는다. 백엔드는 null 을 키를 남긴 채 `"category": null` 로 보낸다(`@JsonInclude(NON_NULL)` 은 `ApiSuccessResponse` 클래스에만 있어 `message` 와 `data` 에만 적용된다). null 이 오는 필드는 `.nullable()` 로 둔다. `.nullish()` 와 `.optional()` 은 DTO 가 키를 생략할 수 있다고 코드로 확인된 필드에만 쓴다.
- `src/types/**` 의 기존 타입은 지우지 않는다. 스키마 파일에 `const _check: z.ZodType<기존타입> = 스키마;` 같은 컴파일 시점 대조를 둬 어긋나면 `tsc` 가 실패하게 한다. 대조가 실패하면 스키마를 느슨하게 하지 않는다. 기존 타입이 실제 백엔드와 다르면(null 을 허용하지 않는 타입 등) 타입을 실제에 맞게 고치고, 그로 인한 호출부 컴파일 오류를 같은 phase 에서 고친다. 그렇게 고친 파일은 회신의 「변경한 파일」 에 적고, team-lead 가 이 phase 의 변경 파일 표에 더한다. 서비스 안에만 있던 지역 타입은 `z.infer` 로 바꾼다.
- 서비스 테스트는 `serverApiGet` 모듈을 통째로 mock 하므로 검증이 실행되지 않는다. 서비스 테스트는 `expect.objectContaining({ schema: 스키마 })` 로 스키마를 넘기는지만 확인하고, 필드 누락과 null 처리는 스키마 단위 테스트(`safeParse`)로 확인한다. `{ schema }` 인자가 더해져 인자 개수까지 비교하던 기존 `toHaveBeenCalledWith` 가 깨지면 그 단언을 고친다.
- 서비스 호출에 `{ schema }` 를 넘긴다. 반환 타입은 바꾸지 않는다.
- `dashboard-service.ts` 35행 일별 집계는 phase 02 의 `calendar.ts` 일별 스키마를 재사용한다. 96행 최근 지출은 phase 02 의 지출 목록 스키마를 쓰고, `RecentExpense.amount`(`string`)로 바꾸는 변환은 서비스의 `map` 에서 `String(expense.amount)` 로 한다. 백엔드 `amount` 가 숫자고 `category` 가 null 인 사실을 DTO 로 확인한다(phase 02 가 타입을 실제에 맞춰 둔다).
- `category-breakdown` 과 `monthly-trend` 스키마는 `frontend/src/lib/schemas/responses/dashboard.ts`(신규) 하나에 두고 두 서비스가 함께 쓴다. 두 지역 타입은 `z.infer` 로 바꾼다.
- `emptyOnFailure` 와 대시보드 대체 코드는 `ResponseValidationError` 면 `console.error` 를 남긴 뒤 대체한다(phase 01 래퍼가 이미 한 줄 남기므로 중복이면 생략해도 된다. 대체 때문에 로그가 사라지지 않는 것만 지킨다).

## 작업 항목

### 1. `dashboard.ts` 스키마(신규)

### 2. 분석, 대시보드 서비스 연결과 지역 타입 정리

### 3. 테스트

- `frontend/src/__tests__/services/analytics/analytics-service.test.ts`(수정), `frontend/src/__tests__/services/dashboard/getMonthlyCategoryBreakdown.test.ts`(수정): `serverApiGet` mock 이 `ResponseValidationError` 로 reject 하면 빈 값으로 대체되고 `console.error` 가 불린다(대체 코드가 로그를 직접 남기는 경우). 서비스가 스키마를 넘기는지는 `expect.objectContaining({ schema })` 로 확인한다. 스키마 단위 테스트(`frontend/src/__tests__/lib/schemas/responses/dashboard.test.ts`, 신규)에서 필드 누락과 `deltaPercent` null 을 확인한다. `{ schema }` 인자 때문에 깨지는 `frontend/src/__tests__/services/dashboard/getMonthlyDailyStats.test.ts` 와 `frontend/src/__tests__/actions/dashboard/get-monthly-daily-stats-action.test.ts` 의 `toHaveBeenCalledWith` 를 고친다.

## 검증

`frontend/` 에서 실행한다.

```bash
pnpm tsc --noEmit && pnpm lint && pnpm lint:md && pnpm test
pnpm test src/__tests__/services/analytics/analytics-service.test.ts src/__tests__/services/dashboard/getMonthlyCategoryBreakdown.test.ts src/__tests__/services/dashboard/getMonthlyDailyStats.test.ts src/__tests__/actions/dashboard/get-monthly-daily-stats-action.test.ts src/__tests__/lib/schemas/responses/dashboard.test.ts
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
| `frontend/src/__tests__/services/dashboard/getMonthlyDailyStats.test.ts` | 수정 |
| `frontend/src/__tests__/actions/dashboard/get-monthly-daily-stats-action.test.ts` | 수정 |
| `frontend/src/__tests__/lib/schemas/responses/dashboard.test.ts` | 신규 |
