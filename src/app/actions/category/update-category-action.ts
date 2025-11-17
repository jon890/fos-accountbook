/**
 * 카테고리 수정 Server Action
 */

"use server";

import {
  ActionError,
  handleActionError,
  successResult,
  type ActionResult,
} from "@/lib/errors";
import { serverApiPut } from "@/lib/server/api";
import { requireAuth } from "@/lib/server/auth/auth-helpers";
import type { CategoryResponse } from "@/types/category";
import { revalidatePath } from "next/cache";

export async function updateCategoryAction(
  categoryUuid: string,
  data: {
    name?: string;
    color?: string;
    icon?: string;
  }
): Promise<ActionResult<CategoryResponse>> {
  try {
    // 인증 확인
    await requireAuth();

    // UUID 검증
    if (!categoryUuid) {
      throw ActionError.invalidInput(
        "카테고리 UUID",
        categoryUuid,
        "UUID는 필수입니다"
      );
    }

    // 수정할 데이터가 있는지 검증
    if (!data.name && !data.color && !data.icon) {
      throw ActionError.invalidInput(
        "수정 데이터",
        data,
        "수정할 항목이 없습니다"
      );
    }

    const category = await serverApiPut<CategoryResponse>(
      `/categories/${categoryUuid}`,
      data
    );

    revalidatePath("/");
    revalidatePath("/categories");

    return successResult(category);
  } catch (error) {
    console.error("Failed to update category:", error);
    return handleActionError(error, "카테고리 수정에 실패했습니다");
  }
}
