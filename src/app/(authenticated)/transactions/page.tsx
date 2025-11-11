/**
 * Transactions Page - 내역 페이지 (지출/수입)
 * 탭으로 지출과 수입을 구분하여 표시
 */

import { LoadingSpinner } from "@/components/common/LoadingSpinner";
import { ExpenseList } from "@/components/expenses/list/ExpenseList";
import { ExpenseSummaryWrapper } from "@/components/expenses/summary/ExpenseSummaryWrapper";
import { IncomeList } from "@/components/incomes/list/IncomeList";
import { TransactionsPageClient } from "@/components/transactions/TransactionsPageClient";
import { Card, CardContent } from "@/components/ui/card";
import { serverApiGet } from "@/lib/server/api";
import type { CategoryResponse } from "@/types/category";
import type { FamilyResponse } from "@/types/family";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { getUserProfileAction } from "@/app/actions/user/get-user-profile-action";
import { getMonthRange } from "@/lib/utils/date-timezone";

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

  // 사용자 프로필에서 시간대 가져오기
  let timezone = "Asia/Seoul"; // 기본값
  try {
    const profileResult = await getUserProfileAction();
    if (profileResult.success && profileResult.data.timezone) {
      timezone = profileResult.data.timezone;
    }
  } catch (error) {
    console.error("Failed to fetch user timezone:", error);
  }

  // 시간대 기준으로 현재 달의 시작일과 종료일 계산
  const { startDate: defaultStartDate, endDate: defaultEndDate } =
    getMonthRange(timezone);

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

  const page = parseInt(resolvedSearchParams.page || "1", 10);
  const limit = parseInt(resolvedSearchParams.limit || "25", 10);

  return (
    <TransactionsPageClient
      familyUuid={family.uuid}
      categories={categories}
      activeTab={activeTab}
      searchParams={{
        ...resolvedSearchParams,
        startDate,
        endDate,
      }}
      expenseListContent={
        <div className="space-y-4 md:space-y-6">
          {/* 카테고리별 지출 요약 */}
          <Suspense
            fallback={
              <Card className="w-full border-0 bg-white/80 backdrop-blur-sm shadow-xl">
                <CardContent className="flex justify-center items-center min-h-[200px] py-8">
                  <LoadingSpinner />
                </CardContent>
              </Card>
            }
          >
            <ExpenseSummaryWrapper
              familyId={family.uuid}
              categoryId={resolvedSearchParams.categoryId}
              startDate={startDate}
              endDate={endDate}
            />
          </Suspense>

          {/* 지출 목록 */}
          <Suspense
            fallback={
              <Card className="w-full">
                <CardContent className="flex justify-center items-center min-h-[400px] py-12">
                  <LoadingSpinner />
                </CardContent>
              </Card>
            }
          >
            <ExpenseList
              familyId={family.uuid}
              categories={categories}
              categoryId={resolvedSearchParams.categoryId}
              startDate={startDate}
              endDate={endDate}
              page={page}
              limit={limit}
            />
          </Suspense>
        </div>
      }
      incomeListContent={
        <Suspense
          fallback={
            <Card className="w-full">
              <CardContent className="flex justify-center items-center min-h-[400px] py-12">
                <LoadingSpinner />
              </CardContent>
            </Card>
          }
        >
          <IncomeList
            familyId={family.uuid}
            categories={categories}
            categoryId={resolvedSearchParams.categoryId}
            startDate={startDate}
            endDate={endDate}
            page={page}
            limit={limit}
          />
        </Suspense>
      }
    />
  );
}
