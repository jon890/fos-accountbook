# Phase 03. 초대의 인자 없는 now() 를 Clock 으로 (위반 5건)

**Execution profile**: fast
**Domain**: backend-domain

## 목표

초대 생성, 조회, 수락이 업무 날짜에 `Clock` 을 쓰고, 「application 과 presentation 은 업무 날짜에 인자 없는 now 를 직접 부르지 않는다」 5건이 기준 파일에서 사라진다.

**범위 외**: 감사 시각(`createdAt` 등 JPA Auditing)은 바꾸지 않는다(ADR-B21).

## 컨텍스트

모든 경로는 저장소 root 기준이다. 명령은 `backend/` 에서 돌린다. `gradle-wrapper.jar` 가 없으면 먼저 `mise exec gradle@9.8.0 -- gradle wrapper --gradle-version 9.8.0` 으로 만들고 커밋하지 않는다.

**기준 파일 규칙**(ADR-B22, `backend/CLAUDE.md` 코드 스타일 표): 위반을 고친 뒤 `./gradlew archTest -Parchunit.freeze.store.default.allowStoreUpdate=true` 로 기준에서 사라진 항목만 줄인다. 이 옵션으로 새 위반을 기준에 넣지 않는다. 실행 전후 `git diff backend/config/archunit/store/` 로 줄어들기만 했는지 확인한다.

**근거 문서**: `backend/docs/adr/ADR-B22-static-analysis-tools.md`, `backend/docs/adr/ADR-B16-domain-package-structure.md`, `backend/docs/code-architecture.md`. 규칙 정의는 `backend/src/test/java/com/bifos/accountbook/architecture/ArchitectureRules.java`.

코드에서 확인한 사실:

- `backend/src/main/java/com/bifos/accountbook/invitation/application/dto/InvitationResponse.java` 44행 `from` 이 `now()` 를 쓴다.
- `backend/src/main/java/com/bifos/accountbook/invitation/application/service/InvitationService.java` 68행 `createInvitation`, 101행 `getFamilyInvitations`, 112행 `getInvitationByToken`, 140행 `acceptInvitation` 이 `now()` 를 쓴다.
- `ExpenseService` 가 `Clock` 을 주입받아 `BusinessTime.ZONE` 으로 업무 날짜를 만든다(ADR-B21). `Clock` 을 주입받는 방식만 따르고, 시간대는 의도 메모를 따른다.

## 의도 메모

- `InvitationService` 생성자에 `Clock` 을 받는다. `InvitationResponse.from` 은 호출하는 쪽이 현재 시각을 넘기게 바꾼다(`from(invitation, now)`).
- 시각은 `LocalDateTime.now(clock)` 으로 쓴다. `withZone(BusinessTime.ZONE)` 은 쓰지 않는다. 초대 만료 시각은 업무 날짜가 아니라 저장된 `LocalDateTime` 끼리의 비교값이고, `ClockConfig` 는 `Clock.systemDefaultZone()` 이라 저장값과 같은 시간대를 유지해야 한다(ADR-B21: 저장된 값의 해석은 바꾸지 않는다).
- `Invitation.accept()`, `isExpired()` 는 도메인 엔티티이고 이 phase 범위 밖이라 바꾸지 않는다. 그래서 `acceptInvitation` 은 고정 `Clock` 으로 만료 직전을 만들 수 없다. 만료 테스트는 `getInvitationByToken` 과 `InvitationResponse` 의 `isExpired` 로 한정한다.
- `InvitationResponse.from` 은 서비스가 직접 부르지 않고 `fromWithFamilyName`, `fromWithDetails` 안에서 부른다. 이 두 정적 메서드도 `now` 인자를 받게 바꾸고 호출부(서비스)가 `LocalDateTime.now(clock)` 을 넘긴다.
- `InvitationServiceTest` 는 Mockito 단위 테스트로 만들고 고정 `Clock`(`Clock.fixed`)을 생성자에 넘긴다.

## 작업 항목

### 1. `InvitationService` 에 `Clock` 주입, 네 메서드 교체

### 2. `InvitationResponse.from` 시그니처 변경과 호출부

### 3. 테스트와 기준 파일

- `backend/src/test/java/com/bifos/accountbook/invitation/application/service/InvitationServiceTest.java`(신규): 고정 `Clock` 으로 `getInvitationByToken` 과 응답의 `isExpired` 만료 직전과 직후. `ArgumentCaptor` 로 `findValidByToken` 에 넘긴 `now` 가 `LocalDateTime.now(fixedClock)` 와 같은지도 단언한다.
- 기준 파일에서 now 규칙 5줄만 지운다.

## 검증

`backend/` 에서 실행한다.

```bash
./gradlew qualityCheck test --tests '*Invitation*'
./gradlew qualityCheck test build
```

기대값: 모든 명령이 성공한다.

## 변경 파일

| 파일 | 변경 |
|---|---|
| `backend/src/main/java/com/bifos/accountbook/invitation/application/service/InvitationService.java` | 수정 |
| `backend/src/main/java/com/bifos/accountbook/invitation/application/dto/InvitationResponse.java` | 수정 |
| `backend/src/test/java/com/bifos/accountbook/invitation/application/service/InvitationServiceTest.java` | 신규 |
| `backend/config/archunit/store/**` | 수정 |
