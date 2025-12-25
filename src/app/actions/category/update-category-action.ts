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
import { updateCategorySchema } from "@/lib/schemas/category";
import type { CategoryResponse, UpdateCategoryInput } from "@/types/category";
import { revalidatePath } from "next/cache";

export async function updateCategoryAction(
  categoryUuid: string,
  data: UpdateCategoryInput
): Promise<ActionResult<CategoryResponse>> {
  try {
    // 인증 확인
    await requireAuth();

    // 입력값 검증 (Zod)
    const validationResult = updateCategorySchema.safeParse(data);
    if (!validationResult.success) {
      const flattened = validationResult.error.flatten();

      // 필드 에러 처리
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

      // Root 에러(refine) 처리
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

    // UUID 검증
    if (!categoryUuid) {
      throw ActionError.invalidInput(
        "카테고리 UUID",
        categoryUuid,
        "UUID는 필수입니다"
      );
    }

    const category = await serverApiPut<CategoryResponse>(
      `/categories/${categoryUuid}`,
      validData
    );

    revalidatePath("/");
    revalidatePath("/categories");

    return successResult(category);
  } catch (error) {
    console.error("Failed to update category:", error);
    return handleActionError(error, "카테고리 수정에 실패했습니다");
  }
}
