"use server";

import { serverApiClient } from "@/lib/server/api/client";
import { requireAuth } from "@/lib/server/auth/auth-helpers";
import type { ApiResponse } from "@/lib/server/api/types";
import type { ActionResult } from "@/lib/errors";
import { ErrorCode } from "@/lib/errors/error-code";
import type { UnreadCountResponse } from "@/types/actions/notification";

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
    // 백엔드는 { unreadCount: number } 형태로 반환
    const response = await serverApiClient<ApiResponse<UnreadCountResponse>>(
      `/families/${familyUuid}/notifications/unread-count`,
      {
        method: "GET",
      }
    );

    // response.data는 { unreadCount: number } 형태
    return {
      success: true,
      data: response.data?.unreadCount ?? 0,
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
