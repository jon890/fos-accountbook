/**
 * 카테고리 수정 Server Action
 */

"use server";

import { serverApiPut } from "@/lib/server/api";
import type { CategoryResponse } from "@/types/api";
import { revalidatePath } from "next/cache";

export async function updateCategoryAction(
  categoryUuid: string,
  data: {
    name?: string;
    color?: string;
    icon?: string;
  }
) {
  try {
    const category = await serverApiPut<CategoryResponse>(
      `/categories/${categoryUuid}`,
      data
    );

    revalidatePath("/");
    revalidatePath("/expenses");
    revalidatePath("/categories");

    return {
      success: true,
      message: "카테고리가 수정되었습니다",
      data: category,
    };
  } catch (error) {
    console.error("Failed to update category:", error);
    return {
      success: false,
      message:
        error instanceof Error ? error.message : "카테고리 수정에 실패했습니다",
    };
  }
}
