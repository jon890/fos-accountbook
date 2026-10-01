"use server";

import { ActionError, handleActionError, successResult, type ActionResult } from "@/lib/errors";
import { getSelectedFamilyUuid, requireAuth } from "@/lib/server/auth/auth-helpers";
import { getFamilyMembers } from "@/services/family/family-service";
import type { FamilyMemberSummary } from "@/types/family";

export async function getFamilyMembersAction(): Promise<ActionResult<FamilyMemberSummary[]>> {
  try {
    await requireAuth();

    const familyUuid = await getSelectedFamilyUuid();
    if (!familyUuid) {
      throw ActionError.familyNotSelected();
    }

    return successResult(await getFamilyMembers(familyUuid));
  } catch (error) {
    return handleActionError(error, "가족 구성원을 불러오는데 실패했습니다");
  }
}
