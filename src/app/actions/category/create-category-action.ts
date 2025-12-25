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
import {
  requireAuth,
  getSelectedFamilyUuid,
} from "@/lib/server/auth/auth-helpers";
import { createCategorySchema } from "@/lib/schemas/category";
import type { CategoryResponse, CreateCategoryInput } from "@/types/category";
import { revalidatePath } from "next/cache";

export async function createCategoryAction(
  familyUuid: string | null,
  data: CreateCategoryInput
): Promise<ActionResult<CategoryResponse>> {
  try {
    // 인증 확인
    await requireAuth();

    // 입력값 검증 (Zod)
    const validationResult = createCategorySchema.safeParse(data);
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
          data[firstField as keyof CreateCategoryInput],
          message
        );
      }

      throw ActionError.invalidInput(
        "unknown",
        data,
        "입력값 검증에 실패했습니다"
      );
    }
    const validData = validationResult.data;

    // familyUuid가 없으면 기본값 가져오기
    const selectedFamilyUuid = familyUuid || (await getSelectedFamilyUuid());

    // 선택된 가족이 없으면 에러
    if (!selectedFamilyUuid) {
      throw ActionError.familyNotSelected();
    }

    const category = await serverApiPost<CategoryResponse>(
      `/families/${selectedFamilyUuid}/categories`,
      validData
    );

    revalidatePath("/");
    revalidatePath("/categories");

    return successResult(category);
  } catch (error) {
    console.error("Failed to create category:", error);
    return handleActionError(error, "카테고리 생성에 실패했습니다");
  }
}
