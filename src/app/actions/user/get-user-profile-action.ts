"use server";

import {
  handleActionError,
  successResult,
  type ActionResult,
} from "@/lib/errors";
import { serverApiClient } from "@/lib/server/api/client";
import { requireAuth } from "@/lib/server/auth/auth-helpers";
import { UserProfile } from "@/types";

/**
 * 사용자 프로필 조회 Server Action
 */
export async function getUserProfileAction(): Promise<
  ActionResult<UserProfile>
> {
  try {
    // 1. 인증 확인
    await requireAuth();

    // 2. 백엔드 API 호출
    const profile = await serverApiClient<UserProfile>("/users/me/profile", {
      method: "GET",
    });

    return successResult(profile);
  } catch (error) {
    console.error("사용자 프로필 조회 실패:", error);
    return handleActionError(error, "사용자 프로필 조회에 실패했습니다");
  }
}
