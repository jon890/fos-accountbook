# Phase 01: cascade 수정 + 테스트 검증

## 목표

Family/User 엔티티의 `CascadeType.ALL` + `orphanRemoval = true`를 `{CascadeType.PERSIST, CascadeType.MERGE}`로 변경하여 Soft Delete 정책과의 충돌을 해소한다.

## 작업 항목

1. **Family.java 수정** — 3개 `@OneToMany` 관계의 cascade + orphanRemoval 변경
   - 파일: `src/main/java/com/bifos/accountbook/family/domain/entity/Family.java`
   - 72행 `members`:
     - `cascade = {CascadeType.PERSIST, CascadeType.MERGE}`
     - `orphanRemoval` 속성 제거 (또는 `false`로 변경)
   - 76행 `incomes`: 동일 변경
   - 80행 `expenses`: 동일 변경

2. **User.java 수정** — `familyMembers` 관계 동일 변경
   - 파일: `src/main/java/com/bifos/accountbook/user/domain/entity/User.java`
   - 79행 `familyMembers`:
     - `cascade = {CascadeType.PERSIST, CascadeType.MERGE}`
     - `orphanRemoval` 속성 제거 (또는 `false`로 변경)
   - User 삭제 시 FamilyMember 처리 전략: `status = LEFT`로 soft delete 처리 (FK 제약으로 물리 삭제 방지)

3. **자식 엔티티 명시적 soft delete 로직 확인**
   - `FamilyService.deleteFamily()`에서 `family.delete()` 호출 후 members/incomes/expenses 각각 `status = DELETED`로 변경하는 로직이 존재하는지 확인한다.
   - 누락 시 명시적 soft delete 호출을 추가한다.

4. **기존 테스트 실행** — 변경 후 전체 테스트 통과 확인
   - `./gradlew test --no-daemon --console=plain`

## 검증 기준

- 전체 테스트 통과 (특히 Family/Expense/Income 관련 테스트)
- `CascadeType.ALL` / `orphanRemoval = true`가 Family.java, User.java에 남아있지 않음
- Family/User 삭제 후 자식 레코드가 하드 삭제되지 않고 `status = DELETED`(또는 `LEFT`)로만 변경되는지 테스트로 확인
