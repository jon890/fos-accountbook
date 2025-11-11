/**
 * 초대 수락 Server Action
 */

"use server";

import {
  ActionError,
  handleActionError,
  successResult,
  type ActionResult,
} from "@/lib/errors";
import { serverApiClient } from "@/lib/server/api/client";
import { requireAuth } from "@/lib/server/auth-helpers";
import type { AcceptInvitationRequest } from "@/types/invitation";
import { revalidatePath } from "next/cache";

export async function acceptInvitationAction(
  token: string
): Promise<ActionResult<void>> {
  try {
    // 인증 확인
    await requireAuth();

    // 토큰 검증
    if (!token || token.trim().length === 0) {
      throw ActionError.invalidInput("초대 토큰", token, "토큰은 필수입니다");
    }

    // 초대 수락
    const requestBody: AcceptInvitationRequest = {
      token,
    };

    await serverApiClient(`/invitations/accept`, {
      method: "POST",
      body: JSON.stringify(requestBody),
    });

    revalidatePath("/");

    return successResult(undefined);
  } catch (error) {
    console.error("Failed to accept invitation:", error);
    return handleActionError(error, "초대 수락에 실패했습니다");
  }
}
