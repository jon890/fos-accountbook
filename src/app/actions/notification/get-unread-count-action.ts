"use server";

import { serverApiClient } from "@/lib/server/api/client";
import { requireAuth } from "@/lib/server/auth-helpers";
import type { ApiResponse } from "@/lib/server/api/types";
import type { ActionResult } from "@/lib/errors";
import { ErrorCode } from "@/lib/errors/error-code";

/**
 * 가족의 읽지 않은 알림 수를 조회합니다.
 */
export async function getUnreadCountAction(
  familyUuid: string
): Promise<ActionResult<number>> {
  try {
    // 인증 확인
    await requireAuth();

    // 백엔드 API 호출
    const response = await serverApiClient<ApiResponse<number>>(
      `/families/${familyUuid}/notifications/unread-count`,
      {
        method: "GET",
      }
    );

    return {
      success: true,
      data: response.data ?? 0,
    };
  } catch (error) {
    console.error("[getUnreadCountAction] Error:", error);
    return {
      success: false,
      error: {
        code: ErrorCode.UNREAD_COUNT_FETCH_FAILED,
        message: "읽지 않은 알림 수를 가져오는데 실패했습니다",
      },
    };
  }
}
