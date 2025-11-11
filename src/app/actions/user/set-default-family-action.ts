"use server";

import { requireAuth } from "@/lib/server/auth-helpers";
import { serverApiClient } from "@/lib/server/api/client";
import {
  successResult,
  handleActionError,
  type ActionResult,
} from "@/lib/errors";

/**
 * 기본 가족 설정 Server Action
 */
export async function setDefaultFamilyAction(
  familyUuid: string
): Promise<ActionResult<void>> {
  try {
    // 1. 인증 확인
    await requireAuth();

    // 2. 백엔드 API 호출
    await serverApiClient("/users/me/default-family", {
      method: "PUT",
      body: JSON.stringify({ familyUuid }),
    });

    return successResult(undefined);
  } catch (error) {
    console.error("기본 가족 설정 실패:", error);
    return handleActionError(error, "기본 가족 설정에 실패했습니다");
  }
}
