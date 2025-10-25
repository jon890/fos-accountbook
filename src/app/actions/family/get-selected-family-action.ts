/**
 * 현재 선택된 가족 UUID 가져오기 Server Action
 * 클라이언트 컴포넌트에서 호출 가능
 */

"use server";

import { auth } from "@/lib/server/auth";
import {
  ActionError,
  handleActionError,
  successResult,
  type ActionResult,
} from "@/lib/errors";
import { getSelectedFamilyUuid } from "@/lib/server/cookies";

export async function getSelectedFamilyAction(): Promise<
  ActionResult<string | null>
> {
  try {
    // 인증 확인
    const session = await auth();
    if (!session?.user?.id) {
      throw ActionError.unauthorized();
    }

    const selectedFamilyUuid = await getSelectedFamilyUuid();

    return successResult(selectedFamilyUuid);
  } catch (error) {
    console.error("Failed to get selected family:", error);
    return handleActionError(error, "선택된 가족을 불러오는데 실패했습니다");
  }
}
