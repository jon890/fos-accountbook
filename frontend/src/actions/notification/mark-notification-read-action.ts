"use server";

import {
  requireAuth,
  getSelectedFamilyUuid,
} from "@/lib/server/auth/auth-helpers";
import { markNotificationRead } from "@/services/notification/notification-service";
import { revalidatePath } from "next/cache";
import type { Notification } from "@/types/actions/notification";
import {
  ActionError,
  handleActionError,
  successResult,
  type ActionResult,
} from "@/lib/errors";
import { ErrorCode } from "@/lib/errors/error-code";

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * 알림을 읽음 처리합니다.
 */
export async function markNotificationReadAction(
  familyUuid: string,
  notificationUuid: string
): Promise<ActionResult<Notification>> {
  try {
    await requireAuth();

    if (!UUID_REGEX.test(notificationUuid)) {
      return ActionError.invalidInput(
        "notificationUuid",
        notificationUuid,
        "올바른 UUID 형식이 아닙니다"
      ).toFailureResult();
    }

    const sessionFamilyUuid = await getSelectedFamilyUuid();
    if (!sessionFamilyUuid) {
      return ActionError.familyNotSelected().toFailureResult();
    }
    if (familyUuid !== sessionFamilyUuid) {
      return new ActionError(
        ErrorCode.NOT_FAMILY_MEMBER,
        "해당 가족의 구성원이 아닙니다"
      ).toFailureResult();
    }

    const data = await markNotificationRead(familyUuid, notificationUuid);
    revalidatePath("/");
    return successResult(data);
  } catch (error) {
    return handleActionError(error, "알림 읽음 처리에 실패했습니다");
  }
}
