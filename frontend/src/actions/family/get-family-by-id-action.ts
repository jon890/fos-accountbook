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
import { requireAuth } from "@/lib/server/auth/auth-helpers";
import { getFamilyById } from "@/services/family/family-service";
import type { Family } from "@/types/family";

export async function getFamilyByIdAction(
  familyUuid: string
): Promise<ActionResult<Family>> {
  try {
    await requireAuth();

    if (!familyUuid || familyUuid.trim().length === 0) {
      throw ActionError.invalidInput(
        "가족 UUID",
        familyUuid,
        "UUID는 필수입니다"
      );
    }

    const family = await getFamilyById(familyUuid);
    return successResult(family);
  } catch (error) {
    return handleActionError(error, "가족 정보를 불러오는데 실패했습니다");
  }
}
