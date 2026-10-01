# ADR-F25: Server Action 권한 검증 3-패턴 표준화 (2026-05-20)

- **결정**: 가족 식별자를 다루는 모든 Server Action 은 아래 3 패턴 중 하나로 권한 검증을 명시한다.
  - **A. Single-family** (현재 선택 가족만 다룸): `getSelectedFamilyUuid()` + 입력 `familyUuid` 가 있으면 session 과 비교. expense/income/category 의 update/delete + create.
  - **B. Multi-family** (settings 처럼 본인 속한 여러 가족 다룸): `assertFamilyAccess(familyUuid)` helper. `family/update`.
  - **C. Entity ownership** (entity UUID 로부터 family 유추): entity 의 familyUuid 가 본인 소속인지 확인. `invitation/delete`.
- **맥락**: PR #271 (plan021) 리뷰에서 `updateFamilyAction` 이 `requireAuth()` 만 수행 → 클라이언트가 본인이 속하지 않은 다른 가족 UUID 주입 시 권한 상승 가능 지적. 감사 결과 `category/create` 의 `familyUuid || getSelectedFamilyUuid()` fallback, `invitation/delete` 의 entity 권한 검증 부재도 발견. CLAUDE.md "금지사항" 의 `formData.get('familyUuid')` 금지 규칙이 모호하게 적용됨.
- **대안 기각**:
  - 단일 helper (예: `requirePermission`) 로 통합: input shape 가 패턴마다 달라 (single uuid / multi uuid / entity uuid) 인자 분기 복잡. 호출처에서 패턴이 보이지 않아 검토 부담 ↑.
  - backend trust only (frontend 검증 생략): backend 단일 장애 시 권한 상승 노출. 이중 방어 원칙에서 명시 권장.
- **트레이드오프**: `assertFamilyAccess` 는 매 호출마다 `getFamilies()` 페치 (단 backend 가 캐시 + 짧은 TTL). single-family 패턴의 session 비교는 캐시된 JWT 만 사용해 0 네트워크.
- **적용 범위**: `src/lib/server/auth/auth-helpers.ts` (helper) + `src/actions/family/update-family-action.ts` (B) + `src/actions/category/create-category-action.ts` (A, session 비교 추가) + `src/actions/invitation/delete-invitation-action.ts` (C). 다른 Action 은 이미 표준 패턴 준수.

