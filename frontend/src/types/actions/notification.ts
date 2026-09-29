/**
 * 알림 관련 타입 정의
 */

/**
 * 알림 타입
 */
export type NotificationType =
  | "BUDGET_50_EXCEEDED"
  | "BUDGET_80_EXCEEDED"
  | "BUDGET_100_EXCEEDED";

/**
 * 알림 응답 타입
 */
export interface Notification {
  notificationUuid: string;
  familyUuid: string;
  userUuid: string | null;
  type: NotificationType;
  typeDisplayName: string;
  title: string;
  message: string;
  referenceUuid: string | null;
  referenceType: string | null;
  yearMonth: string;
  isRead: boolean;
  createdAt: string;
}

/**
 * 알림 목록 응답 타입
 */
export interface NotificationListResponse {
  notifications: Notification[];
  unreadCount: number;
  totalCount: number;
}

/**
 * 읽지 않은 알림 수 응답 타입
 */
export interface UnreadCountResponse {
  unreadCount: number;
}
