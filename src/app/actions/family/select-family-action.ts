/**
 * 선택된 가족 설정 Server Action
 * 프로필의 defaultFamilyUuid를 업데이트
 *
 * ⚠️ 주의: 이 액션 호출 후 클라이언트에서 세션 갱신이 필요합니다.
 * useSessionRefresh 훅의 refreshSession()을 호출하세요.
 */

"use server";

import {
  ActionError,
  handleActionError,
  successResult,
  type ActionResult,
} from "@/lib/errors";
import { requireAuth } from "@/lib/server/auth/auth-helpers";
import { setDefaultFamilyAction } from "../user/set-default-family-action";
import { getFamiliesAction } from "./get-families-action";

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

    // 프로필의 defaultFamilyUuid 업데이트
    const result = await setDefaultFamilyAction(familyUuid);
    if (!result.success) {
      throw ActionError.internalError("기본 가족 설정에 실패했습니다");
    }

    return successResult(undefined);
  } catch (error) {
    console.error("Failed to select family:", error);
    return handleActionError(error, "가족 선택에 실패했습니다");
  }
}
