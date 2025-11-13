package com.bifos.accountbook.domain.repository;

import com.bifos.accountbook.domain.entity.Notification;
import com.bifos.accountbook.domain.value.CustomUuid;
import com.bifos.accountbook.domain.value.NotificationType;
import java.util.List;
import java.util.Optional;

/**
 * 알림 Repository 인터페이스
 */
public interface NotificationRepository {

  /**
   * 알림 저장
   */
  Notification save(Notification notification);

  /**
   * UUID로 알림 조회
   */
  Optional<Notification> findByNotificationUuid(CustomUuid notificationUuid);

  /**
   * 가족의 모든 알림 조회 (최신순)
   */
  List<Notification> findAllByFamilyUuidOrderByCreatedAtDesc(CustomUuid familyUuid);

  /**
   * 사용자의 모든 알림 조회 (최신순)
   */
  List<Notification> findAllByUserUuidOrderByCreatedAtDesc(CustomUuid userUuid);

  /**
   * 가족의 읽지 않은 알림 수
   */
  long countByFamilyUuidAndIsReadFalse(CustomUuid familyUuid);

  /**
   * 사용자의 읽지 않은 알림 수
   */
  long countByUserUuidAndIsReadFalse(CustomUuid userUuid);

  /**
   * 특정 가족, 타입, 연월에 해당하는 알림이 존재하는지 확인
   * 중복 알림 방지용
   */
  boolean existsByFamilyUuidAndTypeAndYearMonth(
      CustomUuid familyUuid,
      NotificationType type,
      String yearMonth
  );

  /**
   * 가족의 특정 타입 알림 조회
   */
  List<Notification> findAllByFamilyUuidAndType(CustomUuid familyUuid, NotificationType type);

  /**
   * 오래된 알림 삭제 (예: 3개월 이상 지난 알림)
   * Batch 작업용
   */
  void deleteByCreatedAtBefore(java.time.LocalDateTime dateTime);
}

