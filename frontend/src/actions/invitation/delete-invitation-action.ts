/**
 * 초대 링크 삭제 (취소) Server Action
 */

"use server";

import {
  ActionError,
  handleActionError,
  successResult,
  type ActionResult,
} from "@/lib/errors";
import {
  getSelectedFamilyUuid,
  requireAuth,
} from "@/lib/server/auth/auth-helpers";
import {
  assertInvitationOwnership,
  deleteInvitation,
} from "@/services/invitation/invitation-service";
import { revalidatePath } from "next/cache";
import { InvitationUuidSchema } from "./_schemas";

export async function deleteInvitationAction(
  invitationUuid: string
): Promise<ActionResult<void>> {
  try {
    await requireAuth();

    const { invitationUuid: validUuid } = InvitationUuidSchema.parse({
      invitationUuid,
    });

    const familyUuid = await getSelectedFamilyUuid();
    if (!familyUuid) {
      throw ActionError.familyNotSelected();
    }

    // Entity ownership: 본인 가족의 active invitation 목록에 포함되는지 확인 (ADR-F25 패턴 C)
    await assertInvitationOwnership(familyUuid, validUuid);

    await deleteInvitation(validUuid);
    revalidatePath("/");
    return successResult(undefined);
  } catch (error) {
    return handleActionError(error, "초대 링크 삭제에 실패했습니다");
  }
}
