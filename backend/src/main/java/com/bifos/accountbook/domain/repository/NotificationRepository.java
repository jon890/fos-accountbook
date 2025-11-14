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
  List<Notification> findByFamily(CustomUuid familyUuid);

  /**
   * 사용자의 모든 알림 조회 (최신순)
   */
  List<Notification> findByUser(CustomUuid userUuid);

  /**
   * 가족의 읽지 않은 알림 수
   */
  long countUnreadByFamily(CustomUuid familyUuid);

  /**
   * 사용자의 읽지 않은 알림 수
   */
  long countUnreadByUser(CustomUuid userUuid);

  /**
   * 특정 가족, 타입, 연월에 해당하는 알림이 존재하는지 확인
   * 중복 알림 방지용
   */
  boolean existsByFamilyTypeAndMonth(CustomUuid familyUuid,
                                     NotificationType type,
                                     String yearMonth);

  /**
   * 가족의 특정 타입 알림 조회
   */
  List<Notification> findByFamilyAndType(CustomUuid familyUuid, NotificationType type);

  /**
   * 가족 UUID와 사용자 UUID로 알림 조회 (최신순)
   * 가족 내에서 특정 사용자의 알림만 조회합니다.
   */
  List<Notification> findByFamilyAndUser(CustomUuid familyUuid, CustomUuid userUuid);

  /**
   * 오래된 알림 삭제 (예: 3개월 이상 지난 알림)
   * Batch 작업용
   */
  void deleteByCreatedAtBefore(java.time.LocalDateTime dateTime);
}

