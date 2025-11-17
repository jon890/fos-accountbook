/**
 * 가족 상세 조회 Server Action
 */

"use server";

import {
  ActionError,
  handleActionError,
  successResult,
  type ActionResult,
} from "@/lib/errors";
import { serverApiClient } from "@/lib/server/api/client";
import { requireAuth } from "@/lib/server/auth/auth-helpers";
import type { Family } from "@/types/family";

export async function getFamilyByIdAction(
  familyUuid: string
): Promise<ActionResult<Family>> {
  try {
    // 인증 확인
    await requireAuth();

    // UUID 검증
    if (!familyUuid || familyUuid.trim().length === 0) {
      throw ActionError.invalidInput(
        "가족 UUID",
        familyUuid,
        "UUID는 필수입니다"
      );
    }

    const result = await serverApiClient<{
      data: Family;
    }>(`/families/${familyUuid}`, {
      method: "GET",
    });

    return successResult(result.data);
  } catch (error) {
    console.error("Failed to get family:", error);
    return handleActionError(error, "가족 정보를 불러오는데 실패했습니다");
  }
}
