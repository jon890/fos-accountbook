/**
 * 카테고리 삭제 Server Action
 */

"use server";

import {
  ActionError,
  handleActionError,
  successResult,
  type ActionResult,
} from "@/lib/errors";
import { serverApiDelete } from "@/lib/server/api";
import { requireAuth } from "@/lib/server/auth/auth-helpers";
import { revalidatePath } from "next/cache";

export async function deleteCategoryAction(
  categoryUuid: string
): Promise<ActionResult<void>> {
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

    await serverApiDelete(`/categories/${categoryUuid}`);

    revalidatePath("/");
    revalidatePath("/categories");

    return successResult(undefined);
  } catch (error) {
    console.error("Failed to delete category:", error);
    return handleActionError(error, "카테고리 삭제에 실패했습니다");
  }
}
