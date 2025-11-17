"use server";

import { serverApiClient } from "@/lib/server/api/client";
import { requireAuth } from "@/lib/server/auth/auth-helpers";
import { revalidatePath } from "next/cache";
import type { ApiResponse } from "@/lib/server/api/types";
import type { ActionResult } from "@/lib/errors";
import { ErrorCode } from "@/lib/errors/error-code";

/**
 * 가족의 모든 알림을 읽음 처리합니다.
 */
export async function markAllNotificationsReadAction(
  familyUuid: string
): Promise<ActionResult<void>> {
  try {
    // 인증 확인
    await requireAuth();

    // 백엔드 API 호출
    await serverApiClient<ApiResponse<void>>(
      `/families/${familyUuid}/notifications/mark-all-read`,
      {
        method: "POST",
      }
    );

    // 알림 목록 재검증
    revalidatePath("/");

    return {
      success: true,
      data: undefined,
    };
  } catch (error) {
    console.error("[markAllNotificationsReadAction] Error:", error);
    return {
      success: false,
      error: {
        code: ErrorCode.NOTIFICATION_MARK_ALL_READ_FAILED,
        message: "모든 알림 읽음 처리에 실패했습니다",
      },
    };
  }
}
