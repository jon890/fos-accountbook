/**
 * 초대 링크 생성 Server Action
 */

"use server";

import {
  handleActionError,
  successResult,
  type ActionResult,
} from "@/lib/errors";
import {
  requireAuth,
  getSelectedFamilyUuid,
} from "@/lib/server/auth/auth-helpers";
import { createInvitationLink } from "@/services/invitation/invitation-service";
import type { InvitationInfo } from "@/types/invitation";

export async function createInvitationLinkAction(): Promise<
  ActionResult<InvitationInfo>
> {
  try {
    await requireAuth();
    const familyUuid = await getSelectedFamilyUuid();
    if (!familyUuid) {
      return handleActionError(
        new Error("가족이 선택되지 않았습니다"),
        "초대 링크 생성에 실패했습니다"
      );
    }
    const invitation = await createInvitationLink(familyUuid);
    return successResult(invitation);
  } catch (error) {
    return handleActionError(error, "초대 링크 생성에 실패했습니다");
  }
}
