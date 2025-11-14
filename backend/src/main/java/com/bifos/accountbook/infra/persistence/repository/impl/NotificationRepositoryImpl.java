package com.bifos.accountbook.infra.persistence.repository.impl;

import com.bifos.accountbook.domain.entity.Notification;
import com.bifos.accountbook.domain.repository.NotificationRepository;
import com.bifos.accountbook.domain.value.CustomUuid;
import com.bifos.accountbook.domain.value.NotificationType;
import com.bifos.accountbook.infra.persistence.repository.jpa.NotificationJpaRepository;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Repository;

/**
 * NotificationRepository 구현체
 * JpaRepository를 내부적으로 사용하여 도메인 인터페이스 구현
 */
@Repository
@RequiredArgsConstructor
public class NotificationRepositoryImpl implements NotificationRepository {

  private final NotificationJpaRepository jpaRepository;

  @Override
  public Notification save(Notification notification) {
    return jpaRepository.save(notification);
  }

  @Override
  public Optional<Notification> findByNotificationUuid(CustomUuid notificationUuid) {
    return jpaRepository.findByNotificationUuid(notificationUuid);
  }

  @Override
  public List<Notification> findByFamily(CustomUuid familyUuid) {
    return jpaRepository.findAllByFamilyUuidOrderByCreatedAtDesc(familyUuid);
  }

  @Override
  public List<Notification> findByUser(CustomUuid userUuid) {
    return jpaRepository.findAllByUserUuidOrderByCreatedAtDesc(userUuid);
  }

  @Override
  public long countUnreadByFamily(CustomUuid familyUuid) {
    return jpaRepository.countByFamilyUuidAndIsReadFalse(familyUuid);
  }

  @Override
  public long countUnreadByUser(CustomUuid userUuid) {
    return jpaRepository.countByUserUuidAndIsReadFalse(userUuid);
  }

  @Override
  public boolean existsByFamilyTypeAndMonth(
      CustomUuid familyUuid,
      NotificationType type,
      String yearMonth) {
    return jpaRepository.existsByFamilyUuidAndTypeAndYearMonth(familyUuid, type, yearMonth);
  }

  @Override
  public List<Notification> findByFamilyAndType(CustomUuid familyUuid, NotificationType type) {
    return jpaRepository.findAllByFamilyUuidAndType(familyUuid, type);
  }

  @Override
  public List<Notification> findByFamilyAndUser(CustomUuid familyUuid, CustomUuid userUuid) {
    return jpaRepository.findAllByFamilyUuidAndUserUuidOrderByCreatedAtDesc(familyUuid, userUuid);
  }

  @Override
  public void deleteByCreatedAtBefore(LocalDateTime dateTime) {
    jpaRepository.deleteByCreatedAtBefore(dateTime);
  }
}

