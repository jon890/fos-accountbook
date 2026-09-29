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
import { requireAuth } from "@/lib/server/auth/auth-helpers";
import { createFamily } from "@/services/family/family-service";
import type { CreateFamilyData, CreateFamilyResult } from "@/types/family";
import { revalidatePath } from "next/cache";

export async function createFamilyAction(
  data: CreateFamilyData
): Promise<ActionResult<CreateFamilyResult>> {
  try {
    await requireAuth();

    if (!data.name || data.name.trim().length === 0) {
      throw ActionError.invalidInput(
        "가족 이름",
        data.name,
        "이름은 필수입니다"
      );
    }

    const result = await createFamily(data);
    revalidatePath("/families");
    revalidatePath("/");
    return successResult(result);
  } catch (error) {
    return handleActionError(error, "가족 생성에 실패했습니다");
  }
}
