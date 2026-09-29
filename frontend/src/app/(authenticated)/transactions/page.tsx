/**
 * Transactions Page - 내역 페이지 (지출/수입)
 * 탭으로 지출과 수입을 구분하여 표시
 */

import { LoadingSpinner } from "@/components/common/LoadingSpinner";
import { ExpenseList } from "@/components/expenses/list/ExpenseList";
import { ExpenseSummaryWrapper } from "@/components/expenses/summary/ExpenseSummaryWrapper";
import { IncomeList } from "@/components/incomes/list/IncomeList";
import { RecurringExpenseList } from "@/components/recurring-expense/RecurringExpenseList";
import { TransactionsPageClient } from "./_components/TransactionsPageClient";
import { Card, CardContent } from "@/components/ui/card";
import type { CategoryResponse } from "@/types/category";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { getUserProfileAction } from "@/actions/user/get-user-profile-action";
import { getRecurringExpensesAction } from "@/actions/recurring-expense";
import { getSelectedFamilyAction } from "@/actions/family/get-selected-family-action";
import { getFamilyCategoriesAction } from "@/actions/category/get-categories-action";
import { getMonthRange } from "@/lib/utils/date-timezone";

// 쿠키를 사용하므로 동적 렌더링 필요
export const dynamic = "force-dynamic";

interface SearchParams {
  tab?: "expenses" | "incomes" | "recurring";
  categoryId?: string;
  startDate?: string;
  endDate?: string;
  page?: string;
  limit?: string;
  q?: string;
  amountMin?: string;
  amountMax?: string;
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
    console.error("Failed to fetch user timezone, fallback to Asia/Seoul:", error);
  }

  // 시간대 기준으로 현재 달의 시작일과 종료일 계산
  const { startDate: defaultStartDate, endDate: defaultEndDate } =
    getMonthRange(timezone);

  // 쿼리 파라미터가 없으면 기본값 사용
  const startDate = resolvedSearchParams.startDate || defaultStartDate;
  const endDate = resolvedSearchParams.endDate || defaultEndDate;

  // 선택된 가족 UUID 조회
  const familyResult = await getSelectedFamilyAction();
  if (!familyResult.success || !familyResult.data) {
    redirect("/families/create");
  }
  const familyUuid = familyResult.data;

  // 카테고리 목록 조회
  const categoriesResult = await getFamilyCategoriesAction(familyUuid);
  const categories: CategoryResponse[] = categoriesResult.success
    ? categoriesResult.data
    : [];

  const page = parseInt(resolvedSearchParams.page || "1", 10);
  const limit = parseInt(resolvedSearchParams.limit || "25", 10);

  // 현재 월 (YYYY-MM 형식)
  const currentMonth = startDate.slice(0, 7);

  return (
    <TransactionsPageClient
      familyUuid={familyUuid}
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
              <Card className="w-full border-0 bg-bg-elev backdrop-blur-sm shadow-xl">
                <CardContent className="flex justify-center items-center min-h-[200px] py-8">
                  <LoadingSpinner />
                </CardContent>
              </Card>
            }
          >
            <ExpenseSummaryWrapper
              familyId={familyUuid}
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
              familyId={familyUuid}
              categories={categories}
              categoryId={resolvedSearchParams.categoryId}
              startDate={startDate}
              endDate={endDate}
              page={page}
              limit={limit}
              q={resolvedSearchParams.q}
              amountMin={resolvedSearchParams.amountMin}
              amountMax={resolvedSearchParams.amountMax}
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
            familyId={familyUuid}
            categoryId={resolvedSearchParams.categoryId}
            startDate={startDate}
            endDate={endDate}
            page={page}
            limit={limit}
            q={resolvedSearchParams.q}
            amountMin={resolvedSearchParams.amountMin}
            amountMax={resolvedSearchParams.amountMax}
          />
        </Suspense>
      }
      recurringListContent={
        <Suspense
          fallback={
            <Card className="w-full">
              <CardContent className="flex justify-center items-center min-h-[400px] py-12">
                <LoadingSpinner />
              </CardContent>
            </Card>
          }
        >
          <RecurringExpenseListWrapper
            month={currentMonth}
          />
        </Suspense>
      }
    />
  );
}

async function RecurringExpenseListWrapper({ month }: { month: string }) {
  const result = await getRecurringExpensesAction(month);

  if (!result.success) {
    return (
      <Card className="w-full">
        <CardContent className="flex justify-center items-center min-h-[200px] py-8">
          <p className="text-fg-muted text-sm">고정지출을 불러올 수 없습니다</p>
        </CardContent>
      </Card>
    );
  }

  return <RecurringExpenseList data={result.data} />;
}
