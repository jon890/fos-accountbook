package com.bifos.accountbook.application.service;

import com.bifos.accountbook.application.dto.notification.NotificationListResponse;
import com.bifos.accountbook.application.dto.notification.NotificationResponse;
import com.bifos.accountbook.application.exception.BusinessException;
import com.bifos.accountbook.application.exception.ErrorCode;
import com.bifos.accountbook.domain.entity.Notification;
import com.bifos.accountbook.domain.repository.NotificationRepository;
import com.bifos.accountbook.domain.value.CustomUuid;
import com.bifos.accountbook.presentation.annotation.FamilyUuid;
import com.bifos.accountbook.presentation.annotation.UserUuid;
import com.bifos.accountbook.presentation.annotation.ValidateFamilyAccess;
import java.util.List;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * 알림 서비스
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class NotificationService {

  private final NotificationRepository notificationRepository;
  private final FamilyValidationService familyValidationService;

  /**
   * 가족의 모든 알림 조회
   */
  @ValidateFamilyAccess
  @Transactional(readOnly = true)
  public NotificationListResponse getFamilyNotifications(@UserUuid CustomUuid userUuid, @FamilyUuid CustomUuid familyUuid) {
    // 알림 목록 조회
    List<Notification> notifications = notificationRepository
        .findAllByFamilyUuidOrderByCreatedAtDesc(familyUuid);

    // 읽지 않은 알림 수
    long unreadCount = notificationRepository.countByFamilyUuidAndIsReadFalse(familyUuid);

    List<NotificationResponse> responses = notifications.stream()
                                                        .map(NotificationResponse::from)
                                                        .collect(Collectors.toList());

    return NotificationListResponse.of(responses, unreadCount);
  }

  /**
   * 알림 상세 조회
   */
  @Transactional(readOnly = true)
  public NotificationResponse getNotification(CustomUuid userUuid, String notificationUuid) {
    CustomUuid notificationCustomUuid = CustomUuid.from(notificationUuid);

    Notification notification = notificationRepository
        .findByNotificationUuid(notificationCustomUuid)
        .orElseThrow(() -> new BusinessException(ErrorCode.NOTIFICATION_NOT_FOUND)
            .addParameter("notificationUuid", notificationUuid));

    // 권한 확인
    familyValidationService.validateFamilyAccess(userUuid, notification.getFamilyUuid());

    return NotificationResponse.from(notification);
  }

  /**
   * 알림 읽음 처리
   */
  @Transactional
  public NotificationResponse markAsRead(CustomUuid userUuid, String notificationUuid) {
    CustomUuid notificationCustomUuid = CustomUuid.from(notificationUuid);

    Notification notification = notificationRepository.findByNotificationUuid(notificationCustomUuid)
                                                      .orElseThrow(() -> new BusinessException(ErrorCode.NOTIFICATION_NOT_FOUND)
                                                          .addParameter("notificationUuid", notificationUuid));

    familyValidationService.validateFamilyAccess(userUuid, notification.getFamilyUuid());

    notification.markAsRead();

    return NotificationResponse.from(notification);
  }

  /**
   * 가족의 모든 알림 읽음 처리
   */
  @ValidateFamilyAccess
  @Transactional
  public void markAllAsRead(@UserUuid CustomUuid userUuid, @FamilyUuid CustomUuid familyUuid) {
    List<Notification> notifications = notificationRepository.findAllByFamilyUuidOrderByCreatedAtDesc(familyUuid);

    for (Notification notification : notifications) {
      if (!notification.getIsRead()) {
        notification.markAsRead();
      }
    }
  }

  /**
   * 읽지 않은 알림 수 조회
   */
  @ValidateFamilyAccess
  @Transactional(readOnly = true)
  public Long getUnreadCount(@UserUuid CustomUuid userUuid, @FamilyUuid CustomUuid familyUuid) {
    return notificationRepository.countByFamilyUuidAndIsReadFalse(familyUuid);
  }
}

