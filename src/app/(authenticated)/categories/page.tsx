/**
 * 카테고리 관리 페이지 - Server Component
 */

import { CategoryPageClient } from "@/components/categories/CategoryPageClient";
import { serverApiGet } from "@/lib/server/api";
import type { CategoryResponse, FamilyResponse } from "@/types/api";
import { redirect } from "next/navigation";

// 동적 렌더링 강제
export const dynamic = "force-dynamic";

export default async function CategoriesPage() {
  // 가족 정보 조회
  let families: FamilyResponse[];
  try {
    families = await serverApiGet<FamilyResponse[]>("/families");
  } catch (error) {
    console.error("Failed to fetch families:", error);
    redirect("/families/create");
  }

  if (!families || families.length === 0) {
    redirect("/families/create");
  }

  const family = families[0]; // 첫 번째 가족 사용

  // 카테고리 목록 조회
  let categories: CategoryResponse[] = [];
  try {
    categories = await serverApiGet<CategoryResponse[]>(
      `/families/${family.uuid}/categories`
    );
  } catch (error) {
    console.error("Failed to fetch categories:", error);
    categories = [];
  }

  return (
    <div className="container mx-auto py-6 px-4 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">카테고리 관리</h1>
        <p className="text-gray-600 mt-1">
          지출 카테고리를 추가, 수정, 삭제할 수 있습니다
        </p>
      </div>

      <CategoryPageClient
        initialCategories={categories}
        familyUuid={family.uuid}
      />
    </div>
  );
}
