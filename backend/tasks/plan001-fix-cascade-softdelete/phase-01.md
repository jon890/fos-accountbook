# Phase 01: cascade 수정 + 자식 soft delete + 테스트

## 목표

Family/User 엔티티의 `CascadeType.ALL` + `orphanRemoval = true`를 `{CascadeType.PERSIST, CascadeType.MERGE}`로 변경하고, 부모 삭제 시 자식을 명시적으로 soft delete 처리한다.

## 작업 항목

1. **Family.java 수정** — 3개 `@OneToMany` 관계의 cascade + orphanRemoval 변경
   - 파일: `src/main/java/com/bifos/accountbook/family/domain/entity/Family.java`
   - 72행 `members`: `cascade = {CascadeType.PERSIST, CascadeType.MERGE}`, `orphanRemoval` 제거
   - 76행 `incomes`: 동일 변경
   - 80행 `expenses`: 동일 변경

2. **User.java 수정** — `familyMembers` 관계 동일 변경
   - 파일: `src/main/java/com/bifos/accountbook/user/domain/entity/User.java`
   - 79행 `familyMembers`: `cascade = {CascadeType.PERSIST, CascadeType.MERGE}`, `orphanRemoval` 제거

3. **FamilyService.deleteFamily() 보강** — 자식 엔티티 명시적 soft delete 추가
   - 파일: `src/main/java/com/bifos/accountbook/family/application/service/FamilyService.java`
   - `family.delete()` 호출 후 아래 로직 추가:
     - `family.getMembers()` 순회 → 각 member의 `status`를 `FamilyMemberStatus.LEFT`로 변경
     - `family.getExpenses()` 순회 → 각 expense의 `delete()` 호출 (status = DELETED)
     - `family.getIncomes()` 순회 → 각 income의 `delete()` 호출 (status = DELETED)
   - FamilyMember에 `leave()` 메서드가 없으면 추가 (status를 LEFT로 변경)

4. **Family 삭제 시 자식 soft delete 검증 테스트 작성 + 전체 테스트 통과**
   - `TestFixturesSupport` 상속 Service 테스트로 작성
   - Family 삭제 후 members/expenses/incomes가 물리 삭제되지 않고 status만 변경되었는지 검증
   - `./gradlew test --no-daemon --console=plain` 전체 통과 확인

## 검증 기준

- `CascadeType.ALL` / `orphanRemoval = true`가 Family.java, User.java에 남아있지 않음
- FamilyService.deleteFamily()에서 자식 soft delete 로직이 명시적으로 존재
- 테스트: Family 삭제 후 자식 레코드가 DB에 존재하며 status가 LEFT/DELETED로 변경됨
- 전체 테스트 통과
