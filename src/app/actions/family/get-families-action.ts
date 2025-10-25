/**
 * 가족 목록 조회 Server Action
 */

"use server";

import {
  handleActionError,
  successResult,
  type ActionResult,
} from "@/lib/errors";
import { serverApiClient } from "@/lib/server/api/client";
import { requireAuth } from "@/lib/server/auth-helpers";
import type { Family } from "@/types/actions";

export async function getFamiliesAction(): Promise<ActionResult<Family[]>> {
  try {
    // 인증 확인
    await requireAuth();

    const result = await serverApiClient<{
      data: Family[];
    }>("/families", {
      method: "GET",
    });

    return successResult(result.data);
  } catch (error) {
    console.error("Failed to get families:", error);
    return handleActionError(error, "가족 목록을 불러오는데 실패했습니다");
  }
}
