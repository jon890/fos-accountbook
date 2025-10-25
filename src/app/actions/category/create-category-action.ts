/**
 * 카테고리 생성 Server Action
 */

"use server";

import { serverApiPost } from "@/lib/server/api";
import {
  ActionError,
  handleActionError,
  successResult,
  type ActionResult,
} from "@/lib/errors";
import { getSelectedFamilyUuid } from "@/lib/server/cookies";
import { auth } from "@/lib/server/auth";
import type { CategoryResponse } from "@/types/api";
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
    const session = await auth();
    if (!session?.user?.id) {
      throw ActionError.unauthorized();
    }

    // familyUuid가 없으면 쿠키에서 가져오기
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
    revalidatePath("/expenses");
    revalidatePath("/categories");

    return successResult(category);
  } catch (error) {
    console.error("Failed to create category:", error);
    return handleActionError(error, "카테고리 생성에 실패했습니다");
  }
}
