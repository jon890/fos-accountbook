"use server";

import {
  ActionError,
  handleActionError,
  successResult,
  type ActionResult,
} from "@/lib/errors";
import {
  requireAuth,
  getSelectedFamilyUuid,
} from "@/lib/server/auth/auth-helpers";
import { getNotifications } from "@/services/notification/notification-service";
import type { NotificationListResponse } from "@/types/actions/notification";

/**
 * 가족의 알림 목록을 조회합니다.
 */
export async function getNotificationsAction(
  familyUuid: string
): Promise<ActionResult<NotificationListResponse>> {
  try {
    await requireAuth();

    const sessionFamilyUuid = await getSelectedFamilyUuid();
    if (!sessionFamilyUuid) {
      throw ActionError.familyNotSelected();
    }
    if (familyUuid !== sessionFamilyUuid) {
      throw new ActionError("F003", "해당 가족의 구성원이 아닙니다");
    }

    const data = await getNotifications(familyUuid);
    return successResult(data);
  } catch (error) {
    return handleActionError(error, "알림 목록을 가져오는데 실패했습니다");
  }
}
