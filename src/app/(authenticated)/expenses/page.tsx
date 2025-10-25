import { LoadingSpinner } from "@/components/common/LoadingSpinner";
import { ExpenseFilters } from "@/components/expenses/ExpenseFilters";
import { ExpenseList } from "@/components/expenses/ExpenseList";
import { ExpensePageClient } from "@/components/expenses/ExpensePageClient";
import { Card, CardContent } from "@/components/ui/card";
import { serverApiGet } from "@/lib/server/api";
import type { CategoryResponse, FamilyResponse } from "@/types/api";
import { redirect } from "next/navigation";
import { Suspense } from "react";

// 쿠키를 사용하므로 동적 렌더링 필요
export const dynamic = "force-dynamic";

interface SearchParams {
  categoryId?: string;
  startDate?: string;
  endDate?: string;
  page?: string;
  limit?: string;
}

interface ExpensesPageProps {
  searchParams: Promise<SearchParams>;
}

async function ExpenseListWrapper({
  familyId,
  categories,
  searchParams,
}: {
  familyId: string;
  categories: CategoryResponse[];
  searchParams: SearchParams;
}) {
  const page = parseInt(searchParams.page || "1", 10);
  const limit = parseInt(searchParams.limit || "25", 10);

  return (
    <ExpenseList
      familyId={familyId}
      categories={categories}
      categoryId={searchParams.categoryId}
      startDate={searchParams.startDate}
      endDate={searchParams.endDate}
      page={page}
      limit={limit}
    />
  );
}

export default async function ExpensesPage({
  searchParams,
}: ExpensesPageProps) {
  const resolvedSearchParams = await searchParams;

  // 백엔드 API에서 가족 정보 조회 (Server-side API 호출)
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
    // 카테고리가 없어도 페이지는 표시
    categories = [];
  }

  return (
    <>
      {/* 페이지 헤더 */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">지출 관리</h1>

        <ExpensePageClient categories={categories} familyUuid={family.uuid} />
      </div>

      {/* 필터 섹션 */}
      <div className="mb-6">
        <ExpenseFilters categories={categories} />
      </div>

      {/* 지출 목록 */}
      <Suspense
        fallback={
          <Card>
            <CardContent className="flex justify-center items-center py-8">
              <LoadingSpinner />
            </CardContent>
          </Card>
        }
      >
        <ExpenseListWrapper
          familyId={family.uuid}
          categories={categories}
          searchParams={resolvedSearchParams}
        />
      </Suspense>
    </>
  );
}
