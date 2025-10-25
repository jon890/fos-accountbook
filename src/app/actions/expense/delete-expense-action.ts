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
import { requireAuthOrRedirect } from "@/lib/server/auth-helpers";
import { revalidatePath } from "next/cache";

export async function deleteExpenseAction(
  familyUuid: string,
  expenseUuid: string
): Promise<ActionResult<void>> {
  try {
    // 인증 확인
    await requireAuthOrRedirect();

    // UUID 검증
    if (!familyUuid) {
      throw ActionError.invalidInput(
        "가족 UUID",
        familyUuid,
        "UUID는 필수입니다"
      );
    }

    if (!expenseUuid) {
      throw ActionError.invalidInput(
        "지출 UUID",
        expenseUuid,
        "UUID는 필수입니다"
      );
    }

    // 백엔드 API 호출 (HTTP-only 쿠키에서 자동으로 Access Token 전달)
    await serverApiClient(`/families/${familyUuid}/expenses/${expenseUuid}`, {
      method: "DELETE",
    });

    // 지출 페이지 및 대시보드 revalidate
    revalidatePath("/expenses");
    revalidatePath("/");

    return successResult(undefined);
  } catch (error) {
    console.error("지출 삭제 중 오류:", error);
    return handleActionError(error, "지출 삭제에 실패했습니다");
  }
}
