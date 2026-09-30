# Phase 02. 가족 구성원 목록 API

**Execution profile**: standard

## 목표

`GET /api/v1/families/{familyUuid}/members` 를 만든다. 가족 구성원의 `userUuid`, 이름, 사진, 역할, 가입 시각을 가입 순서대로 돌려준다.
달력 화면이 등록자별 지출 합계(phase 01)에 이름과 색을 붙이는 데 쓴다.

**범위 외**: 구성원 추가, 삭제, 역할 변경은 만들지 않는다. 프론트엔드는 다른 계획이 고친다.

## 컨텍스트

- 최근 관련 커밋은 `a0ff2cf`(등록자 응답 계약 계획), `1b363c5`와 `34bb270`(연동 토큰 도입)이다. 기존 가족 접근 검증과 연동 토큰 경로 정책은 변경하지 않는다.
- 지금 `FamilyResponse` 에는 구성원 목록이 없다(`family/application/dto/FamilyResponse.java`). 프론트의 `selectedFamily?.members` 는 항상 비어 있다.
- 엔티티: `family/domain/entity/FamilyMember.java` (`familyUuid`, `userUuid`, `role`, `joinedAt`, `status`, `user` 연관), `user/domain/entity/User.java` (`name`, `email`, `image`).
- 저장소: `family/domain/repository/FamilyMemberRepository.java`와 `family/infra/repository/impl/FamilyMemberRepositoryImpl.java`. 필요한 조회가 없으면 `findAllActiveByFamilyUuid(CustomUuid familyUuid)`를 더한다. `joinedAt` 오름차순, 같으면 `id` 오름차순.
- 권한: 가족 구성원만 부를 수 있다. `FamilyService.getFamily` 의 `@ValidateFamilyAccess` 와 `@UserUuid`, `@FamilyUuid` 인자 패턴을 따른다.
- 컨트롤러: `family/presentation/controller/FamilyController.java` (`@RequestMapping("/api/v1/families")`), 응답은 `ApiSuccessResponse.of(data)`.
- `user` 연관을 루프에서 읽으면 구성원 수만큼 조회가 나간다. fetch join 이나 한 번의 `IN` 조회로 사용자를 읽는다.

## 응답

```json
[
  { "userUuid": "…", "name": "…", "email": "…", "image": "…", "role": "OWNER", "joinedAt": "2026-01-01T09:00:00" }
]
```

- `name`, `image` 는 null 일 수 있다. `email` 은 사용자에게 있으면 담는다.
- `status = ACTIVE` 인 구성원만 담는다.
- 새 DTO `FamilyMemberResponse` 는 `family/application/dto/` 에 둔다.

## 작업 항목

### 1. `FamilyMemberRepository` 와 구현: 활성 구성원 조회 (사용자 함께)

### 2. `FamilyService.getFamilyMembers(@UserUuid, @FamilyUuid)`: `@ValidateFamilyAccess`, 가입 순서 정렬

### 3. `FamilyController`: `@GetMapping("/{familyUuid}/members")`

### 4. `backend/docs/data-schema.md`: 「API 엔드포인트 전체 목록」 의 `# [family] 가족` 에 `GET /families/{uuid}/members  구성원 목록 (가입 순서)` 한 줄을 더하고, 「응답에 담는 등록자」 절의 "화면은 이미 받는 가족 구성원 목록에서" 를 "화면은 `GET /families/{uuid}/members` 로 받은 구성원 목록에서" 로 고친다

### 5. 테스트: `src/test/java/com/bifos/accountbook/family/presentation/controller/FamilyControllerTest.java`

- 두 구성원이 가입 순서대로 오고 `userUuid`, `name`, `role` 이 맞다
- `email`, `image`, `joinedAt` 값이 맞고, `name`과 `image`가 null인 사용자도 응답에 포함된다
- 가입 시각이 같으면 `id` 오름차순으로 온다
- 탈퇴(비활성) 구성원은 빠진다
- 가족 구성원이 아닌 사용자가 부르면 기존 가족 접근 거부와 같은 오류다

## 검증

```bash
# cwd: <repo root>
cd backend && ./gradlew checkstyleMain checkstyleTest test build --no-daemon
```

마지막으로 `tasks/be-plan001-member-daily-stats/index.json` 의 `total_phases` 를 2 로, 두 phase 의 `status` 와 plan `status` 를 `completed` 로 바꾼다.
모든 phase 구현과 검토가 끝나면 루트 `CLAUDE.md`에 따라 계획 디렉터리를 별도 커밋으로 삭제한다.

## Critical Files

| 파일 | 변경 |
|---|---|
| `backend/src/main/java/com/bifos/accountbook/family/application/dto/FamilyMemberResponse.java` | 신규 |
| `backend/src/main/java/com/bifos/accountbook/family/domain/repository/FamilyMemberRepository.java` | 수정 |
| `backend/src/main/java/com/bifos/accountbook/family/infra/repository/impl/FamilyMemberRepositoryImpl.java` | 수정 |
| `backend/src/main/java/com/bifos/accountbook/family/application/service/FamilyService.java` | 수정 |
| `backend/src/main/java/com/bifos/accountbook/family/presentation/controller/FamilyController.java` | 수정 |
| `backend/docs/data-schema.md` | 수정 |
| `backend/src/test/java/com/bifos/accountbook/family/presentation/controller/FamilyControllerTest.java` | 수정 |
