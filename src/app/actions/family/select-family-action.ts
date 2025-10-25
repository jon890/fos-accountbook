/**
 * 선택된 가족 설정 Server Action
 * 쿠키에 가족 UUID를 저장하고 페이지를 새로고침
 */

"use server";

import {
  ActionError,
  handleActionError,
  successResult,
  type ActionResult,
} from "@/lib/errors";
import { requireAuth } from "@/lib/server/auth-helpers";
import { setSelectedFamilyUuid } from "@/lib/server/cookies";
import { getFamiliesAction } from "./get-families-action";
import { revalidatePath } from "next/cache";

export async function selectFamilyAction(
  familyUuid: string
): Promise<ActionResult<void>> {
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

    // 가족이 존재하는지 확인
    const familiesResult = await getFamiliesAction();
    if (!familiesResult.success) {
      throw ActionError.internalError("가족 목록을 불러오는데 실패했습니다");
    }

    const familyExists = familiesResult.data.some((f) => f.uuid === familyUuid);
    if (!familyExists) {
      throw ActionError.entityNotFound("가족", familyUuid);
    }

    // 쿠키에 선택된 가족 UUID 저장
    await setSelectedFamilyUuid(familyUuid);

    // 모든 페이지 재검증
    revalidatePath("/", "layout");

    return successResult(undefined);
  } catch (error) {
    console.error("Failed to select family:", error);
    return handleActionError(error, "가족 선택에 실패했습니다");
  }
}
