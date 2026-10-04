# Phase 01. 백엔드: installment 도메인과 할부 CRUD API

**Execution profile**: standard

## 목표

가족이 할부를 등록, 조회, 수정, 삭제하는 API 를 만든다.
조회 응답은 업무 날짜의 이번 달 기준으로 월 납부액, 현재 회차, 이번 달 납부액, 남은 금액, 진행 상태를 계산해 담는다.
할부는 지출을 만들지 않고 예산과 집계에 들어가지 않는다.

**범위 외**: 프론트엔드는 phase 02~04 가 한다. `expense`, `dashboard`, `budgetitem`, `notification` 도메인과 `ApiTokenAccessPolicy` 는 바꾸지 않는다. 연동 토큰으로는 이 API 를 부를 수 없다.

## 컨텍스트

가장 최근에 만든 `budgetitem` 도메인을 본뜬다. 레이어와 이름 규칙이 같다.

| 본뜰 파일 | 새 파일 |
|---|---|
| `backend/src/main/java/com/bifos/accountbook/budgetitem/domain/entity/BudgetItem.java` | `installment/domain/entity/Installment.java` |
| `budgetitem/domain/value/BudgetItemStatus.java`, `budgetitem/domain/converter/BudgetItemStatusConverter.java` | `installment/domain/value/InstallmentStatus.java`, `installment/domain/converter/InstallmentStatusConverter.java` |
| `budgetitem/domain/repository/BudgetItemRepository.java`, `budgetitem/infra/repository/impl/BudgetItemRepositoryImpl.java`, `budgetitem/infra/repository/jpa/BudgetItemJpaRepository.java` | `installment/` 아래 같은 위치 |
| `budgetitem/application/dto/BudgetItemRequest.java`, `BudgetItemResponse.java`, `budgetitem/application/service/BudgetItemService.java` | `installment/application/dto/InstallmentRequest.java`, `InstallmentResponse.java`, `installment/application/service/InstallmentService.java` |
| `budgetitem/presentation/controller/BudgetItemController.java` | `installment/presentation/controller/InstallmentController.java` |
| `backend/src/test/java/com/bifos/accountbook/budgetitem/presentation/controller/BudgetItemControllerTest.java` | `installment/presentation/controller/InstallmentControllerTest.java` |

- 위 표의 경로는 모두 `backend/src/main/java/com/bifos/accountbook/` (테스트는 `backend/src/test/java/com/bifos/accountbook/`) 아래다.
- 가족 접근 검증은 서비스 메서드의 `@ValidateFamilyAccess` 와 `@UserUuid CustomUuid userUuid`, `@FamilyUuid CustomUuid familyUuid` 파라미터로 한다(`BudgetItemService` 와 같다).
- 업무 날짜는 `Clock` 을 주입받아 `YearMonth.now(clock.withZone(BusinessTime.ZONE))` 로 정한다. `BusinessTime` 은 `shared/utils/BusinessTime.java` 다. 인자 없는 `now()` 는 ArchUnit `NO_DIRECT_NOW_FOR_BUSINESS_DATE` 가 막는다(ADR-B21).
- 고정 시각 테스트는 `backend/src/test/java/com/bifos/accountbook/invitation/application/service/InvitationServiceTest.java` 의 `@Import(...FixedClockConfig.class)` 와 `@TestConfiguration static class FixedClockConfig` 패턴을 따른다.
- 테스트는 H2 `ddl-auto: create-drop` 이라 마이그레이션 SQL 을 실행하지 않는다. 운영은 `ddl-auto: validate` 라 엔티티와 마이그레이션이 어긋나면 기동이 실패한다. 그래서 `backend/scripts/check-migrations-mysql.sh` 를 반드시 돌린다.
- 엔드포인트, 서비스 phase 의 self-check 는 `backend/.claude/skills/_shared/common-critic-patterns.md` 의 「backend-fos」 절 BE1(`@Transactional` 경계), BE2(Entity-DTO 노출), BE3(AOP 자기호출)이다.

**근거 문서**: `backend/docs/adr/ADR-B27-installments-outside-budget.md`, `backend/docs/data-schema.md` 의 「[installment] installments」 와 「할부 요청과 응답」, `backend/docs/flow.md` 의 「9. 할부 기록과 진행 상황」, `backend/docs/prd.md` 의 「F10. 할부」.

## 의도 메모

- 진행 상황을 칸으로 저장하지 않는다. 매달 값을 바꿀 스케줄러가 생기고, 멈추면 값이 어긋난다(ADR-B27).
- 계산은 엔티티 메서드 하나에 둔다. 서비스와 컨트롤러는 그 결과를 옮기기만 한다. 규칙을 단위 테스트로 고정하기 위해서다.
- 가족당 개수 제한과 이름 중복 검사는 두지 않는다. 같은 이름의 할부(예: 같은 가게에서 두 번)가 정상이다.
- 수정은 `BudgetItemRequest` 처럼 다섯 필드를 통째로 받는다. 부분 수정(null 은 유지)은 쓰지 않는다. 프론트엔드가 항상 폼 전체를 보내기 때문이다.

## 작업 항목

### 1. 마이그레이션과 엔티티

`backend/src/main/resources/db/migration/V20261004_1200__create_installments.sql`

- `backend/docs/data-schema.md` 「[installment] installments」 의 SQL 과 같은 칸과 타입이다. 식별자는 백틱으로 감싼다(ADR-B15).
- `UNIQUE KEY uq_installments_uuid (uuid)`, `INDEX idx_installments_family_uuid (family_uuid)`, `ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`. `V20261002_1200__create_budget_items.sql` 과 같은 꼴이다.

`installment/domain/value/InstallmentStatus.java`: `ACTIVE`, `DELETED` (`CodeEnum`). 변환기 `InstallmentStatusConverter` 는 `BudgetItemStatusConverter` 와 같다.

`installment/domain/value/InstallmentProgress.java`: `UPCOMING`, `IN_PROGRESS`, `COMPLETED` 인 일반 enum. 저장하지 않는다.

`installment/domain/value/InstallmentSchedule.java`: `record InstallmentSchedule(YearMonth endMonth, BigDecimal monthlyAmount, BigDecimal firstMonthAmount, int currentRound, BigDecimal thisMonthAmount, BigDecimal remainingAmount, InstallmentProgress progress)`.

`installment/domain/entity/Installment.java` (`@Table(name = "installments")`)

| 필드 | 컬럼 |
|---|---|
| `Long id` | PK |
| `CustomUuid uuid` | `nullable = false, unique = true, length = 36`, `@PrePersist` 에서 생성 |
| `CustomUuid familyUuid` | `family_uuid`, not null, 36 |
| `CustomUuid userUuid` | `user_uuid`, not null, 36 |
| `String name` | not null, 50 |
| `BigDecimal totalAmount` | `total_amount`, not null, precision 12, scale 2 |
| `int installmentMonths` | `installment_months`, not null |
| `String startMonth` | `start_month`, not null, 7 |
| `String memo` | nullable, 200 |
| `InstallmentStatus status` | not null, 20, 기본 `ACTIVE` |
| `createdAt`, `updatedAt` | `BudgetItem` 과 같은 감사 칸 |

메서드:

- `update(String name, BigDecimal totalAmount, int installmentMonths, String startMonth, String memo)`: 다섯 칸을 모두 바꾼다.
- `delete()`: `status = DELETED`.
- `InstallmentSchedule scheduleAt(YearMonth currentMonth)`: 아래 규칙으로 계산한다. 금액은 모두 `BigDecimal` 이고 scale 0 으로 계산한다(ADR-B07).
  - `start = YearMonth.parse(startMonth)`, `endMonth = start.plusMonths(installmentMonths - 1)`
  - `monthlyAmount = totalAmount.divide(BigDecimal.valueOf(installmentMonths), 0, RoundingMode.DOWN)`
  - `firstMonthAmount = totalAmount - monthlyAmount × (installmentMonths - 1)`
  - `currentRound`: `currentMonth` 가 `start` 보다 앞이면 0, `endMonth` 보다 뒤면 `installmentMonths`, 그 사이면 `ChronoUnit.MONTHS.between(start, currentMonth) + 1`
  - `paid`: `currentRound == 0` 이면 0, 아니면 `firstMonthAmount + monthlyAmount × (currentRound - 1)`. `remainingAmount = totalAmount - paid`
  - `thisMonthAmount`: `start ≤ currentMonth ≤ endMonth` 일 때만 값이 있다. 1회차면 `firstMonthAmount`, 아니면 `monthlyAmount`. 밖이면 0
  - `progress`: `currentMonth < start` 이면 `UPCOMING`, `currentMonth > endMonth` 이면 `COMPLETED`, 아니면 `IN_PROGRESS`

### 2. 저장소

`installment/domain/repository/InstallmentRepository.java`

- `Installment save(Installment installment)`
- `List<Installment> findAllActiveByFamilyUuid(CustomUuid familyUuid)`: ACTIVE 만, `startMonth` 오름차순 뒤 `id` 오름차순
- `Optional<Installment> findActiveByUuidAndFamilyUuid(CustomUuid uuid, CustomUuid familyUuid)`

구현은 `installment/infra/repository/impl/InstallmentRepositoryImpl.java` 와 `installment/infra/repository/jpa/InstallmentJpaRepository.java` 다. JPQL 은 `BudgetItemJpaRepository` 처럼 상태 enum 을 전체 경로로 쓴다.

### 3. 요청과 응답, 서비스, 에러 코드

`backend/src/main/java/com/bifos/accountbook/shared/exception/ErrorCode.java`: `INSTALLMENT_NOT_FOUND(HttpStatus.NOT_FOUND, "IS001", "할부를 찾을 수 없습니다")` 를 더한다. `IS` 접두어는 지금 쓰는 곳이 없다.

`installment/application/dto/InstallmentRequest.java` (`@Getter @NoArgsConstructor @AllArgsConstructor`)

| 필드 | 검증 |
|---|---|
| `String name` | `@NotBlank` |
| `BigDecimal totalAmount` | `@NotNull`, `@DecimalMin("1")`, `@Digits(integer = 10, fraction = 0)` |
| `Integer installmentMonths` | `@NotNull`, `@Min(2)`, `@Max(60)` |
| `String startMonth` | `@NotBlank`, `@Pattern(regexp = "^\\d{4}-(0[1-9]|1[0-2])$")` |
| `String memo` | `@Size(max = 200)`, null 허용 |

`installment/application/dto/InstallmentResponse.java`: `backend/docs/data-schema.md` 「할부 요청과 응답」 의 응답 표 필드 전부. `startMonth` 와 `endMonth` 는 `YYYY-MM` 문자열, `progress` 는 enum 이름 문자열이다. `static InstallmentResponse from(Installment installment, InstallmentSchedule schedule)`.

`installment/application/service/InstallmentService.java` (`@Service @RequiredArgsConstructor @Transactional(readOnly = true)`, 의존: `InstallmentRepository`, `Clock`)

- `List<InstallmentResponse> getInstallments(@UserUuid CustomUuid userUuid, @FamilyUuid CustomUuid familyUuid)`
- `InstallmentResponse createInstallment(@UserUuid ..., @FamilyUuid ..., InstallmentRequest request)`: `@Transactional`. `userUuid` 를 등록자로 저장한다
- `InstallmentResponse updateInstallment(@UserUuid ..., @FamilyUuid ..., CustomUuid installmentUuid, InstallmentRequest request)`: `@Transactional`
- `void deleteInstallment(@UserUuid ..., @FamilyUuid ..., CustomUuid installmentUuid)`: `@Transactional`
- 네 메서드 모두 `@ValidateFamilyAccess`.
- 생성과 수정의 공통 검증(private): 이름은 trim 뒤 1~50자, 아니면 `BusinessException(ErrorCode.INVALID_INPUT_VALUE, "할부 이름은 공백을 뺀 1~50자여야 합니다")`. `totalAmount < installmentMonths` 면 `BusinessException(ErrorCode.INVALID_INPUT_VALUE, "총 금액은 할부 개월 수 이상이어야 합니다")`. 메모는 trim 뒤 비면 null.
- 찾지 못하면 `BusinessException(ErrorCode.INSTALLMENT_NOT_FOUND).addParameter("installmentUuid", ...)`. 다른 가족의 할부도 같은 404 다.
- 이번 달은 메서드마다 `YearMonth.now(clock.withZone(BusinessTime.ZONE))` 로 한 번 구해 모든 항목에 같은 값을 쓴다.

### 4. 컨트롤러

`installment/presentation/controller/InstallmentController.java`, `@RequestMapping("/api/v1/families/{familyUuid}/installments")`. `BudgetItemController` 와 같은 꼴이다.

| 메서드 | 경로 | 응답 |
|---|---|---|
| `POST` | `` | 201, `ApiSuccessResponse.of("할부가 등록되었습니다", response)` |
| `GET` | `` | 200, `ApiSuccessResponse.of(list)` |
| `PUT` | `/{installmentUuid}` | 200, `ApiSuccessResponse.of("할부가 수정되었습니다", response)` |
| `DELETE` | `/{installmentUuid}` | 200, `ApiSuccessResponse.of("할부가 삭제되었습니다", null)` |

### 5. 테스트

`backend/src/test/java/com/bifos/accountbook/installment/domain/entity/InstallmentTest.java` (스프링 없이 단위 테스트)

- 총 1,000,000원, 12개월, 첫 결제 월 2026-09, 이번 달 2026-10: `monthlyAmount` 83333, `firstMonthAmount` 83337, `currentRound` 2, `thisMonthAmount` 83333, `remainingAmount` 833330, `IN_PROGRESS`, `endMonth` 2027-08
- 같은 할부, 이번 달 2026-09: `currentRound` 1, `thisMonthAmount` 83337
- 이번 달 2026-08: `UPCOMING`, 회차 0, 이번 달 0, 남은 금액 1,000,000
- 이번 달 2027-08(마지막 달): `IN_PROGRESS`, 회차 12, 남은 금액 0, 이번 달 83333
- 이번 달 2027-09: `COMPLETED`, 회차 12, 이번 달 0, 남은 금액 0
- 해를 넘기는 할부: 2026-11 부터 3개월이면 `endMonth` 2027-01
- 나누어떨어지는 총액(300,000원, 3개월): 첫 회차와 월 납부액이 모두 100000

`backend/src/test/java/com/bifos/accountbook/installment/presentation/controller/InstallmentControllerTest.java` (`AbstractControllerTest` 상속, 고정 시각 `2026-10-15T00:00:00Z` 을 `Asia/Seoul` 로 둔 `Clock`)

- 등록 성공: 201, 위 단위 테스트 첫 케이스와 같은 계산 필드, `userUuid` 가 요청한 사용자, `memo` 가 `"  "` 이면 null
- 등록 실패 400: 개월 1, 개월 61, `startMonth` `"2026-13"`, 총액 5원과 개월 12, 이름 공백뿐
- 목록: 첫 결제 월 오름차순, 지운 할부와 다른 가족의 할부는 빠진다. 할부가 없으면 빈 배열
- 수정 성공 200 과 계산 필드 갱신. 다른 가족의 할부 수정은 404, `$.code` 가 `IS001`(에러 응답 필드 이름은 `BudgetItemControllerTest` 의 404 단언을 따른다)
- 삭제 200 뒤 목록에서 빠지고, 다시 삭제하면 404
- 가족 구성원이 아니면 403

## 검증

`backend/gradle/wrapper/gradle-wrapper.jar` 가 없으면 먼저 `cd backend && mise exec gradle@9.8.0 -- gradle wrapper --gradle-version 9.8.0` 으로 만든다. jar 는 커밋하지 않는다.

```bash
cd backend && ./gradlew spotlessApply --no-daemon
cd backend && ./gradlew test --tests '*InstallmentTest' --tests '*InstallmentControllerTest' --no-daemon
cd backend && ./gradlew qualityCheck test --no-daemon
cd backend && bash scripts/check-migrations-mysql.sh
```

`check-migrations-mysql.sh` 는 Docker 가 필요하다. Docker 가 없으면 `PHASE_BLOCKED: Docker 없음으로 MySQL 마이그레이션 검증 불가` 를 출력하고 멈춘다.

## 변경 파일

| 파일 | 변경 |
|---|---|
| `backend/src/main/resources/db/migration/V20261004_1200__create_installments.sql` | 신규 |
| `backend/src/main/java/com/bifos/accountbook/installment/domain/entity/Installment.java` | 신규 |
| `backend/src/main/java/com/bifos/accountbook/installment/domain/value/InstallmentStatus.java` | 신규 |
| `backend/src/main/java/com/bifos/accountbook/installment/domain/value/InstallmentProgress.java` | 신규 |
| `backend/src/main/java/com/bifos/accountbook/installment/domain/value/InstallmentSchedule.java` | 신규 |
| `backend/src/main/java/com/bifos/accountbook/installment/domain/converter/InstallmentStatusConverter.java` | 신규 |
| `backend/src/main/java/com/bifos/accountbook/installment/domain/repository/InstallmentRepository.java` | 신규 |
| `backend/src/main/java/com/bifos/accountbook/installment/infra/repository/impl/InstallmentRepositoryImpl.java` | 신규 |
| `backend/src/main/java/com/bifos/accountbook/installment/infra/repository/jpa/InstallmentJpaRepository.java` | 신규 |
| `backend/src/main/java/com/bifos/accountbook/installment/application/dto/InstallmentRequest.java` | 신규 |
| `backend/src/main/java/com/bifos/accountbook/installment/application/dto/InstallmentResponse.java` | 신규 |
| `backend/src/main/java/com/bifos/accountbook/installment/application/service/InstallmentService.java` | 신규 |
| `backend/src/main/java/com/bifos/accountbook/installment/presentation/controller/InstallmentController.java` | 신규 |
| `backend/src/main/java/com/bifos/accountbook/shared/exception/ErrorCode.java` | 수정 |
| `backend/src/test/java/com/bifos/accountbook/installment/domain/entity/InstallmentTest.java` | 신규 |
| `backend/src/test/java/com/bifos/accountbook/installment/presentation/controller/InstallmentControllerTest.java` | 신규 |
