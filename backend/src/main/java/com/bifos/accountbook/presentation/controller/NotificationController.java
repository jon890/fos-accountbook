package com.bifos.accountbook.presentation.controller;

import com.bifos.accountbook.application.dto.notification.NotificationListResponse;
import com.bifos.accountbook.application.dto.notification.NotificationResponse;
import com.bifos.accountbook.application.service.NotificationService;
import com.bifos.accountbook.domain.value.CustomUuid;
import com.bifos.accountbook.presentation.annotation.LoginUser;
import com.bifos.accountbook.presentation.dto.ApiSuccessResponse;
import com.bifos.accountbook.presentation.dto.LoginUserDto;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import java.util.Map;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@Tag(name = "알림 (Notification)", description = "알림 조회 및 읽음 처리 API")
@Slf4j
@RestController
@RequestMapping("/api/v1")
@RequiredArgsConstructor
@SecurityRequirement(name = "bearerAuth")
public class NotificationController {

  private final NotificationService notificationService;

  @Operation(summary = "가족 알림 목록 조회", description = "가족의 모든 알림 목록을 조회합니다.")
  @ApiResponse(responseCode = "200", description = "조회 성공")
  @ApiResponse(responseCode = "404", description = "가족을 찾을 수 없음")
  @GetMapping("/families/{familyUuid}/notifications")
  public ResponseEntity<ApiSuccessResponse<NotificationListResponse>> getFamilyNotifications(
      @LoginUser LoginUserDto loginUser,
      @Parameter(description = "가족 UUID") @PathVariable CustomUuid familyUuid) {
    log.info("Fetching notifications for family: {} by user: {}", familyUuid.getValue(), loginUser.userUuid());

    NotificationListResponse response = notificationService.getFamilyNotifications(
        loginUser.userUuid(), familyUuid);

    return ResponseEntity.ok(ApiSuccessResponse.of(response));
  }

  @Operation(summary = "읽지 않은 알림 수 조회", description = "가족의 읽지 않은 알림 수를 조회합니다.")
  @ApiResponse(responseCode = "200", description = "조회 성공")
  @GetMapping("/families/{familyUuid}/notifications/unread-count")
  public ResponseEntity<ApiSuccessResponse<Map<String, Long>>> getUnreadCount(
      @LoginUser LoginUserDto loginUser,
      @Parameter(description = "가족 UUID") @PathVariable CustomUuid familyUuid) {
    Long unreadCount = notificationService.getUnreadCount(loginUser.userUuid(), familyUuid);

    return ResponseEntity.ok(ApiSuccessResponse.of(Map.of("unreadCount", unreadCount)));
  }

  @Operation(summary = "알림 상세 조회", description = "특정 알림의 상세 정보를 조회합니다.")
  @ApiResponse(responseCode = "200", description = "조회 성공")
  @ApiResponse(responseCode = "404", description = "알림을 찾을 수 없음")
  @GetMapping("/notifications/{notificationUuid}")
  public ResponseEntity<ApiSuccessResponse<NotificationResponse>> getNotification(
      @LoginUser LoginUserDto loginUser,
      @Parameter(description = "알림 UUID") @PathVariable String notificationUuid) {
    log.info("Fetching notification: {} by user: {}", notificationUuid, loginUser.userUuid());

    NotificationResponse response = notificationService.getNotification(
        loginUser.userUuid(), notificationUuid);

    return ResponseEntity.ok(ApiSuccessResponse.of(response));
  }

  @Operation(summary = "알림 읽음 처리", description = "특정 알림을 읽음 상태로 변경합니다.")
  @ApiResponse(responseCode = "200", description = "읽음 처리 성공")
  @ApiResponse(responseCode = "404", description = "알림을 찾을 수 없음")
  @PatchMapping("/notifications/{notificationUuid}/read")
  public ResponseEntity<ApiSuccessResponse<NotificationResponse>> markAsRead(
      @LoginUser LoginUserDto loginUser,
      @Parameter(description = "알림 UUID") @PathVariable String notificationUuid) {
    log.info("Marking notification as read: {} by user: {}", notificationUuid, loginUser.userUuid());

    NotificationResponse response = notificationService.markAsRead(
        loginUser.userUuid(), notificationUuid);

    return ResponseEntity.ok(ApiSuccessResponse.of("알림을 읽음 처리했습니다", response));
  }

  @Operation(summary = "모든 알림 읽음 처리", description = "가족의 모든 알림을 읽음 상태로 변경합니다.")
  @ApiResponse(responseCode = "200", description = "읽음 처리 성공")
  @PostMapping("/families/{familyUuid}/notifications/mark-all-read")
  public ResponseEntity<ApiSuccessResponse<Void>> markAllAsRead(
      @LoginUser LoginUserDto loginUser,
      @Parameter(description = "가족 UUID") @PathVariable CustomUuid familyUuid) {
    log.info("Marking all notifications as read for family: {} by user: {}", familyUuid.getValue(), loginUser.userUuid());

    notificationService.markAllAsRead(loginUser.userUuid(), familyUuid);

    return ResponseEntity.ok(ApiSuccessResponse.of("모든 알림을 읽음 처리했습니다", null));
  }
}
