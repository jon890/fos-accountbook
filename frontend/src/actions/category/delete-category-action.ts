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
import {
  requireAuth,
  getSelectedFamilyUuid,
} from "@/lib/server/auth/auth-helpers";
import { deleteCategory } from "@/services/category/category-service";
import { revalidatePath } from "next/cache";

export async function deleteCategoryAction(
  categoryUuid: string
): Promise<ActionResult<void>> {
  try {
    await requireAuth();

    if (!categoryUuid) {
      throw ActionError.invalidInput(
        "카테고리 UUID",
        categoryUuid,
        "UUID는 필수입니다"
      );
    }

    const familyUuid = await getSelectedFamilyUuid();
    if (!familyUuid) {
      throw ActionError.familyNotSelected();
    }

    await deleteCategory(familyUuid, categoryUuid);

    revalidatePath("/");
    revalidatePath("/categories");

    return successResult(undefined);
  } catch (error) {
    return handleActionError(error, "카테고리 삭제에 실패했습니다");
  }
}
