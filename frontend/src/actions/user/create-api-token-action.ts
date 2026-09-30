/**
 * 연동 토큰 발급 Server Action
 * 원문 토큰은 반환값으로만 화면에 넘기고 로그나 캐시에 남기지 않는다.
 */

"use server";

import {
  handleActionError,
  successResult,
  type ActionResult,
} from "@/lib/errors";
import { requireAuth } from "@/lib/server/auth/auth-helpers";
import { createApiToken } from "@/services/user/api-token-service";
import type { CreatedApiToken } from "@/types/api-token";
import { revalidatePath } from "next/cache";
import { CreateApiTokenSchema } from "./_schemas";

export async function createApiTokenAction(
  name: string
): Promise<ActionResult<CreatedApiToken>> {
  try {
    await requireAuth();

    const { name: validName } = CreateApiTokenSchema.parse({ name });

    const created = await createApiToken(validName);
    revalidatePath("/settings");
    return successResult(created);
  } catch (error) {
    return handleActionError(error, "연동 토큰을 발급하지 못했습니다");
  }
}
