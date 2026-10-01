# Phase 02. 거래의 카테고리 종류 검증과 삭제 이관

**Execution profile**: standard

## 목표

지출과 반복 지출은 `EXPENSE` 카테고리, 수입은 `INCOME` 카테고리만 받는다. 카테고리를 지우면 수입도 수입 기본 카테고리로 옮긴다.

**범위 외**: 종류 칸과 마이그레이션은 phase 01 이 끝냈다. 프론트엔드는 phase 03 이다.

## 컨텍스트

모든 경로는 저장소 root 기준이다. 명령은 `backend/` 에서 돌린다.

**근거 문서**: `backend/docs/adr/ADR-B23-category-type.md`, `backend/docs/flow.md` 의 「4. 카테고리 삭제 시 연쇄 처리」 절.

코드에서 확인한 사실:

- 거래 생성과 수정은 카테고리를 `categoryService.validateAndFindCached(familyUuid, categoryUuid)` 로 확인한다(`backend/src/main/java/com/bifos/accountbook/income/application/service/IncomeService.java` 60행 부근, 지출과 반복 지출 서비스도 같은 메서드를 쓴다. `git grep -n validateAndFindCached backend/src/main` 으로 모두 찾는다).
- 카테고리 삭제 `CategoryService` 의 삭제 메서드가 `expenseServiceProvider ... moveExpensesToDefaultCategory`, `recurringExpenseServiceProvider ... moveRecurringExpensesToDefaultCategory` 를 부른다. 수입 이관은 없다.
- 오류 코드: `backend/src/main/java/com/bifos/accountbook/shared/exception/ErrorCode.java` 의 카테고리 코드는 `CT001`~`CT004` 다.

## 의도 메모

- 새 오류 코드 `CATEGORY_TYPE_MISMATCH(HttpStatus.BAD_REQUEST, "CT005", "거래 종류와 카테고리 종류가 맞지 않습니다")`.
- 검증은 카테고리를 확인하는 한 곳에서 한다. 예: `validateAndFindCached(familyUuid, categoryUuid, CategoryType expected)` 를 더하고 거래 서비스가 기대 종류를 넘긴다.
- 수입 이관은 지출 이관과 같은 방식(Provider 로 서비스 순환을 피하는 기존 패턴)을 따른다.
- 지출 이관은 기존처럼 삭제 이력을 포함하고, 반복 지출은 기존처럼 ACTIVE 행을 이관한다. 수입 이관은 삭제 이력을 포함한 전체 행을 옮긴다. 이관과 삭제는 같은 트랜잭션에서 끝나야 한다.
- `flow.md` 4절에 수입 이관과 종류별 기본 카테고리를 반영한다.

## 작업 항목

### 1. `ErrorCode` 와 카테고리 종류 검증

### 2. 지출, 반복 지출, 수입 서비스가 기대 종류로 검증

### 3. 카테고리 삭제 시 수입을 수입 기본 카테고리로 이관, `backend/docs/flow.md` 4절 갱신

### 4. 이 phase 를 검증하는 테스트

- `backend/src/test/java/com/bifos/accountbook/income/presentation/controller/IncomeControllerTest.java`(있으면 수정, 없으면 서비스 통합 테스트에 더한다): 지출 카테고리로 수입을 만들면 400 `CT005`.
- 지출 컨트롤러나 서비스 테스트: 수입 카테고리로 지출을 만들면 400 `CT005`.
- 생성과 수정 모두 지출, 수입, 반복 지출의 종류 불일치가 400 `CT005`인지 확인한다.
- 카테고리 삭제 테스트: 지운 `INCOME` 카테고리의 수입이 「기타 수입」 으로, `EXPENSE` 카테고리의 지출이 「미분류」 로 옮겨진다.
- 반복 지출 삭제 이관, 삭제된 수입 이력 이관, 기본 카테고리 삭제 거부, 종류가 없는 생성 요청의 지출 하위 호환을 확인한다.

## 검증

`backend/` 에서 실행한다. `gradle/wrapper/gradle-wrapper.jar` 가 없으면 먼저 `mise exec gradle@9.8.0 -- gradle wrapper --gradle-version 9.8.0` 을 돌린다. jar 는 커밋하지 않는다.

```bash
./gradlew test --tests "com.bifos.accountbook.income.*" --tests "com.bifos.accountbook.expense.*" --tests "com.bifos.accountbook.category.*" --tests "com.bifos.accountbook.recurring.*" --no-daemon
./gradlew qualityCheck test build --no-daemon
```

기대값: 두 명령 모두 BUILD SUCCESSFUL.

## 변경 파일

| 파일 | 변경 |
|---|---|
| `backend/src/main/java/com/bifos/accountbook/shared/exception/ErrorCode.java` | 수정 |
| `backend/src/main/java/com/bifos/accountbook/category/application/service/CategoryService.java` | 수정 |
| `backend/src/main/java/com/bifos/accountbook/expense/application/service/ExpenseService.java` | 수정 |
| `backend/src/main/java/com/bifos/accountbook/income/application/service/IncomeService.java` | 수정 |
| `backend/src/main/java/com/bifos/accountbook/recurring/application/service/RecurringExpenseService.java` | 수정 |
| `backend/src/main/java/com/bifos/accountbook/income/**/*.java` | 수정 |
| `backend/docs/flow.md` | 수정 |
| `backend/src/test/java/com/bifos/accountbook/**/*Test.java` | 수정 |
| `backend/src/test/java/com/bifos/accountbook/shared/fixtures/CategoryFixtures.java` | 수정 |
