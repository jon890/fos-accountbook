"use server";

import {
  handleActionError,
  successResult,
  type ActionResult,
} from "@/lib/errors";
import { requireAuth } from "@/lib/server/auth/auth-helpers";
import { acceptInvitation } from "@/services/invitation/invitation-service";
import { revalidatePath } from "next/cache";
import { InvitationTokenSchema } from "./_schemas";

export async function acceptInvitationAction(
  token: string
): Promise<ActionResult<void>> {
  try {
    // invite 수락은 새 가족에 join 하는 시맨틱 — getSelectedFamilyUuid() 비교 불필요
    // (update 계열과 달리 join 대상 familyUuid 는 token 으로 서버가 결정)
    await requireAuth();
    const { token: validToken } = InvitationTokenSchema.parse({ token });
    await acceptInvitation(validToken);
    revalidatePath("/");
    return successResult(undefined);
  } catch (error) {
    return handleActionError(error, "초대 수락에 실패했습니다");
  }
}
