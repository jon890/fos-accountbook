/**
 * 카테고리 관리 페이지 - Server Component
 */

import { getFamilyCategoriesAction } from "@/app/actions/category/get-categories-action";
import { checkUserFamilyAction } from "@/app/actions/family/check-user-family-action";
import { CategoryPageClient } from "./_components/CategoryPageClient";
import { getSelectedFamilyUuid } from "@/lib/server/auth/auth-helpers";
import type { CategoryResponse } from "@/types/category";
import { redirect } from "next/navigation";

export default async function CategoriesPage() {
  // 가족 존재 여부 확인
  const { hasFamily } = await checkUserFamilyAction();

  if (!hasFamily) {
    redirect("/families/create");
  }

  // 선택된 가족 UUID 가져오기
  const familyUuid = await getSelectedFamilyUuid();

  if (!familyUuid) {
    redirect("/families/create");
  }

  // 선택된 가족의 카테고리 목록 조회
  const categoriesResult = await getFamilyCategoriesAction();
  const categories: CategoryResponse[] = categoriesResult.success
    ? categoriesResult.data
    : [];

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
