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
   * 가족의 모든 알림 조회 (현재 사용자 기준)
   * 가족의 알림이지만 현재 사용자에게 전달된 알림만 조회합니다.
   */
  @ValidateFamilyAccess
  @Transactional(readOnly = true)
  public NotificationListResponse getFamilyNotifications(@UserUuid CustomUuid userUuid,
                                                         @FamilyUuid CustomUuid familyUuid) {
    // 현재 사용자의 알림 목록 조회 (가족 내에서)
    List<Notification> notifications = notificationRepository.findByFamilyAndUser(familyUuid, userUuid);

    // 현재 사용자의 읽지 않은 알림 수 (가족 내에서)
    long unreadCount = notifications.stream()
                                    .filter(n -> !n.getIsRead())
                                    .count();

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
   * 현재 사용자의 알림만 읽음 처리합니다.
   */
  @Transactional
  public NotificationResponse markAsRead(CustomUuid userUuid, String notificationUuid) {
    CustomUuid notificationCustomUuid = CustomUuid.from(notificationUuid);

    Notification notification = notificationRepository.findByNotificationUuid(notificationCustomUuid)
                                                      .orElseThrow(() -> new BusinessException(ErrorCode.NOTIFICATION_NOT_FOUND)
                                                          .addParameter("notificationUuid", notificationUuid));

    // 권한 확인
    familyValidationService.validateFamilyAccess(userUuid, notification.getFamilyUuid());

    // 현재 사용자의 알림인지 확인
    if (notification.getUserUuid() == null || !notification.getUserUuid().equals(userUuid)) {
      throw new BusinessException(ErrorCode.NOTIFICATION_NOT_FOUND)
          .addParameter("notificationUuid", notificationUuid)
          .addParameter("message", "해당 알림은 현재 사용자의 알림이 아닙니다");
    }

    notification.markAsRead();

    return NotificationResponse.from(notification);
  }

  /**
   * 가족의 모든 알림 읽음 처리 (현재 사용자 기준)
   * 현재 사용자의 모든 알림만 읽음 처리합니다.
   */
  @ValidateFamilyAccess
  @Transactional
  public void markAllAsRead(@UserUuid CustomUuid userUuid, @FamilyUuid CustomUuid familyUuid) {
    // 현재 사용자의 읽지 않은 알림만 조회
    List<Notification> notifications = notificationRepository
        .findByFamilyAndUser(familyUuid, userUuid)
        .stream()
        .filter(n -> !n.getIsRead())
        .collect(Collectors.toList());

    for (Notification notification : notifications) {
      notification.markAsRead();
    }
  }

  /**
   * 읽지 않은 알림 수 조회 (현재 사용자 기준)
   * 가족 내에서 현재 사용자의 읽지 않은 알림 수를 조회합니다.
   */
  @ValidateFamilyAccess
  @Transactional(readOnly = true)
  public Long getUnreadCount(@UserUuid CustomUuid userUuid, @FamilyUuid CustomUuid familyUuid) {
    // 가족 내에서 현재 사용자의 읽지 않은 알림 수만 조회
    List<Notification> notifications = notificationRepository
        .findByFamilyAndUser(familyUuid, userUuid);

    return notifications.stream()
                        .filter(n -> !n.getIsRead())
                        .count();
  }
}

