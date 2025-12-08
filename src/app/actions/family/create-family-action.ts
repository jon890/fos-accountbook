/**
 * 가족 생성 Server Action
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
import { serverApiClient } from "@/lib/server/api/client";
import { requireAuth } from "@/lib/server/auth/auth-helpers";
import type { CreateFamilyData, CreateFamilyResult } from "@/types/family";
import { setDefaultFamilyAction } from "../user/set-default-family-action";

export async function createFamilyAction(
  data: CreateFamilyData
): Promise<ActionResult<CreateFamilyResult>> {
  try {
    // 인증 확인
    await requireAuth();

    // 입력값 검증
    if (!data.name || data.name.trim().length === 0) {
      throw ActionError.invalidInput(
        "가족 이름",
        data.name,
        "이름은 필수입니다"
      );
    }

    const result = await serverApiClient<{
      data: CreateFamilyResult;
    }>("/families", {
      method: "POST",
      body: JSON.stringify(data),
    });

    // 백엔드에서 첫 가족 생성 시 자동으로 defaultFamilyUuid 설정됨
    // 프론트엔드에서도 명시적으로 설정 (중복 호출이지만 안전장치)
    await setDefaultFamilyAction(result.data.uuid);

    return successResult(result.data);
  } catch (error) {
    console.error("Failed to create family:", error);
    return handleActionError(error, "가족 생성에 실패했습니다");
  }
}
