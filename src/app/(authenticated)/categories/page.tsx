/**
 * 카테고리 관리 페이지 - Server Component
 */

import { CategoryPageClient } from "./_components/CategoryPageClient";
import { getSelectedFamilyUuid } from "@/lib/server/auth/auth-helpers";
import { serverApiGet } from "@/lib/server/api";
import type { CategoryResponse } from "@/types/category";
import { redirect } from "next/navigation";

// 인증이 필요한 페이지이므로 동적 렌더링 필요
export const dynamic = "force-dynamic";

export default async function CategoriesPage() {
  // 선택된 가족 UUID 가져오기
  const familyUuid = await getSelectedFamilyUuid();

  // 선택된 가족이 없으면 가족 생성 페이지로 리다이렉트
  // (선택된 가족이 없는 경우는 첫 회원가입 유저만 해당)
  if (!familyUuid) {
    redirect("/families/create");
  }

  // 선택된 가족의 카테고리 목록 조회
  let categories: CategoryResponse[] = [];
  try {
    categories = await serverApiGet<CategoryResponse[]>(
      `/families/${familyUuid}/categories`
    );
  } catch (error) {
    console.error("Failed to fetch categories:", error);
    // 카테고리가 없어도 페이지는 표시
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
