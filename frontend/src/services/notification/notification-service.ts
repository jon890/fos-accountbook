import {
  serverApiGet,
  serverApiPatch,
  serverApiPost,
} from "@/lib/server/api/client";
import { ActionError } from "@/lib/errors";
import type {
  Notification,
  NotificationListResponse,
  UnreadCountResponse,
} from "@/types/actions/notification";

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function getNotifications(
  familyUuid: string
): Promise<NotificationListResponse> {
  return serverApiGet<NotificationListResponse>(
    `/families/${familyUuid}/notifications`
  );
}

export async function getUnreadCount(familyUuid: string): Promise<number> {
  const data = await serverApiGet<UnreadCountResponse>(
    `/families/${familyUuid}/notifications/unread-count`
  );
  return data.unreadCount ?? 0;
}

export async function markNotificationRead(
  familyUuid: string,
  notificationUuid: string
): Promise<Notification> {
  if (!UUID_REGEX.test(notificationUuid)) {
    throw ActionError.invalidInput(
      "notificationUuid",
      notificationUuid,
      "올바른 UUID 형식이 아닙니다"
    );
  }

  return serverApiPatch<Notification>(
    `/families/${familyUuid}/notifications/${notificationUuid}/read`
  );
}

export async function markAllNotificationsRead(
  familyUuid: string
): Promise<void> {
  await serverApiPost<void>(`/families/${familyUuid}/notifications/mark-all-read`);
}

