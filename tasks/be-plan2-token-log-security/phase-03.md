# Phase 03. 삭제된 사용자의 연동 토큰을 막는다

**Execution profile**: fast

## 목표

탈퇴하거나 삭제된 사용자의 연동 토큰(`fab_`)으로 API 를 부르면 401 이 되게 한다. 지금은 토큰 상태만 보고 주인의 상태는 보지 않는다.

**범위 외**: JWT 경로는 바꾸지 않는다. access token 은 15분이라 짧고, refresh 는 이미 삭제된 사용자를 거부한다(`AuthService.refreshToken`).

## 컨텍스트

모든 경로는 저장소 root 기준이다. 명령은 `backend/` 에서 돌린다.

**근거 문서**: `backend/docs/flow.md` 의 「7. 연동 토큰으로 부르기」 절, `backend/docs/adr/ADR-B18-agent-integration-token.md`.

코드에서 확인한 사실:

- `backend/src/main/java/com/bifos/accountbook/apitoken/infra/repository/jpa/ApiTokenJpaRepository.java` 의 `findActiveByTokenHash` 가 토큰 `status = ACTIVE` 만 본다.
- `backend/src/main/java/com/bifos/accountbook/apitoken/domain/entity/ApiToken.java` 는 주인을 연관관계가 아니라 `CustomUuid userUuid` 로 가진다.
- `backend/src/main/java/com/bifos/accountbook/user/domain/value/UserStatus.java` 는 `ACTIVE` 를 가진다. 삭제 상태 이름은 그 파일에서 확인한다.
- 호출 흐름: `ApiTokenService.java:74` 가 `apiTokenRepository.findActiveByTokenHash(hash(rawToken))` 를 부르고, `ApiTokenAuthenticationFilter` 가 결과가 없으면 401(A002)을 낸다.

## 의도 메모

- 조회 한 번으로 끝낸다. 토큰을 찾은 뒤 사용자를 따로 조회하지 않는다.
- `UserStatus` 가 `CodeEnum` 변환기로 저장되므로 JPQL 에 enum 상수를 직접 쓰면 변환이 맞지 않을 수 있다. 테스트로 확인하고, 맞지 않으면 파라미터로 넘긴다.

## 작업 항목

### 1. `ApiTokenJpaRepository.findActiveByTokenHash` 조건에 주인 상태 추가

- 토큰 주인(`User.uuid = t.userUuid`)이 ACTIVE 일 때만 찾는다. `EXISTS` 서브쿼리나 조인으로 쓴다.
- 메서드 이름과 시그니처는 그대로 둔다.

### 2. 이 phase 를 검증하는 `ApiTokenAuthenticationFilterTest` 케이스

- 토큰을 발급한 사용자를 삭제 상태로 바꾼 뒤 그 토큰으로 허용 경로를 부르면 401.
- 같은 테스트 안의 기존 정상 케이스가 그대로 통과한다.

## 검증

`backend/` 에서 실행한다. `gradle/wrapper/gradle-wrapper.jar` 가 없으면 먼저 `mise exec gradle@9.8.0 -- gradle wrapper --gradle-version 9.8.0` 을 돌린다. jar 는 커밋하지 않는다.

```bash
./gradlew test --tests "com.bifos.accountbook.config.security.ApiTokenAuthenticationFilterTest"
./gradlew checkstyleMain checkstyleTest test
```

기대값: 두 명령 모두 BUILD SUCCESSFUL.

## 변경 파일

| 파일 | 변경 |
|---|---|
| `backend/src/main/java/com/bifos/accountbook/apitoken/infra/repository/jpa/ApiTokenJpaRepository.java` | 수정 |
| `backend/src/test/java/com/bifos/accountbook/config/security/ApiTokenAuthenticationFilterTest.java` | 수정 |
