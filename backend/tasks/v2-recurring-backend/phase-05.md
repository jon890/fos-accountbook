# Phase 5: 프레젠테이션 레이어 — Controller + DTO

## 컨텍스트

`fos-accountbook-backend` Spring Boot 백엔드. 반복 지출 기능 구현 중.
Phase 4에서 Service, Scheduler, Event가 완료된 상태다.

반드시 먼저 읽을 문서:
- `CLAUDE.md` — Controller 패턴, @LoginUser, CustomUuid, 공통 응답 형식
- `docs/data-schema.md` — API 엔드포인트 명세

기존 코드 참조 (패턴 파악용):
- `src/main/java/com/bifos/accountbook/presentation/controller/ExpenseController.java`
- `src/main/java/com/bifos/accountbook/presentation/dto/` 디렉터리

## 목표

반복 지출 REST API 엔드포인트를 구현한다.

## API 엔드포인트

```
POST   /api/v1/families/{familyUuid}/recurring-expenses
GET    /api/v1/families/{familyUuid}/recurring-expenses          ?month=YYYY-MM
GET    /api/v1/families/{familyUuid}/recurring-expenses/monthly-total
PUT    /api/v1/families/{familyUuid}/recurring-expenses/{uuid}
DELETE /api/v1/families/{familyUuid}/recurring-expenses/{uuid}
```

## 작업 목록

### Request DTO

- [ ] `src/main/java/com/bifos/accountbook/presentation/dto/CreateRecurringExpenseRequest.java`
  - `@Getter @NoArgsConstructor @AllArgsConstructor`
  - 필드: `String categoryUuid`, `String name`, `BigDecimal amount`, `Integer dayOfMonth`
  - `@NotNull`, `@NotBlank`, `@Min(1)`, `@Max(28)` 등 Bean Validation 어노테이션

- [ ] `src/main/java/com/bifos/accountbook/presentation/dto/UpdateRecurringExpenseRequest.java`
  - 동일 구조 (모든 필드 수정 가능)

### Response DTO

- [ ] `src/main/java/com/bifos/accountbook/presentation/dto/RecurringExpenseResponse.java`
  - `@Getter @Builder`
  - 필드: `String uuid`, `String familyUuid`, `String categoryUuid`, `CategoryInfo category`, `String name`, `BigDecimal amount`, `int dayOfMonth`, `String status`, `boolean generatedThisMonth`, `LocalDateTime createdAt`, `LocalDateTime updatedAt`
  - `static RecurringExpenseResponse from(RecurringExpenseDto.Response dto)` 팩토리 메서드

- [ ] `src/main/java/com/bifos/accountbook/presentation/dto/GetRecurringExpensesResponse.java`
  - 필드: `BigDecimal totalMonthlyAmount`, `List<RecurringExpenseResponse> items`

### Controller

- [ ] `src/main/java/com/bifos/accountbook/presentation/controller/RecurringExpenseController.java`
  - `@RestController @RequestMapping("/api/v1/families/{familyUuid}/recurring-expenses") @RequiredArgsConstructor`
  - 메서드:
    - `POST /` → `createRecurringExpense(@LoginUser LoginUserDto, @PathVariable CustomUuid familyUuid, @RequestBody @Valid CreateRecurringExpenseRequest)` → `ResponseEntity.ok(ApiSuccessResponse.of(...))`
    - `GET /` → `getRecurringExpenses(@LoginUser, @PathVariable CustomUuid familyUuid, @RequestParam(required=false) String month)` → `ResponseEntity.ok(ApiSuccessResponse.of(GetRecurringExpensesResponse))`
    - `GET /monthly-total` → `getMonthlyTotal(@LoginUser, @PathVariable CustomUuid familyUuid)` → `ResponseEntity.ok(ApiSuccessResponse.of(totalMonthlyAmount))`
    - `PUT /{uuid}` → `updateRecurringExpense(@LoginUser, @PathVariable CustomUuid familyUuid, @PathVariable CustomUuid uuid, @RequestBody @Valid UpdateRecurringExpenseRequest)` → `ResponseEntity.ok(...)`
    - `DELETE /{uuid}` → `deleteRecurringExpense(@LoginUser, @PathVariable CustomUuid familyUuid, @PathVariable CustomUuid uuid)` → `ResponseEntity.ok(ApiSuccessResponse.of("삭제되었습니다."))`

## 성공 기준

- `./gradlew build -x test -x checkstyleMain -x checkstyleTest --no-daemon` 성공
- 5개 엔드포인트가 구현됨

## 주의사항

- `@LoginUser`는 기존 Resolver가 처리 — 별도 구현 불필요
- `@PathVariable CustomUuid`는 기존 Converter가 처리
- 공통 응답: `ApiSuccessResponse.of(data)` 또는 `ApiSuccessResponse.of("메시지", data)`
- `month` 파라미터 없을 경우 현재 월(YYYY-MM) 기본값 사용
- Controller는 Service를 직접 호출, Repository 직접 주입 금지
