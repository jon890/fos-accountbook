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
import { requireAuth, assertFamilyAccess } from "@/lib/server/auth/auth-helpers";
import { updateFamily } from "@/services/family/family-service";
import type { Family, UpdateFamilyRequest } from "@/types/family";
import { revalidatePath } from "next/cache";

export async function updateFamilyAction(
  familyUuid: string,
  data: UpdateFamilyRequest
): Promise<ActionResult<Family>> {
  try {
    await requireAuth();

    if (!familyUuid) {
      throw ActionError.invalidInput(
        "가족 UUID",
        familyUuid,
        "UUID는 필수입니다"
      );
    }

    await assertFamilyAccess(familyUuid); // ADR-F25 패턴 B: Multi-family 권한 검증

    const family = await updateFamily(familyUuid, data);

    revalidatePath("/");
    revalidatePath("/settings");
    revalidatePath(`/families/${familyUuid}`);

    return successResult(family);
  } catch (error) {
    return handleActionError(error, "가족 정보 수정에 실패했습니다");
  }
}
