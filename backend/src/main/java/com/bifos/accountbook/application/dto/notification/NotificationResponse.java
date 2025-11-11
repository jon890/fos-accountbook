package com.bifos.accountbook.application.dto.notification;

import com.bifos.accountbook.domain.entity.Notification;
import com.bifos.accountbook.domain.value.NotificationType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * 알림 응답 DTO
 */
@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class NotificationResponse {

    private String notificationUuid;
    private String familyUuid;
    private String userUuid;
    private String type;
    private String typeDisplayName;
    private String title;
    private String message;
    private String referenceUuid;
    private String referenceType;
    private String yearMonth;
    private Boolean isRead;
    private LocalDateTime createdAt;

    public static NotificationResponse from(Notification notification) {
        NotificationType type = notification.getType();
        
        return NotificationResponse.builder()
                .notificationUuid(notification.getNotificationUuid().getValue())
                .familyUuid(notification.getFamilyUuid().getValue())
                .userUuid(notification.getUserUuid() != null ? notification.getUserUuid().getValue() : null)
                .type(type.getCode())
                .typeDisplayName(type.getDisplayName())
                .title(notification.getTitle())
                .message(notification.getMessage())
                .referenceUuid(notification.getReferenceUuid() != null ? notification.getReferenceUuid().getValue() : null)
                .referenceType(notification.getReferenceType())
                .yearMonth(notification.getYearMonth())
                .isRead(notification.getIsRead())
                .createdAt(notification.getCreatedAt())
                .build();
    }
}

