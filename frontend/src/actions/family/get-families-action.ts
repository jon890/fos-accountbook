/**
 * 가족 목록 조회 Server Action
 */

"use server";

import {
  handleActionError,
  successResult,
  type ActionResult,
} from "@/lib/errors";
import { requireAuth } from "@/lib/server/auth/auth-helpers";
import { getFamilies } from "@/services/family/family-service";
import type { Family } from "@/types/family";

export async function getFamiliesAction(): Promise<ActionResult<Family[]>> {
  try {
    await requireAuth();
    const families = await getFamilies();
    return successResult(families);
  } catch (error) {
    return handleActionError(error, "가족 목록을 불러오는데 실패했습니다");
  }
}
