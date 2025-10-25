/**
 * 가족의 카테고리 목록 조회 Server Action
 */

"use server";

import {
  ActionError,
  handleActionError,
  successResult,
  type ActionResult,
} from "@/lib/errors";
import { serverApiGet } from "@/lib/server/api";
import { requireAuth } from "@/lib/server/auth-helpers";
import { getSelectedFamilyUuid } from "@/lib/server/cookies";
import type { CategoryResponse } from "@/types/api";

export async function getFamilyCategoriesAction(
  familyUuid?: string
): Promise<ActionResult<CategoryResponse[]>> {
  try {
    // 인증 확인
    await requireAuth();

    // familyUuid가 없으면 쿠키에서 가져오기
    const selectedFamilyUuid = familyUuid || (await getSelectedFamilyUuid());

    // 선택된 가족이 없으면 에러
    if (!selectedFamilyUuid) {
      throw ActionError.familyNotSelected();
    }

    const categories = await serverApiGet<CategoryResponse[]>(
      `/families/${selectedFamilyUuid}/categories`
    );

    return successResult(categories);
  } catch (error) {
    console.error("Failed to fetch categories:", error);
    return handleActionError(error, "카테고리 목록을 불러오는데 실패했습니다");
  }
}
