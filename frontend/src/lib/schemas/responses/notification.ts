import { z } from "zod";
import type {
  Notification,
  NotificationListResponse,
  UnreadCountResponse,
} from "@/types/actions/notification";
import { isoDateString, uuidString } from "./common";

/**
 * 알림 응답 스키마 (ADR-F42)
 *
 * 백엔드 `NotificationResponse`, `NotificationListResponse` 와 맞춘다.
 * `type` 은 `NotificationType.getCode()` 문자열이다.
 * `isRead` 는 박싱형 `Boolean` 이라 JSON 키가 `isRead` 그대로다.
 */

export const notificationSchema = z.object({
  notificationUuid: uuidString,
  familyUuid: uuidString,
  // 가족 전체 알림이면 null 이다.
  userUuid: uuidString.nullable(),
  type: z.enum([
    "BUDGET_50_EXCEEDED",
    "BUDGET_80_EXCEEDED",
    "BUDGET_100_EXCEEDED",
    "RECURRING_EXPENSE_CREATED",
  ]),
  typeDisplayName: z.string(),
  title: z.string(),
  message: z.string(),
  referenceUuid: uuidString.nullable(),
  referenceType: z.string().nullable(),
  yearMonth: z.string(),
  isRead: z.boolean(),
  createdAt: isoDateString,
}) satisfies z.ZodType<Notification>;

export const notificationListSchema = z.object({
  notifications: z.array(notificationSchema),
  unreadCount: z.number(),
  totalCount: z.number(),
}) satisfies z.ZodType<NotificationListResponse>;

/** `GET .../notifications/unread-count` 는 `{ unreadCount: Long }` 맵을 돌려준다. */
export const unreadCountSchema = z.object({
  unreadCount: z.number(),
}) satisfies z.ZodType<UnreadCountResponse>;
