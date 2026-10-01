# Phase 01. 카테고리 종류 칸과 마이그레이션

**Execution profile**: deep

## 목표

`categories` 에 `type`(`EXPENSE`, `INCOME`)을 더하고, 운영 데이터를 쓰임새로 분류하며, 수입 기본 카테고리를 만든다. API 응답과 요청이 `type` 을 주고받는다.

**범위 외**: 지출, 수입 등록 시 종류 검증과 삭제 이관은 phase 02, 프론트엔드는 phase 03 이다.

## 컨텍스트

모든 경로는 저장소 root 기준이다. 명령은 `backend/` 에서 돌린다.

**근거 문서**: `backend/docs/adr/ADR-B23-category-type.md`, `backend/docs/data-schema.md` 의 「[category] categories」 절과 마이그레이션 표.

코드에서 확인한 사실:

- 엔티티 `backend/src/main/java/com/bifos/accountbook/category/domain/entity/Category.java`: `name`, `color`, `icon`, `status`, `excludeFromBudget`, `isDefault`(가족마다 「미분류」 하나, 삭제 불가).
- 기본 카테고리 생성: `backend/src/main/java/com/bifos/accountbook/category/application/service/CategoryService.java` 의 `createDefaultCategoriesForFamily(CustomUuid)` 가 `DefaultCategory("미분류", "#9ca3af", "📂", true)` 와 지출 카테고리 10개를 만든다.
- 기본 카테고리 조회: `CategoryRepository.getDefaultCategoryByFamily(CustomUuid)`. 쓰는 곳은 `git grep -n getDefaultCategoryByFamily backend/src/main` 으로 찾는다(지출 서비스와 카테고리 삭제).
- `ExpenseService.java` 54-67 행도 기본 카테고리가 없을 때 「미분류」 를 직접 만든다.
- DTO: `backend/src/main/java/com/bifos/accountbook/category/application/dto/` 의 `CategoryResponse`, `CreateCategoryRequest`, `UpdateCategoryRequest`, `CategoryInfo`. 카테고리 캐시는 Caffeine(ADR-B05, B06).
- 마이그레이션: `backend/src/main/resources/db/migration/`. 새 파일은 타임스탬프 버전이다(`backend/CLAUDE.md` 「Database」). 이번 파일 이름은 `V20261001_1200__add_category_type.sql`. 테스트는 H2(MySQL 모드)에서 같은 마이그레이션을 돈다. `V12__add_default_category_support.sql` 이 `UUID()` 로 행을 만드는 선례다. H2 호환을 ADR-B15 처럼 확인한다.
- 수입은 `incomes.category_uuid`, 지출은 `expenses.category_uuid`, 반복 지출은 `recurring_expenses.category_uuid` 로 카테고리를 가리킨다. 모두 FK 가 없다.

## 의도 메모

마이그레이션 순서(ADR-B23):

1. `ALTER TABLE categories ADD COLUMN type VARCHAR(20) NOT NULL DEFAULT 'EXPENSE'`.
2. 수입에만 쓰이고(ACTIVE 수입이 있고) 지출과 반복 지출에 쓰이지 않는 카테고리를 `INCOME` 으로.
3. ACTIVE 가족마다 수입 카테고리 「급여」, 「부수입」, 「용돈」, 「기타 수입」 을 이름이 겹치지 않을 때만 만든다. 「기타 수입」 은 `is_default = TRUE`, `type = 'INCOME'`.
   이미 같은 이름의 `INCOME` 카테고리가 있으면 새로 만들지 않고, 그 가족에 기본 수입 카테고리가 없으면 「기타 수입」 을 기본으로 지정한다.
4. 지출과 수입 양쪽에 쓰인 `EXPENSE` 카테고리를 가리키는 수입을 그 가족의 「기타 수입」 으로 옮긴다.
5. 기존 「미분류」 기본 카테고리는 `EXPENSE` 그대로 둔다.

- 마이그레이션은 한 번만 돈다. 실행 전후 건수를 확인하는 SQL 을 완료 보고에 적어, 운영 배포 때 사람이 같은 확인을 할 수 있게 한다.
- `type` 은 `CodeEnum` 패턴으로 저장한다(`UserStatus` 같은 기존 enum 의 변환기를 따른다).
- `CreateCategoryRequest.type` 은 필수가 아니고 없으면 `EXPENSE` 다(지금 프론트와 외부 연동이 깨지지 않게). `UpdateCategoryRequest` 로는 종류를 바꾸지 않는다. 쓰임이 있는 카테고리의 종류를 바꾸면 기존 거래가 어긋난다.
- 기본 카테고리 조회는 종류를 받는다(`getDefaultCategoryByFamily(familyUuid, type)`). 기존 호출은 `EXPENSE` 로 바꾼다.
- 새 가족 생성은 지출 기본 세트와 함께 수입 네 개를 만든다.

## 작업 항목

### 1. 마이그레이션 `backend/src/main/resources/db/migration/V20261001_1200__add_category_type.sql`

### 2. 엔티티, enum, DTO, 리포지토리의 종류 칸

- 새 enum `backend/src/main/java/com/bifos/accountbook/category/domain/value/CategoryType.java`.
- `Category`, `CategoryResponse`, `CreateCategoryRequest`, `CategoryInfo` 에 `type`. 리포지토리 기본 카테고리 조회에 종류 인자.

### 3. 기본 카테고리 생성과 조회

- `createDefaultCategoriesForFamily` 가 수입 네 개를 더 만든다. `ExpenseService` 의 직접 생성은 지출 기본 조회로 바꾼다.

### 4. 이 phase 를 검증하는 테스트

- 마이그레이션: `backend/src/test/java/com/bifos/accountbook/category/infra/CategoryTypeMigrationTest.java`(신규). 마이그레이션 직전 버전까지 적용한 DB 에 수입 전용, 지출 전용, 양쪽 카테고리를 넣고 이 마이그레이션을 적용한 뒤 종류, 수입 기본 카테고리, 수입 이관을 단언한다. Flyway 의 `target` 을 써서 단계별로 적용한다. 테스트 픽스처 방식이 맞지 않으면 SQL 을 직접 실행하는 통합 테스트로 둔다.
- 컨트롤러: `backend/src/test/java/com/bifos/accountbook/category/presentation/controller/CategoryControllerTest.java` 에 `type` 응답과 `type` 없는 생성 요청이 `EXPENSE` 가 되는 케이스.
- 가족 생성 뒤 수입 카테고리 네 개와 기본 두 개(지출, 수입)가 생기는 케이스(`backend/src/test/java/com/bifos/accountbook/family/` 의 기존 가족 생성 테스트에 더한다).

## 검증

`backend/` 에서 실행한다. `gradle/wrapper/gradle-wrapper.jar` 가 없으면 먼저 `mise exec gradle@9.8.0 -- gradle wrapper --gradle-version 9.8.0` 을 돌린다. jar 는 커밋하지 않는다.

```bash
./gradlew test --tests "com.bifos.accountbook.category.*" --no-daemon
./gradlew qualityCheck test build --no-daemon
```

기대값: 두 명령 모두 BUILD SUCCESSFUL. ArchUnit 기준 파일이 늘지 않는다(`git diff --stat backend/config/archunit/store` 가 비거나 줄기만 한다).

## 변경 파일

| 파일 | 변경 |
|---|---|
| `backend/src/main/resources/db/migration/V20261001_1200__add_category_type.sql` | 신규 |
| `backend/src/main/java/com/bifos/accountbook/category/domain/value/CategoryType.java` | 신규 |
| `backend/src/main/java/com/bifos/accountbook/category/domain/entity/Category.java` | 수정 |
| `backend/src/main/java/com/bifos/accountbook/category/domain/repository/CategoryRepository.java` | 수정 |
| `backend/src/main/java/com/bifos/accountbook/category/infra/repository/**` | 수정 |
| `backend/src/main/java/com/bifos/accountbook/category/application/dto/*.java` | 수정 |
| `backend/src/main/java/com/bifos/accountbook/category/application/service/CategoryService.java` | 수정 |
| `backend/src/main/java/com/bifos/accountbook/expense/application/service/ExpenseService.java` | 수정 |
| `backend/src/test/java/com/bifos/accountbook/category/infra/CategoryTypeMigrationTest.java` | 신규 |
| `backend/src/test/java/com/bifos/accountbook/category/presentation/controller/CategoryControllerTest.java` | 수정 |
| `backend/src/test/java/com/bifos/accountbook/**/*Test.java` | 수정 |
