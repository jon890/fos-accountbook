# Phase 01: findUnreadByFamilyAndUser 쿼리 추가 + markAllAsRead 리팩토링

## 목표

`markAllAsRead()`가 전체 알림(읽은 것 포함)을 로드하는 비효율을 제거한다.
읽지 않은 알림만 조회하는 쿼리를 추가하고, `markAllAsRead()`에서 사용하도록 변경한다.

## 배경

- `getUnreadCount()`는 이미 DB count 쿼리로 최적화됨 (수정 불필요)
- `getFamilyNotifications()`는 알림 목록 자체를 전부 로드해야 하므로 메모리 count가 합리적 (수정 불필요)
- `markAllAsRead()`만 불필요한 전체 로드가 남아있음

## 작업 항목

1. **NotificationJpaRepository에 쿼리 추가**
   - 파일: `src/main/java/com/bifos/accountbook/notification/infra/repository/jpa/NotificationJpaRepository.java`
   - 추가: `findAllByFamilyUuidAndUserUuidAndIsReadFalse(familyUuid, userUuid)` JPQL 쿼리
   - `isRead = false` 조건 + `familyUuid` + `userUuid` 조건

2. **NotificationRepository 인터페이스에 메서드 추가**
   - 파일: `src/main/java/com/bifos/accountbook/notification/domain/repository/NotificationRepository.java`
   - 추가: `List<Notification> findUnreadByFamilyAndUser(CustomUuid familyUuid, CustomUuid userUuid)`

3. **NotificationRepositoryImpl에 구현 추가**
   - 파일: `src/main/java/com/bifos/accountbook/notification/infra/repository/impl/NotificationRepositoryImpl.java`
   - JPA 쿼리 호출로 위임

4. **NotificationService.markAllAsRead() 수정**
   - 파일: `src/main/java/com/bifos/accountbook/notification/application/service/NotificationService.java`
   - 변경 전: `findByFamilyAndUser()` → `stream().filter(!isRead)` (전체 로드 후 메모리 필터)
   - 변경 후: `findUnreadByFamilyAndUser()` (DB에서 읽지 않은 것만 조회) → 바로 `markAsRead()` 호출

5. **기존 테스트 실행** — 전체 테스트 통과 확인
   - `./gradlew test --no-daemon --console=plain`

## 검증 기준

- `markAllAsRead()` 테스트 통과 (NotificationControllerTest의 `markAllAsRead_Success`)
- 전체 테스트 통과
- `markAllAsRead()` 내에서 `findByFamilyAndUser` 호출이 없어졌는지 코드 확인
