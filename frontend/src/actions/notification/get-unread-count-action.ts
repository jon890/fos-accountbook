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
import { getUnreadCount } from "@/services/notification/notification-service";

/**
 * 가족의 읽지 않은 알림 수를 조회합니다.
 */
export async function getUnreadCountAction(
  familyUuid: string
): Promise<ActionResult<number>> {
  try {
    await requireAuth();

    const sessionFamilyUuid = await getSelectedFamilyUuid();
    if (!sessionFamilyUuid) {
      throw ActionError.familyNotSelected();
    }
    if (familyUuid !== sessionFamilyUuid) {
      throw new ActionError("F003", "해당 가족의 구성원이 아닙니다");
    }

    const count = await getUnreadCount(familyUuid);
    return successResult(count);
  } catch (error) {
    return handleActionError(error, "읽지 않은 알림 수를 가져오는데 실패했습니다");
  }
}
