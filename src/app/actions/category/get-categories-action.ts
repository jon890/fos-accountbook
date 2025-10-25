/**
 * 가족의 카테고리 목록 조회 Server Action
 */

"use server";

import { serverApiGet } from "@/lib/server/api";
import { getSelectedFamilyUuid } from "@/lib/server/cookies";
import type { CategoryResponse, FamilyResponse } from "@/types/api";

export async function getFamilyCategoriesAction(
  familyUuid?: string
): Promise<CategoryResponse[]> {
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

    const categories = await serverApiGet<CategoryResponse[]>(
      `/families/${selectedFamilyUuid}/categories`
    );
    return categories;
  } catch (error) {
    console.error("Failed to fetch categories:", error);
    throw new Error("카테고리 목록을 불러오는데 실패했습니다");
  }
}
