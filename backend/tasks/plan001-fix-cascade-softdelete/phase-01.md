# Phase 01: cascade 수정 + 테스트 검증

## 목표

Family/User 엔티티의 `CascadeType.ALL` + `orphanRemoval = true`를 `{CascadeType.PERSIST, CascadeType.MERGE}`로 변경하여 Soft Delete 정책과의 충돌을 해소한다.

## 작업 항목

1. **Family.java 수정** — 3개 `@OneToMany` 관계 (`members`, `incomes`, `expenses`)의 cascade/orphanRemoval 변경
   - 파일: `src/main/java/com/bifos/accountbook/family/domain/entity/Family.java`
   - 72행: `members` → `cascade = {CascadeType.PERSIST, CascadeType.MERGE}`
   - 76행: `incomes` → 동일 변경
   - 80행: `expenses` → 동일 변경

2. **User.java 수정** — `familyMembers` 관계 동일 변경
   - 파일: `src/main/java/com/bifos/accountbook/user/domain/entity/User.java`
   - 79행: `familyMembers` → `cascade = {CascadeType.PERSIST, CascadeType.MERGE}`

3. **기존 테스트 실행** — 변경 후 전체 테스트 통과 확인
   - `./gradlew test --no-daemon --console=plain`

## 검증 기준

- 전체 테스트 통과 (특히 Family/Expense/Income 관련 테스트)
- `CascadeType.ALL` / `orphanRemoval = true`가 Family.java, User.java에 남아있지 않음
