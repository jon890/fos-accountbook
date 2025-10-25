/**
 * 사용자의 기본 가족 설정 Server Action
 */

"use server";

import {
  ActionError,
  handleActionError,
  successResult,
  type ActionResult,
} from "@/lib/errors";
import { serverApiClient } from "@/lib/server/api";
import { requireAuthOrRedirect } from "@/lib/server/auth-helpers";
import { revalidatePath } from "next/cache";

export async function setDefaultFamilyAction(
  familyUuid: string
): Promise<ActionResult<void>> {
  try {
    // 인증 확인
    await requireAuthOrRedirect();

    // UUID 검증
    if (!familyUuid || familyUuid.trim().length === 0) {
      throw ActionError.invalidInput(
        "가족 UUID",
        familyUuid,
        "UUID는 필수입니다"
      );
    }

    await serverApiClient("/users/me/default-family", {
      method: "PUT",
      body: JSON.stringify({ familyUuid }),
    });

    revalidatePath("/");
    revalidatePath("/settings");

    return successResult(undefined);
  } catch (error) {
    console.error("Failed to set default family:", error);
    return handleActionError(error, "기본 가족 설정에 실패했습니다");
  }
}
