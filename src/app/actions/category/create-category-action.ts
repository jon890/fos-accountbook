/**
 * 카테고리 생성 Server Action
 */

"use server";

import {
  ActionError,
  handleActionError,
  successResult,
  type ActionResult,
} from "@/lib/errors";
import { serverApiPost } from "@/lib/server/api";
import { requireAuth, getSelectedFamilyUuid } from "@/lib/server/auth-helpers";
import type { CategoryResponse } from "@/types/category";
import { revalidatePath } from "next/cache";

export async function createCategoryAction(
  familyUuid: string | null,
  data: {
    name: string;
    color?: string;
    icon?: string;
  }
): Promise<ActionResult<CategoryResponse>> {
  try {
    // 인증 확인
    await requireAuth();

    // familyUuid가 없으면 기본값 가져오기
    const selectedFamilyUuid = familyUuid || (await getSelectedFamilyUuid());

    // 선택된 가족이 없으면 에러
    if (!selectedFamilyUuid) {
      throw ActionError.familyNotSelected();
    }

    // 입력값 검증
    if (!data.name || data.name.trim().length === 0) {
      throw ActionError.invalidInput(
        "카테고리 이름",
        data.name,
        "이름은 필수입니다"
      );
    }

    const category = await serverApiPost<CategoryResponse>(
      `/families/${selectedFamilyUuid}/categories`,
      data
    );

    revalidatePath("/");
    revalidatePath("/categories");

    return successResult(category);
  } catch (error) {
    console.error("Failed to create category:", error);
    return handleActionError(error, "카테고리 생성에 실패했습니다");
  }
}
