/**
 * 수입 삭제 Server Action
 */

"use server";

import { auth } from "@/lib/server/auth";
import { serverApiClient } from "@/lib/server/api/client";
import {
  ActionError,
  handleActionError,
  successResult,
  type ActionResult,
} from "@/lib/errors";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function deleteIncomeAction(
  familyUuid: string,
  incomeUuid: string
): Promise<ActionResult<void>> {
  try {
    // 인증 확인
    const session = await auth();
    if (!session?.user?.id) {
      redirect("/api/auth/signin");
    }

    // UUID 검증
    if (!familyUuid) {
      throw ActionError.invalidInput(
        "가족 UUID",
        familyUuid,
        "UUID는 필수입니다"
      );
    }

    if (!incomeUuid) {
      throw ActionError.invalidInput(
        "수입 UUID",
        incomeUuid,
        "UUID는 필수입니다"
      );
    }

    // 백엔드 API 호출
    await serverApiClient(`/families/${familyUuid}/incomes/${incomeUuid}`, {
      method: "DELETE",
    });

    // 페이지 revalidate
    revalidatePath("/incomes");
    revalidatePath("/");

    return successResult(undefined);
  } catch (error) {
    console.error("수입 삭제 중 오류:", error);
    return handleActionError(error, "수입 삭제에 실패했습니다");
  }
}
