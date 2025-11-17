"use server";

import { serverApiClient } from "@/lib/server/api/client";
import { requireAuth } from "@/lib/server/auth/auth-helpers";
import { revalidatePath } from "next/cache";
import type { ApiResponse } from "@/lib/server/api/types";
import type { Notification } from "@/types/actions/notification";
import type { ActionResult } from "@/lib/errors";
import { ErrorCode } from "@/lib/errors/error-code";

/**
 * 알림을 읽음 처리합니다.
 */
export async function markNotificationReadAction(
  notificationUuid: string
): Promise<ActionResult<Notification>> {
  try {
    // 인증 확인
    await requireAuth();

    // 백엔드 API 호출
    const response = await serverApiClient<ApiResponse<Notification>>(
      `/notifications/${notificationUuid}/read`,
      {
        method: "PATCH",
      }
    );

    if (!response.data) {
      throw new Error("알림 데이터가 없습니다");
    }

    // 알림 목록 재검증
    revalidatePath("/");

    return {
      success: true,
      data: response.data,
    };
  } catch (error) {
    console.error("[markNotificationReadAction] Error:", error);
    return {
      success: false,
      error: {
        code: ErrorCode.NOTIFICATION_READ_FAILED,
        message: "알림 읽음 처리에 실패했습니다",
      },
    };
  }
}
