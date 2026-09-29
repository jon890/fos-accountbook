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
import { markAllNotificationsRead } from "@/services/notification/notification-service";
import { revalidatePath } from "next/cache";

/**
 * 가족의 모든 알림을 읽음 처리합니다.
 */
export async function markAllNotificationsReadAction(
  familyUuid: string
): Promise<ActionResult<void>> {
  try {
    await requireAuth();

    const sessionFamilyUuid = await getSelectedFamilyUuid();
    if (!sessionFamilyUuid) {
      throw ActionError.familyNotSelected();
    }
    if (familyUuid !== sessionFamilyUuid) {
      throw new ActionError("F003", "해당 가족의 구성원이 아닙니다");
    }

    await markAllNotificationsRead(familyUuid);
    revalidatePath("/");
    return successResult(undefined);
  } catch (error) {
    return handleActionError(error, "모든 알림 읽음 처리에 실패했습니다");
  }
}
