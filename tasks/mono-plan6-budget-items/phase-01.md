# Phase 01. 예산 항목 도메인과 CRUD API

**Execution profile**: standard

## 목표

백엔드에 `budgetitem` 도메인을 만들고 예산 항목을 생성, 조회, 수정, 삭제하는 API 를 연다. 뒤 phase 의 합계 규칙과 화면이 이 데이터를 읽는다.

**범위 외**: 생활비 합계 규칙 변경과 카테고리 삭제 연동은 phase 02, 예산 요약 API 는 phase 03, 프론트엔드는 phase 04~06 이다.

## 컨텍스트

모든 경로는 저장소 root 기준이다. 명령은 `backend/` 에서 돌린다.

**근거 문서**: `backend/docs/adr/ADR-B25-budget-items.md`, `backend/docs/data-schema.md` 의 「[budgetitem] budget_items」, 「[budgetitem] budget_item_categories」, 「예산 항목 요청과 응답」 절, `backend/docs/flow.md` 의 「8. 예산 항목과 예산 요약」 절, `backend/docs/code-architecture.md` 의 「새 도메인 추가 체크리스트」.

코드에서 확인한 사실:

- 새 도메인의 선례는 `backend/src/main/java/com/bifos/accountbook/apitoken/` 이다. `domain/entity`, `domain/value`, `domain/converter`, `domain/repository`, `infra/repository/jpa`, `infra/repository/impl`, `application/dto`, `application/service`, `presentation/controller` 배치를 그대로 따른다.
- 엔티티 규칙: `@Entity`, `@Getter`, `@Builder`, `@NoArgsConstructor`, `@AllArgsConstructor`, `@EntityListeners(AuditingEntityListener.class)`, `@PrePersist` 에서 `CustomUuid.generate()`. `@Data` 금지. 선례는 `apitoken/domain/entity/ApiToken.java`.
- 가족 리소스 컨트롤러의 선례는 `backend/src/main/java/com/bifos/accountbook/category/presentation/controller/CategoryController.java` 다. `@LoginUser LoginUserDto loginUser`, `@PathVariable CustomUuid familyUuid`, `ApiSuccessResponse.of(...)`, 생성은 `HttpStatus.CREATED`.
- 서비스의 가족 검증: `@ValidateFamilyAccess` 와 `@UserUuid CustomUuid userUuid, @FamilyUuid CustomUuid familyUuid` 인자. 선례는 `category/application/service/CategoryService.java` 의 `createCategory`.
- 카테고리 검증: `CategoryService.validateAndFindCached(CustomUuid familyUuid, CustomUuid categoryUuid, CategoryType expectedType)`. 없으면 `CATEGORY_NOT_FOUND`(CT001), 종류가 다르면 `CATEGORY_TYPE_MISMATCH`(CT005)를 던진다. `CategoryType.EXPENSE` 를 넘긴다.
- 에러 코드: `backend/src/main/java/com/bifos/accountbook/shared/exception/ErrorCode.java`. 접두사 `BI` 는 아직 쓰이지 않는다(2026-10-02 확인).
- 마이그레이션: `backend/src/main/resources/db/migration/`. 테이블 생성 선례는 `V20260930_1400__create_api_tokens_table.sql` 이다. 식별자에 백틱을 쓴다(ADR-B15). 테스트는 H2(MySQL 모드)에서 같은 파일을 돈다.
- OpenAPI 스냅샷: `backend/src/test/java/com/bifos/accountbook/contract/OpenApiSnapshotTest.java` 가 `/v3/api-docs` 를 파일로 뽑는다. 새 경로가 들어가는지 이 테스트에 단언을 더한다.
- 테스트 DB 정리는 `backend/src/test/java/com/bifos/accountbook/shared/DatabaseCleanupListener.java` 가 맡는다. 새 테이블이 정리 대상에 들어가는지 이 파일을 읽어 확인하고, 테이블 목록을 직접 나열하는 방식이면 두 테이블을 더한다.

## 의도 메모

- 용돈 전용 도메인은 만들지 않는다(ADR-B25 대안 기각). 구성원 귀속 칸을 넣지 않는다.
- `BudgetItemCategory` 는 `BudgetItem` 과 JPA 연관관계를 맺지 않고 `budgetItemUuid`, `categoryUuid` 를 `CustomUuid` 로만 가진다. 이 저장소의 `Category`, `RecurringExpense` 가 같은 방식이다.
- `budget_item_categories` 에는 `status` 가 없다. 항목 삭제와 카테고리 묶음 교체는 행을 실제로 지운다. phase 02 의 생활비 쿼리가 이 테이블에 행이 있으면 항목에 속한다고 본다.
- 수정은 카테고리 묶음을 통째로 바꾼다. 같은 트랜잭션에서 기존 행을 지우고 새 행을 넣을 때, 지우기가 먼저 DB 에 반영돼야 `uq_budget_item_categories_category` 에 걸리지 않는다. JPQL `@Modifying` 삭제를 쓰거나 삭제 뒤 `flush` 한다.
- 카테고리 충돌은 서비스에서 먼저 검사해 `BI002` 로 응답한다. 동시 요청으로 유니크 제약이 터지는 경우(`DataIntegrityViolationException`)도 `BI002` 로 바꾼다.
- 권한은 가족 구성원 누구나다. OWNER 로 제한하지 않는다(카테고리 관리와 같다).

## 작업 항목

### 1. 마이그레이션 `backend/src/main/resources/db/migration/V20261002_1200__create_budget_items.sql`

`backend/docs/data-schema.md` 의 두 `CREATE TABLE` 과 같은 칸, 유니크 키 `uq_budget_items_uuid`(uuid), `uq_budget_item_categories_category`(category_uuid), 인덱스 `idx_budget_items_family_uuid`, `idx_budget_item_categories_item` 을 만든다. FK 는 두지 않는다.

### 2. 도메인과 저장소

`backend/src/main/java/com/bifos/accountbook/budgetitem/` 아래에 만든다.

- `domain/entity/BudgetItem.java`: `id`, `uuid`, `familyUuid`, `name`(30), `monthlyLimit`(`BigDecimal`, precision 15 scale 2, 기본 0), `status`, `createdAt`, `updatedAt`. 메서드 `update(String name, BigDecimal monthlyLimit)`, `delete()`.
- `domain/entity/BudgetItemCategory.java`: `id`, `budgetItemUuid`, `categoryUuid`.
- `domain/value/BudgetItemStatus.java`(`ACTIVE`, `DELETED`)와 `domain/converter/BudgetItemStatusConverter.java`. `apitoken/domain/value/ApiTokenStatus.java` 와 그 변환기 방식을 따른다.
- `domain/repository/BudgetItemRepository.java` 와 `infra/repository/impl/BudgetItemRepositoryImpl.java`, `infra/repository/jpa/BudgetItemJpaRepository.java`, `infra/repository/jpa/BudgetItemCategoryJpaRepository.java`. 필요한 조회:
  - 가족의 ACTIVE 항목 목록(`id` 오름차순), 가족의 ACTIVE 항목 수, 가족 안에서 같은 이름의 ACTIVE 항목 존재 여부
  - `uuid` 와 `familyUuid` 로 ACTIVE 항목 하나
  - 항목 uuid 목록으로 카테고리 행들, 카테고리 uuid 목록으로 카테고리 행들(충돌 검사)
  - 항목 uuid 로 카테고리 행 삭제

### 3. 서비스와 DTO

- `application/dto/BudgetItemRequest.java`: `name`(`@NotBlank`, `@Size(max = 30)`), `monthlyLimit`(`@NotNull`, `@DecimalMin("0")`), `categoryUuids`(`@NotEmpty`). 생성과 수정이 함께 쓴다.
- `application/dto/BudgetItemResponse.java`: `uuid`, `name`, `monthlyLimit`, `categoryUuids`, `createdAt`, `updatedAt`. 정적 팩토리 `from(BudgetItem item, List<String> categoryUuids)`.
- `application/service/BudgetItemService.java`: 클래스에 `@Transactional(readOnly = true)`, 쓰기 메서드에 `@Transactional`. 네 메서드 모두 `@ValidateFamilyAccess`.
  - `getBudgetItems(userUuid, familyUuid)`
  - `createBudgetItem(userUuid, familyUuid, request)`: 이름은 `trim` 해서 저장한다. 검증 순서는 개수(10개 이상이면 `BUDGET_ITEM_LIMIT_EXCEEDED`), 이름 중복(`BUDGET_ITEM_ALREADY_EXISTS`), `categoryUuids` 중복 값(`INVALID_INPUT_VALUE`), 카테고리마다 `validateAndFindCached(..., CategoryType.EXPENSE)`, 다른 항목과의 충돌(`BUDGET_ITEM_CATEGORY_CONFLICT`).
  - `updateBudgetItem(userUuid, familyUuid, budgetItemUuid, request)`: 없으면 `BUDGET_ITEM_NOT_FOUND`. 이름 중복 검사는 자기 자신을 뺀다. 충돌 검사는 자기 항목의 기존 행을 뺀다.
  - `deleteBudgetItem(userUuid, familyUuid, budgetItemUuid)`: `delete()` 와 카테고리 행 삭제.
- `ErrorCode` 에 `BUDGET_ITEM_NOT_FOUND`(404, `BI001`, 「예산 항목을 찾을 수 없습니다」), `BUDGET_ITEM_CATEGORY_CONFLICT`(409, `BI002`, 「이미 다른 예산 항목에 속한 카테고리입니다」), `BUDGET_ITEM_LIMIT_EXCEEDED`(400, `BI003`, 「예산 항목은 10개까지 만들 수 있습니다」), `BUDGET_ITEM_ALREADY_EXISTS`(409, `BI004`, 「이미 존재하는 예산 항목입니다」)를 더한다.

### 4. 컨트롤러 `backend/src/main/java/com/bifos/accountbook/budgetitem/presentation/controller/BudgetItemController.java`

`@RequestMapping("/api/v1/families/{familyUuid}/budget-items")`. `POST`(201), `GET`, `PUT /{budgetItemUuid}`, `DELETE /{budgetItemUuid}`. 경로 변수는 `CustomUuid`. 요청 본문에 `@Valid`.

### 5. 이 phase 를 검증하는 테스트

- `backend/src/test/java/com/bifos/accountbook/budgetitem/presentation/controller/BudgetItemControllerTest.java`(신규, `AbstractControllerTest` 상속):
  - 정상: 지출 카테고리 둘로 생성하면 201 이고 응답에 `categoryUuids` 둘이 있다. 목록 조회에 만든 순서로 나온다. 수정으로 카테고리 묶음을 바꾸면 응답이 새 묶음이다. 삭제 뒤 목록에서 빠진다.
  - 실패: 다른 항목에 속한 카테고리로 생성하면 409 `BI002`. 수입 카테고리면 400 `CT005`. 같은 이름이면 409 `BI004`. `categoryUuids` 가 비면 400. 열한 번째 생성은 400 `BI003`. 없는 항목 수정은 404 `BI001`.
  - 삭제한 항목의 카테고리를 다른 항목에 다시 넣을 수 있다(행이 실제로 지워졌는지 확인).
- `backend/src/test/java/com/bifos/accountbook/contract/OpenApiSnapshotTest.java`: `/api/v1/families/{familyUuid}/budget-items` 가 스냅샷에 있는지 단언을 더한다.

## 검증

```bash
cd backend && ./gradlew test --tests "*BudgetItemControllerTest*" --tests "*OpenApiSnapshotTest*" --no-daemon --console=plain
cd backend && ./gradlew qualityCheck test --no-daemon --console=plain
```

둘 다 `BUILD SUCCESSFUL` 이어야 한다. `gradle-wrapper.jar` 가 없으면 먼저 `cd backend && mise exec gradle@9.8.0 -- gradle wrapper --gradle-version 9.8.0` 을 돌린다. jar 는 커밋하지 않는다.

## 변경 파일

| 파일 | 변경 |
|---|---|
| `backend/src/main/resources/db/migration/V20261002_1200__create_budget_items.sql` | 신규 |
| `backend/src/main/java/com/bifos/accountbook/budgetitem/domain/entity/BudgetItem.java` | 신규 |
| `backend/src/main/java/com/bifos/accountbook/budgetitem/domain/entity/BudgetItemCategory.java` | 신규 |
| `backend/src/main/java/com/bifos/accountbook/budgetitem/domain/value/BudgetItemStatus.java` | 신규 |
| `backend/src/main/java/com/bifos/accountbook/budgetitem/domain/converter/BudgetItemStatusConverter.java` | 신규 |
| `backend/src/main/java/com/bifos/accountbook/budgetitem/domain/repository/BudgetItemRepository.java` | 신규 |
| `backend/src/main/java/com/bifos/accountbook/budgetitem/infra/repository/impl/BudgetItemRepositoryImpl.java` | 신규 |
| `backend/src/main/java/com/bifos/accountbook/budgetitem/infra/repository/jpa/BudgetItemJpaRepository.java` | 신규 |
| `backend/src/main/java/com/bifos/accountbook/budgetitem/infra/repository/jpa/BudgetItemCategoryJpaRepository.java` | 신규 |
| `backend/src/main/java/com/bifos/accountbook/budgetitem/application/dto/BudgetItemRequest.java` | 신규 |
| `backend/src/main/java/com/bifos/accountbook/budgetitem/application/dto/BudgetItemResponse.java` | 신규 |
| `backend/src/main/java/com/bifos/accountbook/budgetitem/application/service/BudgetItemService.java` | 신규 |
| `backend/src/main/java/com/bifos/accountbook/budgetitem/presentation/controller/BudgetItemController.java` | 신규 |
| `backend/src/main/java/com/bifos/accountbook/shared/exception/ErrorCode.java` | 수정 |
| `backend/src/test/java/com/bifos/accountbook/budgetitem/presentation/controller/BudgetItemControllerTest.java` | 신규 |
| `backend/src/test/java/com/bifos/accountbook/contract/OpenApiSnapshotTest.java` | 수정 |
| `backend/src/test/java/com/bifos/accountbook/shared/DatabaseCleanupListener.java` | 수정 (테이블을 직접 나열하는 방식일 때만) |
