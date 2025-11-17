"use server";

import {
  handleActionError,
  successResult,
  type ActionResult,
} from "@/lib/errors";
import { serverApiClient } from "@/lib/server/api/client";
import { requireAuth } from "@/lib/server/auth/auth-helpers";
import { revalidatePath } from "next/cache";

/**
 * 기본 가족 설정 Server Action
 * UserProfile의 defaultFamilyUuid를 업데이트
 */
export async function setDefaultFamilyAction(
  familyUuid: string
): Promise<ActionResult<void>> {
  try {
    // 1. 인증 확인
    await requireAuth();

    // 2. 백엔드 API 호출: /users/me/profile PUT으로 통합
    await serverApiClient("/users/me/profile", {
      method: "PUT",
      body: JSON.stringify({ defaultFamilyUuid: familyUuid }),
    });

    // 3. Next.js 캐시 무효화 - 모든 페이지 재검증 (세션도 재조회됨)
    revalidatePath("/", "layout");

    return successResult(undefined);
  } catch (error) {
    console.error("기본 가족 설정 실패:", error);
    return handleActionError(error, "기본 가족 설정에 실패했습니다");
  }
}
