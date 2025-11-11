"use client";

import { getExpensesAction } from "@/app/actions/expense/get-expenses-action";
import { getIncomesAction } from "@/app/actions/income/get-incomes-action";
import { CategoryExpenseSummary } from "@/components/expenses/CategoryExpenseSummary";
import { ExpenseFilters } from "@/components/expenses/ExpenseFilters";
import { ExpenseList } from "@/components/expenses/ExpenseList";
import { ExpensePageClient } from "@/components/expenses/ExpensePageClient";
import { IncomeList } from "@/components/incomes/IncomeList";
import { IncomePageClient } from "@/components/incomes/IncomePageClient";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { CategoryResponse } from "@/types/api";
import { TrendingDown, TrendingUp } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";

interface TransactionsPageClientProps {
  familyUuid: string;
  categories: CategoryResponse[];
  activeTab: "expenses" | "incomes";
  searchParams: {
    categoryId?: string;
    startDate?: string;
    endDate?: string;
    page?: string;
    limit?: string;
  };
}

export function TransactionsPageClient({
  familyUuid,
  categories,
  activeTab,
  searchParams,
}: TransactionsPageClientProps) {
  const router = useRouter();
  const currentSearchParams = useSearchParams();

  const handleTabChange = (tab: string) => {
    const params = new URLSearchParams(currentSearchParams.toString());
    params.set("tab", tab);
    // 페이지는 1로 리셋
    params.set("page", "1");
    router.push(`/transactions?${params.toString()}`);
  };

  const page = parseInt(searchParams.page || "1", 10);
  const limit = parseInt(searchParams.limit || "25", 10);

  return (
    <div className="space-y-6">
      {/* 페이지 헤더 */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">내역</h1>
        {activeTab === "expenses" ? (
          <ExpensePageClient categories={categories} familyUuid={familyUuid} />
        ) : (
          <IncomePageClient familyUuid={familyUuid} />
        )}
      </div>

      {/* 탭 */}
      <Tabs value={activeTab} onValueChange={handleTabChange}>
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="expenses" className="flex items-center gap-2">
            <TrendingDown className="w-4 h-4" />
            지출
          </TabsTrigger>
          <TabsTrigger value="incomes" className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4" />
            수입
          </TabsTrigger>
        </TabsList>

        {/* 지출 탭 */}
        <TabsContent value="expenses" className="space-y-6 mt-6">
          {/* 필터 */}
          <ExpenseFilters
            categories={categories}
            defaultStartDate={searchParams.startDate || ""}
            defaultEndDate={searchParams.endDate || ""}
          />

          {/* 지출 목록 */}
          <ExpenseList
            familyId={familyUuid}
            categories={categories}
            categoryId={searchParams.categoryId}
            startDate={searchParams.startDate}
            endDate={searchParams.endDate}
            page={page}
            limit={limit}
          />
        </TabsContent>

        {/* 수입 탭 */}
        <TabsContent value="incomes" className="space-y-6 mt-6">
          {/* 필터 */}
          <ExpenseFilters
            categories={categories}
            defaultStartDate={searchParams.startDate || ""}
            defaultEndDate={searchParams.endDate || ""}
          />

          {/* 수입 목록 */}
          <IncomeList
            familyId={familyUuid}
            categories={categories}
            categoryId={searchParams.categoryId}
            startDate={searchParams.startDate}
            endDate={searchParams.endDate}
            page={page}
            limit={limit}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}

