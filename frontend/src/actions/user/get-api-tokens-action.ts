/**
 * 연동 토큰 목록 조회 Server Action
 */

"use server";

import {
  handleActionError,
  successResult,
  type ActionResult,
} from "@/lib/errors";
import { requireAuth } from "@/lib/server/auth/auth-helpers";
import { getApiTokens } from "@/services/user/api-token-service";
import type { ApiToken } from "@/types/api-token";

export async function getApiTokensAction(): Promise<ActionResult<ApiToken[]>> {
  try {
    await requireAuth();
    const tokens = await getApiTokens();
    return successResult(tokens);
  } catch (error) {
    return handleActionError(error, "연동 토큰 목록을 불러오지 못했습니다");
  }
}
