# Phase 3: category 도메인 이동

## 컨텍스트

`fos-accountbook-backend`는 Spring Boot 3 + Java 21 기반 가족 가계부 백엔드다.
프로젝트 루트: `/Users/nhn/personal/fos-accountbook-backend`
소스 루트: `src/main/java/com/bifos/accountbook/`

Phase 1~2 완료 상태: `shared/`, `user/`, `family/` 패키지가 구성되어 있다.
이제 `category/` 도메인 패키지를 생성한다. Category는 expense, income, recurring 등 여러 도메인이 의존하므로 단독 phase로 처리한다.

반드시 먼저 읽을 문서:
- `CLAUDE.md` — 코딩 컨벤션
- `docs/code-architecture.md` — 도메인별 소유 원칙 (CategoryInfo DTO는 category에 배치)

## 목표

`category/` 도메인 패키지를 생성하고 관련 파일을 이동한 후, 전체 코드베이스의 import를 수정한다.

## 작업 목록

### category 도메인 이동 (old → new)

**category/domain/entity/**
- `domain/entity/Category.java` → `category/domain/entity/Category.java`

**category/domain/value/**
- `domain/value/CategoryStatus.java` → `category/domain/value/CategoryStatus.java`

**category/domain/converter/**
- `domain/entity/converter/CategoryStatusConverter.java` → `category/domain/converter/CategoryStatusConverter.java`

**category/domain/repository/**
- `domain/repository/CategoryRepository.java` → `category/domain/repository/CategoryRepository.java`

**category/infra/repository/impl/**
- `infra/persistence/repository/impl/CategoryRepositoryImpl.java` → `category/infra/repository/impl/CategoryRepositoryImpl.java`

**category/infra/repository/jpa/**
- `infra/persistence/repository/jpa/CategoryJpaRepository.java` → `category/infra/repository/jpa/CategoryJpaRepository.java`

**category/application/service/**
- `application/service/CategoryService.java` → `category/application/service/CategoryService.java`

**category/application/dto/**
- `application/dto/category/CategoryResponse.java` → `category/application/dto/CategoryResponse.java`
- `application/dto/category/CreateCategoryRequest.java` → `category/application/dto/CreateCategoryRequest.java`
- `application/dto/category/UpdateCategoryRequest.java` → `category/application/dto/UpdateCategoryRequest.java`
- `application/dto/common/CategoryInfo.java` → `category/application/dto/CategoryInfo.java`

**category/presentation/controller/**
- `presentation/controller/CategoryController.java` → `category/presentation/controller/CategoryController.java`

### import 매핑 (old → new)

```
com.bifos.accountbook.domain.entity.Category → com.bifos.accountbook.category.domain.entity.Category
com.bifos.accountbook.domain.value.CategoryStatus → com.bifos.accountbook.category.domain.value.CategoryStatus
com.bifos.accountbook.domain.entity.converter.CategoryStatusConverter → com.bifos.accountbook.category.domain.converter.CategoryStatusConverter
com.bifos.accountbook.domain.repository.CategoryRepository → com.bifos.accountbook.category.domain.repository.CategoryRepository
com.bifos.accountbook.infra.persistence.repository.impl.CategoryRepositoryImpl → com.bifos.accountbook.category.infra.repository.impl.CategoryRepositoryImpl
com.bifos.accountbook.infra.persistence.repository.jpa.CategoryJpaRepository → com.bifos.accountbook.category.infra.repository.jpa.CategoryJpaRepository
com.bifos.accountbook.application.service.CategoryService → com.bifos.accountbook.category.application.service.CategoryService
com.bifos.accountbook.application.dto.category.CategoryResponse → com.bifos.accountbook.category.application.dto.CategoryResponse
com.bifos.accountbook.application.dto.category.CreateCategoryRequest → com.bifos.accountbook.category.application.dto.CreateCategoryRequest
com.bifos.accountbook.application.dto.category.UpdateCategoryRequest → com.bifos.accountbook.category.application.dto.UpdateCategoryRequest
com.bifos.accountbook.application.dto.common.CategoryInfo → com.bifos.accountbook.category.application.dto.CategoryInfo
com.bifos.accountbook.presentation.controller.CategoryController → com.bifos.accountbook.category.presentation.controller.CategoryController
```

### 이동 절차

1. 새 디렉터리 구조 생성 (`mkdir -p`)
2. `git mv`로 모든 파일 이동
3. 이동된 파일의 `package` 선언 수정
4. **전체 코드베이스**(src/main + src/test)에서 old import → new import 일괄 수정

## 성공 기준

- 모든 파일이 `category/` 하위 올바른 위치에 존재
- 이전 위치에 이동된 파일이 남아있지 않음
- `./gradlew build -x test -x checkstyleMain -x checkstyleTest --no-daemon` 성공

## 주의사항

- `CategoryInfo`는 expense, income, recurring 도메인에서 참조됨 — 이것은 의도된 cross-domain 참조
- `CategoryService`는 `ObjectProvider<ExpenseService>`와 `ObjectProvider<RecurringExpenseService>`를 사용 — 이 시점에서 ExpenseService, RecurringExpenseService는 아직 old 패키지에 있으므로 해당 import는 phase 4~5에서 자동으로 수정됨
- `git mv` 사용하여 git history 보존
- 테스트 파일의 import도 반드시 수정

## Blocked 조건

`category/` 디렉터리가 이미 존재하고 파일이 있으면:
`PHASE_BLOCKED: category/ 패키지가 이미 존재함 — 기존 구조 확인 필요`
