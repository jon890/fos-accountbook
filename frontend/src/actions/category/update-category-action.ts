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
import {
  requireAuth,
  getSelectedFamilyUuid,
} from "@/lib/server/auth/auth-helpers";
import { updateCategorySchema } from "@/lib/schemas/category";
import { updateCategory } from "@/services/category/category-service";
import type { CategoryResponse, UpdateCategoryInput } from "@/types/category";
import { revalidatePath } from "next/cache";

export async function updateCategoryAction(
  categoryUuid: string,
  data: UpdateCategoryInput
): Promise<ActionResult<CategoryResponse>> {
  try {
    await requireAuth();

    const validationResult = updateCategorySchema.safeParse(data);
    if (!validationResult.success) {
      const flattened = validationResult.error.flatten();

      const firstField = Object.keys(flattened.fieldErrors)[0];
      if (firstField) {
        const message =
          flattened.fieldErrors[
            firstField as keyof typeof flattened.fieldErrors
          ]?.[0] || "입력값이 올바르지 않습니다";
        throw ActionError.invalidInput(
          firstField,
          data[firstField as keyof UpdateCategoryInput],
          message
        );
      }

      if (flattened.formErrors.length > 0) {
        throw ActionError.invalidInput(
          "수정 데이터",
          data,
          flattened.formErrors[0]
        );
      }

      throw ActionError.invalidInput(
        "unknown",
        data,
        "입력값 검증에 실패했습니다"
      );
    }
    const validData = validationResult.data;

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

    const category = await updateCategory(familyUuid, categoryUuid, validData);

    revalidatePath("/");
    revalidatePath("/categories");

    return successResult(category);
  } catch (error) {
    return handleActionError(error, "카테고리 수정에 실패했습니다");
  }
}
