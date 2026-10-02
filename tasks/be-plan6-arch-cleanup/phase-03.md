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
- `ExpenseService` 가 `Clock` 을 주입받아 `BusinessTime.ZONE` 으로 업무 날짜를 만든다(ADR-B21). 같은 방식을 쓴다.

## 의도 메모

- `InvitationService` 생성자에 `Clock` 을 받는다. `InvitationResponse.from` 은 호출하는 쪽이 현재 시각을 넘기게 바꾼다(`from(invitation, now)`).
- 만료 판정이 들어 있으면 테스트에서 고정 `Clock` 으로 만료 직전과 직후를 확인한다.

## 작업 항목

### 1. `InvitationService` 에 `Clock` 주입, 네 메서드 교체

### 2. `InvitationResponse.from` 시그니처 변경과 호출부

### 3. 테스트와 기준 파일

- `backend/src/test/java/com/bifos/accountbook/invitation/application/service/InvitationServiceTest.java`(신규): 고정 `Clock` 으로 만료 판정.
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
