# Phase 04. user 의 요청과 응답 DTO 를 application 으로 옮긴다 (위반 48건)

**Execution profile**: fast
**Domain**: backend-domain

## 목표

`AuthService` 와 `UserProfileService` 가 쓰는 DTO 를 `user/application/dto/` 로 옮겨 「층은 presentation 에서 application 을 거쳐 domain 으로 흐른다」 48건을 없앤다. 이 phase 가 끝나면 ArchUnit 기준 파일의 모든 규칙이 비고 #419 를 닫을 수 있다.

**범위 외**: 필드와 JSON 모양은 바꾸지 않는다. 패키지와 import 만 바꾼다.

## 컨텍스트

모든 경로는 저장소 root 기준이다. 명령은 `backend/` 에서 돌린다. `gradle-wrapper.jar` 가 없으면 먼저 `mise exec gradle@9.8.0 -- gradle wrapper --gradle-version 9.8.0` 으로 만들고 커밋하지 않는다.

**기준 파일 규칙**(ADR-B22, `backend/CLAUDE.md` 코드 스타일 표): 위반을 고친 뒤 `./gradlew archTest -Parchunit.freeze.store.default.allowStoreUpdate=true` 로 기준에서 사라진 항목만 줄인다. 이 옵션으로 새 위반을 기준에 넣지 않는다. 실행 전후 `git diff backend/config/archunit/store/` 로 줄어들기만 했는지 확인한다.

**근거 문서**: `backend/docs/adr/ADR-B22-static-analysis-tools.md`, `backend/docs/adr/ADR-B16-domain-package-structure.md`, `backend/docs/code-architecture.md`. 규칙 정의는 `backend/src/test/java/com/bifos/accountbook/architecture/ArchitectureRules.java`.

코드에서 확인한 사실:

- `backend/src/main/java/com/bifos/accountbook/user/presentation/dto/` 에 `AuthResponse.java`(중첩 `UserInfo` 포함), `RefreshTokenRequest.java`, `SocialLoginRequest.java`, `UpdateUserProfileRequest.java`, `UserProfileResponse.java` 가 있다.
- `backend/src/main/java/com/bifos/accountbook/user/application/service/AuthService.java` 가 `SocialLoginRequest`, `AuthResponse`, `UserInfo` 를 쓴다(33건). `backend/src/main/java/com/bifos/accountbook/user/application/service/UserProfileService.java` 가 `UpdateUserProfileRequest`, `UserProfileResponse` 를 쓴다(15건).
- 이 DTO 를 import 하는 곳: 위 두 서비스, `backend/src/main/java/com/bifos/accountbook/user/presentation/controller/AuthController.java`, `backend/src/main/java/com/bifos/accountbook/user/presentation/controller/UserProfileController.java`, `backend/src/test/java/com/bifos/accountbook/user/presentation/controller/AuthControllerTest.java`, `backend/src/test/java/com/bifos/accountbook/user/presentation/controller/UserProfileControllerTest.java`.
- `backend/src/main/java/com/bifos/accountbook/user/application/` 에는 지금 `service/` 만 있다. 다른 도메인은 `category/application/dto/`, `invitation/application/dto/` 처럼 application 에 DTO 를 둔다.

## 의도 메모

- 서비스가 쓰는 네 파일(`AuthResponse`, `SocialLoginRequest`, `UpdateUserProfileRequest`, `UserProfileResponse`)을 옮긴다. `RefreshTokenRequest` 는 `AuthController` 만 쓰므로 그대로 둔다.
- 옮긴 뒤 `archTest` 를 `allowStoreUpdate=true` 로 돌려 층 규칙 기준 파일의 48줄을 지운다. 이 phase 가 끝나면 기준 파일 내용이 모두 비어야 한다. 비지 않으면 남은 항목을 보고에 적는다.
- `backend/docs/code-architecture.md` 의 DTO 배치 설명이 이 상태와 맞는지 확인하고, 다르면 같은 커밋에서 고친다.

## 작업 항목

### 1. 네 DTO 이동과 import 갱신

### 2. 기준 파일 줄이기와 비었는지 확인

### 3. 문서 대조

### 4. 테스트

- `backend/src/test/java/com/bifos/accountbook/user/presentation/controller/AuthControllerTest.java`(수정), `backend/src/test/java/com/bifos/accountbook/user/presentation/controller/UserProfileControllerTest.java`(수정): import 만 바뀌고 JSON 응답 단언이 그대로 통과한다.
- `./gradlew archTest` 가 기준 파일이 빈 상태로 통과한다(`ArchitectureRulesTest`).

## 검증

`backend/` 에서 실행한다.

```bash
./gradlew qualityCheck test --tests '*AuthControllerTest*' --tests '*UserProfileControllerTest*'
./gradlew archTest
./gradlew qualityCheck test build
```

기대값: 모든 명령이 성공한다. `backend/config/archunit/store/` 의 규칙 파일에 위반 줄이 남지 않는다.

## 변경 파일

| 파일 | 변경 |
|---|---|
| `backend/src/main/java/com/bifos/accountbook/user/presentation/dto/AuthResponse.java` | 삭제 |
| `backend/src/main/java/com/bifos/accountbook/user/presentation/dto/SocialLoginRequest.java` | 삭제 |
| `backend/src/main/java/com/bifos/accountbook/user/presentation/dto/UpdateUserProfileRequest.java` | 삭제 |
| `backend/src/main/java/com/bifos/accountbook/user/presentation/dto/UserProfileResponse.java` | 삭제 |
| `backend/src/main/java/com/bifos/accountbook/user/application/dto/AuthResponse.java` | 신규 |
| `backend/src/main/java/com/bifos/accountbook/user/application/dto/SocialLoginRequest.java` | 신규 |
| `backend/src/main/java/com/bifos/accountbook/user/application/dto/UpdateUserProfileRequest.java` | 신규 |
| `backend/src/main/java/com/bifos/accountbook/user/application/dto/UserProfileResponse.java` | 신규 |
| `backend/src/main/java/com/bifos/accountbook/user/application/service/AuthService.java` | 수정 |
| `backend/src/main/java/com/bifos/accountbook/user/application/service/UserProfileService.java` | 수정 |
| `backend/src/main/java/com/bifos/accountbook/user/presentation/controller/AuthController.java` | 수정 |
| `backend/src/main/java/com/bifos/accountbook/user/presentation/controller/UserProfileController.java` | 수정 |
| `backend/src/test/java/com/bifos/accountbook/user/presentation/controller/AuthControllerTest.java` | 수정 |
| `backend/src/test/java/com/bifos/accountbook/user/presentation/controller/UserProfileControllerTest.java` | 수정 |
| `backend/config/archunit/store/**` | 수정 |
| `backend/docs/code-architecture.md` | 수정 |
