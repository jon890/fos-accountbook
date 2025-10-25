/**
 * 사용자의 기본 가족 조회 Server Action
 */

"use server";

import {
  handleActionError,
  successResult,
  type ActionResult,
} from "@/lib/errors";
import { serverApiClient } from "@/lib/server/api";
import { requireAuthOrRedirect } from "@/lib/server/auth-helpers";

export async function getDefaultFamilyAction(): Promise<
  ActionResult<string | null>
> {
  try {
    // 인증 확인
    await requireAuthOrRedirect();

    const response = await serverApiClient<{ defaultFamilyUuid: string }>(
      "/users/me/default-family"
    );

    return successResult(response.defaultFamilyUuid || null);
  } catch (error) {
    console.error("Failed to get default family:", error);
    return handleActionError(error, "기본 가족 조회에 실패했습니다");
  }
}
