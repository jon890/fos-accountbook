/**
 * 카테고리 관련 Server Actions
 */

"use server";

import {
  serverApiDelete,
  serverApiGet,
  serverApiPost,
  serverApiPut,
} from "@/lib/server/api";
import type { CategoryResponse } from "@/types/api";
import { revalidatePath } from "next/cache";

/**
 * 가족의 카테고리 목록 조회
 */
export async function getFamilyCategoriesAction(
  familyUuid: string
): Promise<CategoryResponse[]> {
  try {
    const categories = await serverApiGet<CategoryResponse[]>(
      `/families/${familyUuid}/categories`
    );
    return categories;
  } catch (error) {
    console.error("Failed to fetch categories:", error);
    throw new Error("카테고리 목록을 불러오는데 실패했습니다");
  }
}

/**
 * 카테고리 생성
 */
export async function createCategoryAction(
  familyUuid: string,
  data: {
    name: string;
    color?: string;
    icon?: string;
  }
) {
  try {
    const category = await serverApiPost<CategoryResponse>(
      `/families/${familyUuid}/categories`,
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

/**
 * 카테고리 수정
 */
export async function updateCategoryAction(
  categoryUuid: string,
  data: {
    name?: string;
    color?: string;
    icon?: string;
  }
) {
  try {
    const category = await serverApiPut<CategoryResponse>(
      `/categories/${categoryUuid}`,
      data
    );

    revalidatePath("/");
    revalidatePath("/expenses");
    revalidatePath("/categories");

    return {
      success: true,
      message: "카테고리가 수정되었습니다",
      data: category,
    };
  } catch (error) {
    console.error("Failed to update category:", error);
    return {
      success: false,
      message:
        error instanceof Error ? error.message : "카테고리 수정에 실패했습니다",
    };
  }
}

/**
 * 카테고리 삭제
 */
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
