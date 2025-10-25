/**
 * 카테고리 관리 페이지 - Server Component
 */

import { getFamilyCategoriesAction } from "@/app/actions/category-actions";
import { checkUserFamily } from "@/app/actions/dashboard-actions";
import { CategoryPageClient } from "@/components/categories/CategoryPageClient";
import { getSelectedFamilyUuid } from "@/lib/server/cookies";
import type { CategoryResponse } from "@/types/api";
import { redirect } from "next/navigation";

// 동적 렌더링 강제
export const dynamic = "force-dynamic";

export default async function CategoriesPage() {
  // 가족 존재 여부 확인
  const { hasFamily } = await checkUserFamily();

  if (!hasFamily) {
    redirect("/families/create");
  }

  // 선택된 가족 UUID 가져오기
  const familyUuid = await getSelectedFamilyUuid();

  if (!familyUuid) {
    redirect("/families/create");
  }

  // 선택된 가족의 카테고리 목록 조회
  let categories: CategoryResponse[] = [];
  try {
    categories = await getFamilyCategoriesAction();
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
        familyUuid={familyUuid}
      />
    </div>
  );
}
