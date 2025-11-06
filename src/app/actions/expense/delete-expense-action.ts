/**
 * 지출 삭제 Server Action
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
import { revalidatePath } from "next/cache";

export async function deleteExpenseAction(
  familyUuid: string,
  expenseUuid: string
): Promise<ActionResult<void>> {
  try {
    // 인증 확인
    await requireAuth();

    // familyUuid 검증
    if (!familyUuid) {
      throw ActionError.familyNotSelected();
    }

    // expenseUuid 검증
    if (!expenseUuid) {
      throw ActionError.invalidInput(
        "expenseUuid",
        expenseUuid,
        "필수 값입니다"
      );
    }

    // 백엔드 API 호출
    await serverApiClient(`/families/${familyUuid}/expenses/${expenseUuid}`, {
      method: "DELETE",
    });

    // 페이지 재검증
    revalidatePath("/expenses");
    revalidatePath("/");

    return successResult(undefined);
  } catch (error) {
    console.error("Failed to delete expense:", error);
    return handleActionError(error, "지출 삭제에 실패했습니다");
  }
}
