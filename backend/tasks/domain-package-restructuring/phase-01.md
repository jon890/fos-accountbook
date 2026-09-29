# Phase 1: shared/ 패키지 구성

## 컨텍스트

`fos-accountbook-backend`는 Spring Boot 3 + Java 21 기반 가족 가계부 백엔드다.
프로젝트 루트: `/Users/nhn/personal/fos-accountbook-backend`
소스 루트: `src/main/java/com/bifos/accountbook/`

현재 레이어 기반 패키지 구조를 도메인 기반으로 전환하는 리팩토링의 첫 phase다.
여러 도메인이 공유하는 공통 컴포넌트를 `shared/` 패키지로 이동한다.

반드시 먼저 읽을 문서:

- `CLAUDE.md` — 코딩 컨벤션
- `docs/code-architecture.md` — 도메인 기반 패키지 구조 (Target State)
- `docs/adr.md` — ADR-B16 (도메인 기반 패키지 리팩토링 결정)

## 목표

`shared/` 하위 패키지를 생성하고, 공통 컴포넌트를 이동한 후, 전체 코드베이스의 import를 수정한다.

## 작업 목록

### 이동 대상 파일 (old → new)

**shared/auth/**

- `presentation/annotation/LoginUser.java` → `shared/auth/LoginUser.java`
- `presentation/dto/LoginUserDto.java` → `shared/auth/LoginUserDto.java`
- `presentation/resolver/LoginUserArgumentResolver.java` → `shared/auth/LoginUserArgumentResolver.java`

**shared/aop/**

- `application/aspect/FamilyAccessAspect.java` → `shared/aop/FamilyAccessAspect.java`
- `presentation/annotation/ValidateFamilyAccess.java` → `shared/aop/ValidateFamilyAccess.java`
- `presentation/annotation/FamilyUuid.java` → `shared/aop/FamilyUuid.java`
- `presentation/annotation/UserUuid.java` → `shared/aop/UserUuid.java`
- `application/service/FamilyValidationService.java` → `shared/aop/FamilyValidationService.java`

**shared/dto/**

- `presentation/dto/ApiSuccessResponse.java` → `shared/dto/ApiSuccessResponse.java`
- `presentation/dto/ApiErrorResponse.java` → `shared/dto/ApiErrorResponse.java`
- `application/dto/common/PaginationResponse.java` → `shared/dto/PaginationResponse.java`

**shared/exception/**

- `application/exception/BusinessException.java` → `shared/exception/BusinessException.java`
- `application/exception/ErrorCode.java` → `shared/exception/ErrorCode.java`
- `config/GlobalExceptionHandler.java` → `shared/exception/GlobalExceptionHandler.java`

**shared/value/**

- `domain/value/CustomUuid.java` → `shared/value/CustomUuid.java`
- `domain/value/CodeEnum.java` → `shared/value/CodeEnum.java`

**shared/converter/**

- `domain/entity/converter/UuidConverter.java` → `shared/converter/UuidConverter.java`
- `domain/entity/converter/AbstractCodeEnumConverter.java` → `shared/converter/AbstractCodeEnumConverter.java`

**shared/filter/**

- `infra/filter/RequestResponseLoggingFilter.java` → `shared/filter/RequestResponseLoggingFilter.java`

**shared/utils/**

- `utils/TimeUtils.java` → `shared/utils/TimeUtils.java`

### 이동 절차

각 파일에 대해:

1. 새 디렉터리 생성 (`mkdir -p`)
2. `git mv`로 파일 이동
3. 이동된 파일의 `package` 선언 수정
4. **전체 코드베이스**에서 해당 클래스의 old import를 new import로 일괄 수정

import 수정 시 주의:

- `grep -r` 또는 Grep 도구로 old import를 찾아 모든 파일 수정
- static import도 포함 (`import static`)
- 테스트 파일(`src/test/`)도 포함하여 수정

### import 매핑 (old → new)

```
com.bifos.accountbook.presentation.annotation.LoginUser → com.bifos.accountbook.shared.auth.LoginUser
com.bifos.accountbook.presentation.dto.LoginUserDto → com.bifos.accountbook.shared.auth.LoginUserDto
com.bifos.accountbook.presentation.resolver.LoginUserArgumentResolver → com.bifos.accountbook.shared.auth.LoginUserArgumentResolver
com.bifos.accountbook.application.aspect.FamilyAccessAspect → com.bifos.accountbook.shared.aop.FamilyAccessAspect
com.bifos.accountbook.presentation.annotation.ValidateFamilyAccess → com.bifos.accountbook.shared.aop.ValidateFamilyAccess
com.bifos.accountbook.presentation.annotation.FamilyUuid → com.bifos.accountbook.shared.aop.FamilyUuid
com.bifos.accountbook.presentation.annotation.UserUuid → com.bifos.accountbook.shared.aop.UserUuid
com.bifos.accountbook.application.service.FamilyValidationService → com.bifos.accountbook.shared.aop.FamilyValidationService
com.bifos.accountbook.presentation.dto.ApiSuccessResponse → com.bifos.accountbook.shared.dto.ApiSuccessResponse
com.bifos.accountbook.presentation.dto.ApiErrorResponse → com.bifos.accountbook.shared.dto.ApiErrorResponse
com.bifos.accountbook.application.dto.common.PaginationResponse → com.bifos.accountbook.shared.dto.PaginationResponse
com.bifos.accountbook.application.exception.BusinessException → com.bifos.accountbook.shared.exception.BusinessException
com.bifos.accountbook.application.exception.ErrorCode → com.bifos.accountbook.shared.exception.ErrorCode
com.bifos.accountbook.config.GlobalExceptionHandler → com.bifos.accountbook.shared.exception.GlobalExceptionHandler
com.bifos.accountbook.domain.value.CustomUuid → com.bifos.accountbook.shared.value.CustomUuid
com.bifos.accountbook.domain.value.CodeEnum → com.bifos.accountbook.shared.value.CodeEnum
com.bifos.accountbook.domain.entity.converter.UuidConverter → com.bifos.accountbook.shared.converter.UuidConverter
com.bifos.accountbook.domain.entity.converter.AbstractCodeEnumConverter → com.bifos.accountbook.shared.converter.AbstractCodeEnumConverter
com.bifos.accountbook.infra.filter.RequestResponseLoggingFilter → com.bifos.accountbook.shared.filter.RequestResponseLoggingFilter
com.bifos.accountbook.utils.TimeUtils → com.bifos.accountbook.shared.utils.TimeUtils
```

## 성공 기준

- 모든 파일이 `shared/` 하위 올바른 위치에 존재
- 이전 위치에 이동된 파일이 남아있지 않음 (빈 디렉터리는 phase 7에서 정리)
- `./gradlew build -x test -x checkstyleMain -x checkstyleTest --no-daemon` 성공

## 주의사항

- `config/` 패키지는 건드리지 않는다 (SecurityConfig, CacheConfig 등은 최상위 유지)
- `AccountBookApplication.java`는 최상위 `com.bifos.accountbook`에 유지
- `git mv`를 사용하여 git history 보존
- import 수정 시 와일드카드 import(`import java.util.*`) 사용 금지
- 한 파일씩 이동하지 말고, 전체 shared/ 파일을 먼저 이동한 후 import를 일괄 수정하는 것이 효율적

## Blocked 조건

`shared/` 디렉터리가 이미 존재하고 파일이 있으면:
`PHASE_BLOCKED: shared/ 패키지가 이미 존재함 — 기존 구조 확인 필요`
