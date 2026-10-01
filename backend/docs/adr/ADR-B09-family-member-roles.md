# ADR-B09: FamilyMember 역할 기반 권한

**결정**: OWNER / MEMBER 2단계 역할

**이유**:

- 가족 가계부 특성상 복잡한 RBAC 불필요
- OWNER: 가족 수정·삭제, 초대장 관리
- MEMBER: 지출·수입 등록 (가족 내 모든 데이터 조회 가능)

**구현**: `@ValidateFamilyAccess` AOP 어노테이션으로 메서드 레벨 검증

---

