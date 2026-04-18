# Phase 4: expense + income 도메인 이동

## 컨텍스트

`fos-accountbook-backend`는 Spring Boot 3 + Java 21 기반 가족 가계부 백엔드다.
프로젝트 루트: `/Users/nhn/personal/fos-accountbook-backend`
소스 루트: `src/main/java/com/bifos/accountbook/`

Phase 1~3 완료 상태: `shared/`, `user/`, `family/`, `category/` 패키지가 구성되어 있다.
이제 `expense/`와 `income/` 도메인 패키지를 생성한다. 구조가 유사하므로 함께 처리한다.

반드시 먼저 읽을 문서:
- `CLAUDE.md` — 코딩 컨벤션
- `docs/code-architecture.md` — 도메인별 소유 원칙 (이벤트는 발행자 도메인, 리스너는 구독자 도메인)

## 목표

`expense/`와 `income/` 도메인 패키지를 생성하고 관련 파일을 이동한 후, 전체 코드베이스의 import를 수정한다.

## 작업 목록

### expense 도메인 이동 (old → new)

**expense/domain/entity/**
- `domain/entity/Expense.java` → `expense/domain/entity/Expense.java`

**expense/domain/value/**
- `domain/value/ExpenseStatus.java` → `expense/domain/value/ExpenseStatus.java`

**expense/domain/converter/**
- `domain/entity/converter/ExpenseStatusConverter.java` → `expense/domain/converter/ExpenseStatusConverter.java`

**expense/domain/repository/**
- `domain/repository/ExpenseRepository.java` → `expense/domain/repository/ExpenseRepository.java`
- `domain/repository/projection/CategoryExpenseProjection.java` → `expense/domain/repository/projection/CategoryExpenseProjection.java`

**expense/infra/repository/impl/**
- `infra/persistence/repository/impl/ExpenseRepositoryImpl.java` → `expense/infra/repository/impl/ExpenseRepositoryImpl.java`
- `infra/persistence/repository/projection/CategoryExpenseProjectionImpl.java` → `expense/infra/repository/projection/CategoryExpenseProjectionImpl.java`

**expense/infra/repository/jpa/**
- `infra/persistence/repository/jpa/ExpenseJpaRepository.java` → `expense/infra/repository/jpa/ExpenseJpaRepository.java`

**expense/application/service/**
- `application/service/ExpenseService.java` → `expense/application/service/ExpenseService.java`

**expense/application/dto/**
- `application/dto/expense/CategoryExpenseStat.java` → `expense/application/dto/CategoryExpenseStat.java`
- `application/dto/expense/CategoryExpenseSummaryResponse.java` → `expense/application/dto/CategoryExpenseSummaryResponse.java`
- `application/dto/expense/CreateExpenseRequest.java` → `expense/application/dto/CreateExpenseRequest.java`
- `application/dto/expense/ExpenseResponse.java` → `expense/application/dto/ExpenseResponse.java`
- `application/dto/expense/ExpenseSearchRequest.java` → `expense/application/dto/ExpenseSearchRequest.java`
- `application/dto/expense/ExpenseSummarySearchRequest.java` → `expense/application/dto/ExpenseSummarySearchRequest.java`
- `application/dto/expense/UpdateExpenseRequest.java` → `expense/application/dto/UpdateExpenseRequest.java`

**expense/application/event/** (이벤트는 발행자 도메인에 배치)
- `application/event/ExpenseCreatedEvent.java` → `expense/application/event/ExpenseCreatedEvent.java`
- `application/event/ExpenseUpdatedEvent.java` → `expense/application/event/ExpenseUpdatedEvent.java`

**expense/presentation/controller/**
- `presentation/controller/ExpenseController.java` → `expense/presentation/controller/ExpenseController.java`

### income 도메인 이동 (old → new)

**income/domain/entity/**
- `domain/entity/Income.java` → `income/domain/entity/Income.java`

**income/domain/value/**
- `domain/value/IncomeStatus.java` → `income/domain/value/IncomeStatus.java`

**income/domain/converter/**
- `domain/entity/converter/IncomeStatusConverter.java` → `income/domain/converter/IncomeStatusConverter.java`

**income/domain/repository/**
- `domain/repository/IncomeRepository.java` → `income/domain/repository/IncomeRepository.java`

**income/infra/repository/impl/**
- `infra/persistence/repository/impl/IncomeRepositoryImpl.java` → `income/infra/repository/impl/IncomeRepositoryImpl.java`

**income/infra/repository/jpa/**
- `infra/persistence/repository/jpa/IncomeJpaRepository.java` → `income/infra/repository/jpa/IncomeJpaRepository.java`

**income/application/service/**
- `application/service/IncomeService.java` → `income/application/service/IncomeService.java`

**income/application/dto/**
- `application/dto/income/CreateIncomeRequest.java` → `income/application/dto/CreateIncomeRequest.java`
- `application/dto/income/IncomeResponse.java` → `income/application/dto/IncomeResponse.java`
- `application/dto/income/IncomeSearchRequest.java` → `income/application/dto/IncomeSearchRequest.java`
- `application/dto/income/UpdateIncomeRequest.java` → `income/application/dto/UpdateIncomeRequest.java`

**income/presentation/controller/**
- `presentation/controller/IncomeController.java` → `income/presentation/controller/IncomeController.java`

### import 매핑 핵심 (old → new 패턴)

```
com.bifos.accountbook.domain.entity.Expense → com.bifos.accountbook.expense.domain.entity.Expense
com.bifos.accountbook.domain.value.ExpenseStatus → com.bifos.accountbook.expense.domain.value.ExpenseStatus
com.bifos.accountbook.domain.repository.ExpenseRepository → com.bifos.accountbook.expense.domain.repository.ExpenseRepository
com.bifos.accountbook.domain.repository.projection.CategoryExpenseProjection → com.bifos.accountbook.expense.domain.repository.projection.CategoryExpenseProjection
com.bifos.accountbook.application.service.ExpenseService → com.bifos.accountbook.expense.application.service.ExpenseService
com.bifos.accountbook.application.event.ExpenseCreatedEvent → com.bifos.accountbook.expense.application.event.ExpenseCreatedEvent
com.bifos.accountbook.application.event.ExpenseUpdatedEvent → com.bifos.accountbook.expense.application.event.ExpenseUpdatedEvent

com.bifos.accountbook.domain.entity.Income → com.bifos.accountbook.income.domain.entity.Income
com.bifos.accountbook.domain.value.IncomeStatus → com.bifos.accountbook.income.domain.value.IncomeStatus
com.bifos.accountbook.domain.repository.IncomeRepository → com.bifos.accountbook.income.domain.repository.IncomeRepository
com.bifos.accountbook.application.service.IncomeService → com.bifos.accountbook.income.application.service.IncomeService
```

나머지 DTO, Controller, Converter, Repository impl/jpa, Projection도 같은 패턴으로 매핑.

### 이동 절차

1. 새 디렉터리 구조 생성 (`mkdir -p`)
2. `git mv`로 모든 파일 이동
3. 이동된 파일의 `package` 선언 수정
4. **전체 코드베이스**(src/main + src/test)에서 old import → new import 일괄 수정

## 성공 기준

- 모든 파일이 `expense/`, `income/` 하위 올바른 위치에 존재
- 이전 위치에 이동된 파일이 남아있지 않음
- `./gradlew build -x test -x checkstyleMain -x checkstyleTest --no-daemon` 성공

## 주의사항

- `Expense` 엔티티는 `@ManyToOne Family`를 유지 — JPA 관계 변경하지 않음
- `Income` 엔티티도 `@ManyToOne Family`를 유지
- `ExpenseCreatedEvent`, `ExpenseUpdatedEvent`는 expense 도메인에 배치 (발행자 원칙)
- 이 이벤트의 **리스너**(`BudgetAlertEventListener`)는 notification 도메인에 속하므로 phase 5에서 이동
- `CategoryService`가 `ObjectProvider<ExpenseService>`를 사용 — ExpenseService의 패키지가 바뀌므로 CategoryService의 import도 수정 필요
- `git mv` 사용하여 git history 보존
- 테스트 파일의 import도 반드시 수정

## Blocked 조건

`expense/` 또는 `income/` 디렉터리가 이미 존재하고 파일이 있으면:
`PHASE_BLOCKED: expense/ 또는 income/ 패키지가 이미 존재함 — 기존 구조 확인 필요`
