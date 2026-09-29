"use server";

import {
  handleActionError,
  successResult,
  type ActionResult,
} from "@/lib/errors";
import { requireAuth } from "@/lib/server/auth/auth-helpers";
import { getUserProfile } from "@/services/user/user-service";
import type { UserProfile } from "@/types";

/**
 * 사용자 프로필 조회 Server Action
 */
export async function getUserProfileAction(): Promise<
  ActionResult<UserProfile>
> {
  try {
    await requireAuth();
    const profile = await getUserProfile();
    return successResult(profile);
  } catch (error) {
    return handleActionError(error, "사용자 프로필 조회에 실패했습니다");
  }
}
