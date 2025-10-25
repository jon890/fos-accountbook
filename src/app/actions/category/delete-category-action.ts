/**
 * 카테고리 삭제 Server Action
 */

"use server";

import { serverApiDelete } from "@/lib/server/api";
import { revalidatePath } from "next/cache";

export async function deleteCategoryAction(categoryUuid: string) {
  try {
    await serverApiDelete(`/categories/${categoryUuid}`);

    revalidatePath("/");
    revalidatePath("/expenses");
    revalidatePath("/categories");

    return {
      success: true,
      message: "카테고리가 삭제되었습니다",
    };
  } catch (error) {
    console.error("Failed to delete category:", error);
    return {
      success: false,
      message:
        error instanceof Error ? error.message : "카테고리 삭제에 실패했습니다",
    };
  }
}
