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
import {
  requireAuth,
  getSelectedFamilyUuid,
} from "@/lib/server/auth/auth-helpers";
import { createCategorySchema } from "@/lib/schemas/category";
import { createCategory } from "@/services/category/category-service";
import type { CategoryResponse, CreateCategoryInput } from "@/types/category";
import { revalidatePath } from "next/cache";

export async function createCategoryAction(
  familyUuid: string | null,
  data: CreateCategoryInput
): Promise<ActionResult<CategoryResponse>> {
  try {
    await requireAuth();

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

    // ADR-F25 패턴 A: Single-family — 입력 familyUuid 가 세션과 불일치 시 거부
    const sessionFamilyUuid = await getSelectedFamilyUuid();
    if (!sessionFamilyUuid) {
      throw ActionError.familyNotSelected();
    }
    if (familyUuid && familyUuid !== sessionFamilyUuid) {
      throw ActionError.invalidInput(
        "familyUuid",
        familyUuid,
        "권한이 없습니다"
      );
    }
    const selectedFamilyUuid = sessionFamilyUuid;

    const category = await createCategory(selectedFamilyUuid, validData);

    revalidatePath("/");
    revalidatePath("/categories");

    return successResult(category);
  } catch (error) {
    return handleActionError(error, "카테고리 생성에 실패했습니다");
  }
}
