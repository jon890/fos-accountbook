"use server";

import { requireAuth } from "@/lib/server/auth-helpers";
import { serverApiClient } from "@/lib/server/api/client";
import {
  successResult,
  handleActionError,
  type ActionResult,
} from "@/lib/errors";

interface DefaultFamilyResponse {
  defaultFamilyUuid: string;
}

/**
 * 기본 가족 조회 Server Action
 */
export async function getDefaultFamilyAction(): Promise<
  ActionResult<string | null>
> {
  try {
    // 1. 인증 확인
    await requireAuth();

    // 2. 백엔드 API 호출
    const response = await serverApiClient<DefaultFamilyResponse>(
      "/users/me/default-family",
      {
        method: "GET",
      }
    );

    return successResult(response.defaultFamilyUuid || null);
  } catch (error) {
    console.error("기본 가족 조회 실패:", error);
    return handleActionError(error, "기본 가족 조회에 실패했습니다");
  }
}
