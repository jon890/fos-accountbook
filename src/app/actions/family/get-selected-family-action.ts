/**
 * 현재 선택된 가족 UUID 가져오기 Server Action
 * 세션의 profile.defaultFamilyUuid를 반환
 */

"use server";

import {
  handleActionError,
  successResult,
  type ActionResult,
} from "@/lib/errors";
import { getSelectedFamilyUuidFromSession } from "@/lib/server/auth-helpers";

export async function getSelectedFamilyAction(): Promise<
  ActionResult<string | null>
> {
  try {
    const selectedFamilyUuid = await getSelectedFamilyUuidFromSession();

    return successResult(selectedFamilyUuid);
  } catch (error) {
    console.error("Failed to get selected family:", error);
    return handleActionError(error, "선택된 가족을 불러오는데 실패했습니다");
  }
}
