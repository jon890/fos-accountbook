# ADR-B03: Soft Delete 전략

**결정**: 물리 삭제 대신 `status` 컬럼 Enum 관리 (ACTIVE | DELETED)

**이유**:

- 가계부 데이터는 감사 추적이 중요 → 삭제 후에도 통계 정합성 유지 필요
- 실수 삭제 복구 가능성 확보
- `deletedAt` 컬럼 방식에서 마이그레이션(V7) 진행 → Enum이 쿼리 조건 명확

**적용 엔티티**: User, Family, FamilyMember, Category, Expense, Income, Invitation

**cascade 정책**:

- `@OneToMany` 관계에 `CascadeType.ALL` + `orphanRemoval = true` 사용 금지
  - orphanRemoval은 컬렉션에서 제거된 자식을 물리 삭제하여 Soft Delete 정책과 충돌한다.
- 허용 cascade: `{CascadeType.PERSIST, CascadeType.MERGE}`
- 부모 삭제 시 자식은 Service 계층에서 명시적으로 soft delete 처리한다.
  - FamilyMember: `status = LEFT`
  - Expense/Income: `status = DELETED`

---

