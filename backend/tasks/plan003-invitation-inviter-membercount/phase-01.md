# Phase 01: InvitationResponse 확장 + Service 수정 + 테스트

## 목표

`GET /invitations/token/{token}` 응답에 `inviter` (이름+아바타) + `memberCount` 필드를 추가한다.
프론트엔드 plan016 (Invite 페이지 신뢰도 강화)의 prerequisite.

## 배경

- skipAuth 엔드포인트 → inviter 정보는 name + image만 노출 (email/phone 비노출)
- `Invitation` 엔티티에 이미 `inviterUserUuid` + `@ManyToOne inviter` (User) 관계 존재
- `FamilyMemberRepository.countByFamilyUuid()` 이미 존재

## 작업 항목

1. **InvitationResponse에 InviterInfo static class + memberCount 필드 추가**
   - 파일: `src/main/java/com/bifos/accountbook/invitation/application/dto/InvitationResponse.java`
   - `InviterInfo` static class 추가: `uuid` (String), `name` (String), `avatarUrl` (String, nullable)
   - `InvitationResponse`에 `inviter` (InviterInfo) + `memberCount` (Integer) 필드 추가
   - `fromWithDetails(Invitation, String familyName, User inviterUser, int memberCount)` 팩토리 메서드 추가
   - 기존 `from()`, `fromWithFamilyName()` 메서드는 하위호환을 위해 유지 (inviter/memberCount는 null)

2. **InvitationService.getInvitationByToken() 수정**
   - 파일: `src/main/java/com/bifos/accountbook/invitation/application/service/InvitationService.java`
   - inviter User 조회: `Invitation.getInviter()` (이미 `@ManyToOne`으로 매핑됨) 또는 `userService.getUser(invitation.getInviterUserUuid())`
   - memberCount 조회: `familyMemberRepository.countByFamilyUuid(familyUuid)`
   - `InvitationResponse.fromWithDetails(invitation, family.getName(), inviterUser, memberCount)` 호출

3. **FamilyMemberRepository 확인**
   - `countByFamilyUuid()`가 ACTIVE 멤버만 세는지 확인
   - ACTIVE만 세지 않으면 조건 추가 필요 (LEFT 상태 제외)

4. **기존 테스트 실행 + 신규 테스트 추가**
   - `./gradlew test --no-daemon --console=plain`
   - InvitationControllerTest에서 `getInvitationByToken` 테스트에 `inviter`, `memberCount` 필드 검증 추가

## 검증 기준

- `GET /invitations/token/{token}` 응답에 `inviter.uuid`, `inviter.name`, `inviter.avatarUrl`, `memberCount` 포함
- inviter 응답에 email/phone 등 민감 정보 비포함
- 전체 테스트 통과
