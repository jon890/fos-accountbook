package com.bifos.accountbook.application.dto.notification;

import java.util.List;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

/**
 * 알림 목록 응답 DTO
 */
@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class NotificationListResponse {

  private List<NotificationResponse> notifications;
  private Long unreadCount;
  private Integer totalCount;

  public static NotificationListResponse of(
      List<NotificationResponse> notifications,
      Long unreadCount) {
    return NotificationListResponse.builder()
                                   .notifications(notifications)
                                   .unreadCount(unreadCount)
                                   .totalCount(notifications.size())
                                   .build();
  }
}

