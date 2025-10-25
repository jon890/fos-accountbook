/**
 * 가족 생성 Server Action
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
import type { CreateFamilyData, CreateFamilyResult } from "@/types/actions";
import { revalidatePath } from "next/cache";

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

    revalidatePath("/");

    return successResult(result.data);
  } catch (error) {
    console.error("Failed to create family:", error);
    return handleActionError(error, "가족 생성에 실패했습니다");
  }
}
