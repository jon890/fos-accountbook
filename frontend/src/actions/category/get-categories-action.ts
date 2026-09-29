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
import {
  requireAuth,
  getSelectedFamilyUuid,
} from "@/lib/server/auth/auth-helpers";
import { getCategories } from "@/services/category/category-service";
import type { CategoryResponse } from "@/types/category";

export async function getFamilyCategoriesAction(
  familyUuid?: string
): Promise<ActionResult<CategoryResponse[]>> {
  try {
    await requireAuth();

    const selectedFamilyUuid = familyUuid || (await getSelectedFamilyUuid());
    if (!selectedFamilyUuid) {
      throw ActionError.familyNotSelected();
    }

    const categories = await getCategories(selectedFamilyUuid);
    return successResult(categories);
  } catch (error) {
    return handleActionError(error, "카테고리 목록을 불러오는데 실패했습니다");
  }
}
