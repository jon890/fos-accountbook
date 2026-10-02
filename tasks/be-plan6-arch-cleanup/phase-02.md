# Phase 02. 가족 접근 검증 AOP 를 family 로 옮긴다 (위반 16건)

**Execution profile**: standard
**Domain**: backend-domain

## 목표

`shared/aop` 의 가족 접근 검증 다섯 파일을 `family/application/access/` 로 옮겨 「shared 는 도메인 패키지에 의존하지 않는다」 13건과 「Transactional 은 application 안에서만 쓴다」 3건을 없애고, 두 기준 파일에서 그 줄을 지운다.

**범위 외**: 로직은 바꾸지 않는다. 패키지와 import 만 바꾼다.

## 컨텍스트

모든 경로는 저장소 root 기준이다. 명령은 `backend/` 에서 돌린다. `gradle-wrapper.jar` 가 없으면 먼저 `mise exec gradle@9.8.0 -- gradle wrapper --gradle-version 9.8.0` 으로 만들고 커밋하지 않는다.

**기준 파일 규칙**(ADR-B22, `backend/CLAUDE.md` 코드 스타일 표): 위반을 고친 뒤 `./gradlew archTest -Parchunit.freeze.store.default.allowStoreUpdate=true` 로 기준에서 사라진 항목만 줄인다. 이 옵션으로 새 위반을 기준에 넣지 않는다. 실행 전후 `git diff backend/config/archunit/store/` 로 줄어들기만 했는지 확인한다.

**근거 문서**: `backend/docs/adr/ADR-B22-static-analysis-tools.md`, `backend/docs/adr/ADR-B16-domain-package-structure.md`, `backend/docs/code-architecture.md`. 규칙 정의는 `backend/src/test/java/com/bifos/accountbook/architecture/ArchitectureRules.java`.

코드에서 확인한 사실:

- `backend/src/main/java/com/bifos/accountbook/shared/aop/` 에 `FamilyAccessAspect.java`, `FamilyUuid.java`, `FamilyValidationService.java`, `UserUuid.java`, `ValidateFamilyAccess.java` 가 있다.
- 위반 16건은 모두 `FamilyValidationService` 다. family 의 `FamilyRepository`, `FamilyMemberRepository`, `Family`, `FamilyMember`, `FamilyMemberRole` 을 쓰고(13건), `validateFamilyAccess`(34행), `validateFamilyOwner`(53행), `validateAndGetFamily`(81행)에 `@Transactional` 이 있다(3건).
- `FamilyValidationService` 만 옮기면 남은 `FamilyAccessAspect` 가 family 를 참조해 shared→domain 위반이 새로 생긴다. 그래서 다섯 파일을 함께 옮긴다.
- `shared.aop` 를 import 하는 곳은 main, test 합쳐 14개다(`grep -rln "shared.aop" backend/src`). 여러 도메인의 application 서비스가 `@ValidateFamilyAccess` 와 `FamilyValidationService` 를 쓴다.
- 테스트 `backend/src/test/java/com/bifos/accountbook/shared/aop/FamilyAccessAspectTest.java`.

## 의도 메모

- 새 패키지는 `com.bifos.accountbook.family.application.access`. 다른 도메인의 application 이 이 패키지를 쓰는 것은 기존 규칙(`ExpenseService` 가 `CategoryService` 를 쓰는 것과 같은 도메인 간 application 참조)에 맞는다.
- AOP 포인트컷이 패키지 이름을 문자열로 가리키면(`@Around("@annotation(com.bifos...shared.aop.ValidateFamilyAccess)")` 같은 것) 함께 고친다. 놓치면 컴파일은 되지만 검증이 조용히 꺼진다. 테스트로 막는다.
- 테스트도 `backend/src/test/java/com/bifos/accountbook/family/application/access/FamilyAccessAspectTest.java` 로 옮긴다.

## 작업 항목

### 1. 다섯 파일 이동과 패키지 선언, 포인트컷 문자열

### 2. import 하는 14곳 갱신 (`grep -rln "shared.aop" backend/src` 결과 전부)

### 3. 테스트 이동과 포인트컷 동작 확인

옮긴 `FamilyAccessAspectTest` 가 다른 가족 접근을 실제로 거절하는지(403) 확인하는 경우를 포함한다.

### 4. 기준 파일 줄이기

`archTest` 를 `allowStoreUpdate=true` 로 한 번 돌려 shared, Transactional 기준 파일에서 사라진 16줄만 지운다.

## 검증

`backend/` 에서 실행한다.

```bash
./gradlew qualityCheck test --tests '*FamilyAccessAspectTest*'
./gradlew qualityCheck test build
```

기대값: 모든 명령이 성공한다. `grep -rn "shared.aop" backend/src` 결과가 없다.

## 변경 파일

| 파일 | 변경 |
|---|---|
| `backend/src/main/java/com/bifos/accountbook/shared/aop/FamilyAccessAspect.java` | 삭제 |
| `backend/src/main/java/com/bifos/accountbook/shared/aop/FamilyUuid.java` | 삭제 |
| `backend/src/main/java/com/bifos/accountbook/shared/aop/FamilyValidationService.java` | 삭제 |
| `backend/src/main/java/com/bifos/accountbook/shared/aop/UserUuid.java` | 삭제 |
| `backend/src/main/java/com/bifos/accountbook/shared/aop/ValidateFamilyAccess.java` | 삭제 |
| `backend/src/main/java/com/bifos/accountbook/family/application/access/FamilyAccessAspect.java` | 신규 |
| `backend/src/main/java/com/bifos/accountbook/family/application/access/FamilyUuid.java` | 신규 |
| `backend/src/main/java/com/bifos/accountbook/family/application/access/FamilyValidationService.java` | 신규 |
| `backend/src/main/java/com/bifos/accountbook/family/application/access/UserUuid.java` | 신규 |
| `backend/src/main/java/com/bifos/accountbook/family/application/access/ValidateFamilyAccess.java` | 신규 |
| `backend/src/test/java/com/bifos/accountbook/shared/aop/FamilyAccessAspectTest.java` | 삭제 |
| `backend/src/test/java/com/bifos/accountbook/family/application/access/FamilyAccessAspectTest.java` | 신규 |
| `backend/src/main/java/com/bifos/accountbook/**/*.java` | 수정 |
| `backend/config/archunit/store/**` | 수정 |
