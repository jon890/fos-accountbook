/**
 * 사용자의 기본 가족 조회 Server Action
 */

"use server";

import {
  handleActionError,
  successResult,
  type ActionResult,
} from "@/lib/errors";
import { serverApiClient } from "@/lib/server/api";
import { auth } from "@/lib/server/auth";
import { redirect } from "next/navigation";

export async function getDefaultFamilyAction(): Promise<
  ActionResult<string | null>
> {
  try {
    // 인증 확인
    const session = await auth();
    if (!session?.user?.id) {
      redirect("/api/auth/signin");
    }

    const response = await serverApiClient<{ defaultFamilyUuid: string }>(
      "/users/me/default-family"
    );

    return successResult(response.defaultFamilyUuid || null);
  } catch (error) {
    console.error("Failed to get default family:", error);
    return handleActionError(error, "기본 가족 조회에 실패했습니다");
  }
}
