import {
  serverApiPost,
  serverApiPut,
  serverApiDelete,
} from "@/lib/server/api/client";
import { getCachedFamilyCategories } from "@/lib/server/cache";
import type {
  CategoryResponse,
  CreateCategoryInput,
  UpdateCategoryInput,
} from "@/types/category";

export async function createCategory(
  familyUuid: string,
  data: CreateCategoryInput
): Promise<CategoryResponse> {
  return serverApiPost<CategoryResponse>(
    `/families/${familyUuid}/categories`,
    data
  );
}

export async function getCategories(
  familyUuid: string
): Promise<CategoryResponse[]> {
  return getCachedFamilyCategories(familyUuid);
}

export async function updateCategory(
  familyUuid: string,
  categoryUuid: string,
  data: UpdateCategoryInput
): Promise<CategoryResponse> {
  return serverApiPut<CategoryResponse>(
    `/families/${familyUuid}/categories/${categoryUuid}`,
    data
  );
}

export async function deleteCategory(
  familyUuid: string,
  categoryUuid: string
): Promise<void> {
  await serverApiDelete(`/families/${familyUuid}/categories/${categoryUuid}`);
}
