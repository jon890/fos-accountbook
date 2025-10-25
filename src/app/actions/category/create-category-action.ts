/**
 * 카테고리 생성 Server Action
 */

"use server";

import { serverApiGet, serverApiPost } from "@/lib/server/api";
import { getSelectedFamilyUuid } from "@/lib/server/cookies";
import type { CategoryResponse, FamilyResponse } from "@/types/api";
import { revalidatePath } from "next/cache";

export async function createCategoryAction(
  familyUuid: string | null,
  data: {
    name: string;
    color?: string;
    icon?: string;
  }
) {
  try {
    // familyUuid가 없으면 쿠키에서 가져오기
    let selectedFamilyUuid = familyUuid || (await getSelectedFamilyUuid());

    // 선택된 가족이 없으면 첫 번째 가족 사용 (쿠키에 저장하지 않음)
    if (!selectedFamilyUuid) {
      const families = await serverApiGet<FamilyResponse[]>("/families");

      if (!families || families.length === 0) {
        throw new Error("가족 정보를 찾을 수 없습니다");
      }

      selectedFamilyUuid = families[0].uuid;
    }

    const category = await serverApiPost<CategoryResponse>(
      `/families/${selectedFamilyUuid}/categories`,
      data
    );

    revalidatePath("/");
    revalidatePath("/expenses");

    return {
      success: true,
      message: "카테고리가 생성되었습니다",
      data: category,
    };
  } catch (error) {
    console.error("Failed to create category:", error);
    return {
      success: false,
      message:
        error instanceof Error ? error.message : "카테고리 생성에 실패했습니다",
    };
  }
}
