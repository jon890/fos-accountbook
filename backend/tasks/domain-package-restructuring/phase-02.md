# Phase 2: user + family 도메인 이동

## 컨텍스트

`fos-accountbook-backend`는 Spring Boot 3 + Java 21 기반 가족 가계부 백엔드다.
프로젝트 루트: `/Users/nhn/personal/fos-accountbook-backend`
소스 루트: `src/main/java/com/bifos/accountbook/`

Phase 1에서 `shared/` 패키지가 구성 완료된 상태다. 이제 `user/`와 `family/` 도메인 패키지를 생성하고 관련 파일을 이동한다. 이 두 도메인은 다른 모든 도메인의 기반이 되므로 먼저 이동한다.

반드시 먼저 읽을 문서:
- `CLAUDE.md` — 코딩 컨벤션
- `docs/code-architecture.md` — 도메인 기반 패키지 구조, 도메인별 소유 원칙

## 목표

`user/`와 `family/` 도메인 패키지를 생성하고 관련 파일을 이동한 후, 전체 코드베이스의 import를 수정한다.

## 작업 목록

### user 도메인 이동 (old → new)

**user/domain/entity/**
- `domain/entity/User.java` → `user/domain/entity/User.java`
- `domain/entity/UserProfile.java` → `user/domain/entity/UserProfile.java`

**user/domain/value/**
- `domain/value/UserStatus.java` → `user/domain/value/UserStatus.java`

**user/domain/converter/**
- `domain/entity/converter/UserStatusConverter.java` → `user/domain/converter/UserStatusConverter.java`

**user/domain/repository/**
- `domain/repository/UserRepository.java` → `user/domain/repository/UserRepository.java`
- `domain/repository/UserProfileRepository.java` → `user/domain/repository/UserProfileRepository.java`

**user/infra/repository/impl/**
- `infra/persistence/repository/impl/UserRepositoryImpl.java` → `user/infra/repository/impl/UserRepositoryImpl.java`

**user/infra/repository/jpa/**
- `infra/persistence/repository/jpa/UserJpaRepository.java` → `user/infra/repository/jpa/UserJpaRepository.java`

**user/application/service/**
- `application/service/UserService.java` → `user/application/service/UserService.java`
- `application/service/AuthService.java` → `user/application/service/AuthService.java`
- `application/service/UserProfileService.java` → `user/application/service/UserProfileService.java`

**user/presentation/controller/**
- `presentation/controller/AuthController.java` → `user/presentation/controller/AuthController.java`
- `presentation/controller/UserProfileController.java` → `user/presentation/controller/UserProfileController.java`

**user/presentation/dto/**
- `presentation/dto/auth/AuthResponse.java` → `user/presentation/dto/AuthResponse.java`
- `presentation/dto/auth/RefreshTokenRequest.java` → `user/presentation/dto/RefreshTokenRequest.java`
- `presentation/dto/auth/SocialLoginRequest.java` → `user/presentation/dto/SocialLoginRequest.java`
- `application/dto/profile/UpdateUserProfileRequest.java` → `user/presentation/dto/UpdateUserProfileRequest.java`
- `application/dto/profile/UserProfileResponse.java` → `user/presentation/dto/UserProfileResponse.java`

### family 도메인 이동 (old → new)

**family/domain/entity/**
- `domain/entity/Family.java` → `family/domain/entity/Family.java`
- `domain/entity/FamilyMember.java` → `family/domain/entity/FamilyMember.java`

**family/domain/value/**
- `domain/value/FamilyStatus.java` → `family/domain/value/FamilyStatus.java`
- `domain/value/FamilyMemberStatus.java` → `family/domain/value/FamilyMemberStatus.java`
- `domain/value/FamilyMemberRole.java` → `family/domain/value/FamilyMemberRole.java`

**family/domain/converter/**
- `domain/entity/converter/FamilyStatusConverter.java` → `family/domain/converter/FamilyStatusConverter.java`
- `domain/entity/converter/FamilyMemberStatusConverter.java` → `family/domain/converter/FamilyMemberStatusConverter.java`
- `domain/entity/converter/FamilyMemberRoleConverter.java` → `family/domain/converter/FamilyMemberRoleConverter.java`

**family/domain/repository/**
- `domain/repository/FamilyRepository.java` → `family/domain/repository/FamilyRepository.java`
- `domain/repository/FamilyMemberRepository.java` → `family/domain/repository/FamilyMemberRepository.java`
- `domain/repository/projection/FamilyWithCountsProjection.java` → `family/domain/repository/projection/FamilyWithCountsProjection.java`

**family/infra/repository/impl/**
- `infra/persistence/repository/impl/FamilyRepositoryImpl.java` → `family/infra/repository/impl/FamilyRepositoryImpl.java`
- `infra/persistence/repository/impl/FamilyMemberRepositoryImpl.java` → `family/infra/repository/impl/FamilyMemberRepositoryImpl.java`

**family/infra/repository/jpa/**
- `infra/persistence/repository/jpa/FamilyJpaRepository.java` → `family/infra/repository/jpa/FamilyJpaRepository.java`
- `infra/persistence/repository/jpa/FamilyMemberJpaRepository.java` → `family/infra/repository/jpa/FamilyMemberJpaRepository.java`

**family/application/service/**
- `application/service/FamilyService.java` → `family/application/service/FamilyService.java`

**family/application/dto/**
- `application/dto/family/CreateFamilyRequest.java` → `family/application/dto/CreateFamilyRequest.java`
- `application/dto/family/FamilyResponse.java` → `family/application/dto/FamilyResponse.java`
- `application/dto/family/UpdateFamilyRequest.java` → `family/application/dto/UpdateFamilyRequest.java`

**family/presentation/controller/**
- `presentation/controller/FamilyController.java` → `family/presentation/controller/FamilyController.java`

### 이동 절차

1. 새 디렉터리 구조 생성 (`mkdir -p`)
2. `git mv`로 모든 파일 이동
3. 이동된 파일의 `package` 선언 수정
4. **전체 코드베이스**(src/main + src/test)에서 old import → new import 일괄 수정

### import 매핑 핵심 (old → new 패턴)

```
com.bifos.accountbook.domain.entity.User → com.bifos.accountbook.user.domain.entity.User
com.bifos.accountbook.domain.entity.UserProfile → com.bifos.accountbook.user.domain.entity.UserProfile
com.bifos.accountbook.domain.value.UserStatus → com.bifos.accountbook.user.domain.value.UserStatus
com.bifos.accountbook.domain.repository.UserRepository → com.bifos.accountbook.user.domain.repository.UserRepository
com.bifos.accountbook.domain.repository.UserProfileRepository → com.bifos.accountbook.user.domain.repository.UserProfileRepository
com.bifos.accountbook.application.service.UserService → com.bifos.accountbook.user.application.service.UserService
com.bifos.accountbook.application.service.AuthService → com.bifos.accountbook.user.application.service.AuthService
com.bifos.accountbook.application.service.UserProfileService → com.bifos.accountbook.user.application.service.UserProfileService

com.bifos.accountbook.domain.entity.Family → com.bifos.accountbook.family.domain.entity.Family
com.bifos.accountbook.domain.entity.FamilyMember → com.bifos.accountbook.family.domain.entity.FamilyMember
com.bifos.accountbook.domain.value.FamilyStatus → com.bifos.accountbook.family.domain.value.FamilyStatus
com.bifos.accountbook.domain.value.FamilyMemberStatus → com.bifos.accountbook.family.domain.value.FamilyMemberStatus
com.bifos.accountbook.domain.value.FamilyMemberRole → com.bifos.accountbook.family.domain.value.FamilyMemberRole
com.bifos.accountbook.domain.repository.FamilyRepository → com.bifos.accountbook.family.domain.repository.FamilyRepository
com.bifos.accountbook.domain.repository.FamilyMemberRepository → com.bifos.accountbook.family.domain.repository.FamilyMemberRepository
com.bifos.accountbook.application.service.FamilyService → com.bifos.accountbook.family.application.service.FamilyService
```

나머지 DTO, Controller, Converter, Repository impl/jpa도 같은 패턴으로 매핑. 모든 import를 빠짐없이 수정할 것.

## 성공 기준

- 모든 파일이 `user/`, `family/` 하위 올바른 위치에 존재
- 이전 위치에 이동된 파일이 남아있지 않음
- `./gradlew build -x test -x checkstyleMain -x checkstyleTest --no-daemon` 성공

## 주의사항

- `git mv` 사용하여 git history 보존
- Family 엔티티의 `@OneToMany` 관계 (expenses, incomes, members)는 그대로 유지 — JPA 관계는 이번 리팩토링에서 변경하지 않음
- FamilyMember가 User를 `@ManyToOne`으로 참조 — `user` 도메인 패키지의 User를 import하게 됨 (의도된 cross-domain 참조)
- 테스트 파일의 import도 반드시 수정 (phase 6에서 테스트 파일 자체를 이동하지만, import는 지금 수정해야 빌드가 통과함)
- Converter 클래스는 `domain/converter/`에 배치 (shared의 `AbstractCodeEnumConverter`를 상속)

## Blocked 조건

`user/` 또는 `family/` 디렉터리가 이미 존재하고 파일이 있으면:
`PHASE_BLOCKED: user/ 또는 family/ 패키지가 이미 존재함 — 기존 구조 확인 필요`
