import { CategoryPageClient } from "./_components/CategoryPageClient";
import { getSelectedFamilyAction } from "@/actions/family/get-selected-family-action";
import { getFamilyCategoriesAction } from "@/actions/category/get-categories-action";
import { getFamiliesAction } from "@/actions/family/get-families-action";
import { CategoriesHero } from "@/components/categories/CategoriesHero";
import type { CategoryResponse } from "@/types/category";
import { redirect } from "next/navigation";

export default async function CategoriesPage() {
  const familyResult = await getSelectedFamilyAction();
  if (!familyResult.success || !familyResult.data) {
    redirect("/families/create");
  }
  const familyUuid = familyResult.data;

  const [categoriesResult, familiesResult] = await Promise.all([
    getFamilyCategoriesAction(familyUuid),
    getFamiliesAction(),
  ]);

  const categories: CategoryResponse[] = categoriesResult.success
    ? categoriesResult.data
    : [];
  const hasError = !categoriesResult.success;

  const familyInfo = familiesResult.success
    ? familiesResult.data.find((f) => f.uuid === familyUuid)
    : null;

  return (
    <div className="container mx-auto py-6 px-4 max-w-4xl space-y-6">
      <CategoriesHero
        familyName={familyInfo?.name ?? null}
        categoryCount={categories.length}
      />

      <CategoryPageClient
        initialCategories={categories}
        familyUuid={familyUuid}
        hasInitialError={hasError}
      />
    </div>
  );
}
