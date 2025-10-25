/**
 * 초대 링크 삭제 (취소) Server Action
 */

"use server";

import { serverApiClient } from "@/lib/server/api/client";
import { auth } from "@/lib/server/auth";
import {
  ActionError,
  handleActionError,
  successResult,
  type ActionResult,
} from "@/lib/errors";
import { revalidatePath } from "next/cache";

export async function deleteInvitationAction(
  invitationUuid: string
): Promise<ActionResult<void>> {
  try {
    // 인증 확인
    const session = await auth();
    if (!session?.user?.id) {
      throw ActionError.unauthorized();
    }

    // UUID 검증
    if (!invitationUuid || invitationUuid.trim().length === 0) {
      throw ActionError.invalidInput(
        "초대 UUID",
        invitationUuid,
        "UUID는 필수입니다"
      );
    }

    // 초대 취소 (DELETE)
    await serverApiClient(`/invitations/${invitationUuid}`, {
      method: "DELETE",
    });

    revalidatePath("/");

    return successResult(undefined);
  } catch (error) {
    console.error("Failed to delete invitation:", error);
    return handleActionError(error, "초대 링크 삭제에 실패했습니다");
  }
}
