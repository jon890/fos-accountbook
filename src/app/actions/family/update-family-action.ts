/**
 * 가족 수정 Server Action
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
import type { Family, UpdateFamilyRequest } from "@/types/family";
import { revalidatePath } from "next/cache";

export async function updateFamilyAction(
  familyUuid: string,
  data: UpdateFamilyRequest
): Promise<ActionResult<Family>> {
  try {
    // 인증 확인
    await requireAuth();

    // 입력값 검증
    if (!familyUuid) {
      throw ActionError.invalidInput(
        "가족 UUID",
        familyUuid,
        "UUID는 필수입니다"
      );
    }

    const result = await serverApiClient<{
      data: Family;
    }>(`/families/${familyUuid}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });

    // 캐시 무효화
    revalidatePath("/");
    revalidatePath("/settings");
    revalidatePath(`/families/${familyUuid}`);

    return successResult(result.data);
  } catch (error) {
    console.error("Failed to update family:", error);
    return handleActionError(error, "가족 정보 수정에 실패했습니다");
  }
}
