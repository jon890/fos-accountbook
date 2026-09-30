/**
 * 연동 토큰 폐기 Server Action
 */

"use server";

import {
  handleActionError,
  successResult,
  type ActionResult,
} from "@/lib/errors";
import { requireAuth } from "@/lib/server/auth/auth-helpers";
import { revokeApiToken } from "@/services/user/api-token-service";
import { revalidatePath } from "next/cache";
import { ApiTokenUuidSchema } from "./_schemas";

export async function revokeApiTokenAction(
  tokenUuid: string
): Promise<ActionResult<void>> {
  try {
    await requireAuth();

    const { tokenUuid: validUuid } = ApiTokenUuidSchema.parse({ tokenUuid });

    await revokeApiToken(validUuid);
    revalidatePath("/settings");
    return successResult(undefined);
  } catch (error) {
    return handleActionError(error, "연동 토큰을 폐기하지 못했습니다");
  }
}
