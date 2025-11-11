/**
 * Transactions Page - 내역 페이지 (지출/수입)
 * 탭으로 지출과 수입을 구분하여 표시
 */

import { LoadingSpinner } from "@/components/common/LoadingSpinner";
import { TransactionsPageClient } from "@/components/transactions/TransactionsPageClient";
import { Card, CardContent } from "@/components/ui/card";
import { serverApiGet } from "@/lib/server/api";
import type { CategoryResponse, FamilyResponse } from "@/types/api";
import { redirect } from "next/navigation";
import { Suspense } from "react";

// 쿠키를 사용하므로 동적 렌더링 필요
export const dynamic = "force-dynamic";

interface SearchParams {
  tab?: "expenses" | "incomes";
  categoryId?: string;
  startDate?: string;
  endDate?: string;
  page?: string;
  limit?: string;
}

interface TransactionsPageProps {
  searchParams: Promise<SearchParams>;
}

export default async function TransactionsPage({
  searchParams,
}: TransactionsPageProps) {
  const resolvedSearchParams = await searchParams;

  // 기본 탭은 지출
  const activeTab = resolvedSearchParams.tab || "expenses";

  // 기본값: 현재 달의 시작일과 종료일
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth();

  const defaultStartDate = new Date(currentYear, currentMonth, 1)
    .toISOString()
    .split("T")[0];
  const defaultEndDate = new Date(currentYear, currentMonth + 1, 0)
    .toISOString()
    .split("T")[0];

  // 쿼리 파라미터가 없으면 기본값 사용
  const startDate = resolvedSearchParams.startDate || defaultStartDate;
  const endDate = resolvedSearchParams.endDate || defaultEndDate;

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
    <div className="space-y-6">
      <Suspense
        fallback={
          <Card>
            <CardContent className="flex justify-center items-center py-8">
              <LoadingSpinner />
            </CardContent>
          </Card>
        }
      >
        <TransactionsPageClient
          familyUuid={family.uuid}
          categories={categories}
          activeTab={activeTab}
          searchParams={{
            ...resolvedSearchParams,
            startDate,
            endDate,
          }}
        />
      </Suspense>
    </div>
  );
}
