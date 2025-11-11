"use client";

import { ExpenseFilters } from "@/components/expenses/forms/ExpenseFilters";
import { ExpenseTabContent } from "@/app/(authenticated)/transactions/_components/ExpenseTabContent";
import { IncomeTabContent } from "@/app/(authenticated)/transactions/_components/IncomeTabContent";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/client/utils";
import type { CategoryResponse } from "@/types/category";
import { TrendingDown, TrendingUp } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { ReactNode } from "react";

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
  expenseListContent: ReactNode;
  incomeListContent: ReactNode;
}

export function TransactionsPageClient({
  familyUuid,
  categories,
  activeTab,
  searchParams,
  expenseListContent,
  incomeListContent,
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

  return (
    <div className="space-y-6">
      {/* 페이지 헤더 */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">내역</h1>
        {activeTab === "expenses" ? (
          <ExpenseTabContent categories={categories} familyUuid={familyUuid} />
        ) : (
          <IncomeTabContent familyUuid={familyUuid} />
        )}
      </div>

      {/* 필터 */}
      <ExpenseFilters
        categories={categories}
        defaultStartDate={searchParams.startDate || ""}
        defaultEndDate={searchParams.endDate || ""}
      />

      {/* 탭 */}
      <Tabs value={activeTab} onValueChange={handleTabChange}>
        <TabsList className="grid w-full max-w-md grid-cols-2 bg-gray-100 p-1 h-12">
          <TabsTrigger
            value="expenses"
            className={cn(
              "flex items-center gap-2 relative transition-all duration-300 rounded-md",
              "data-[state=active]:gradient-expense data-[state=active]:text-white",
              "data-[state=active]:shadow-lg data-[state=active]:shadow-red-500/50",
              "data-[state=inactive]:text-gray-600 data-[state=inactive]:hover:text-gray-900",
              "data-[state=inactive]:hover:bg-gray-50"
            )}
          >
            <TrendingDown className="w-4 h-4" />
            <span className="font-semibold">지출</span>
          </TabsTrigger>
          <TabsTrigger
            value="incomes"
            className={cn(
              "flex items-center gap-2 relative transition-all duration-300 rounded-md",
              "data-[state=active]:gradient-income data-[state=active]:text-white",
              "data-[state=active]:shadow-lg data-[state=active]:shadow-green-500/50",
              "data-[state=inactive]:text-gray-600 data-[state=inactive]:hover:text-gray-900",
              "data-[state=inactive]:hover:bg-gray-50"
            )}
          >
            <TrendingUp className="w-4 h-4" />
            <span className="font-semibold">수입</span>
          </TabsTrigger>
        </TabsList>

        {/* Server Component로 렌더링된 컨텐츠 표시 */}
        <div className="mt-6">
          {activeTab === "expenses" ? expenseListContent : incomeListContent}
        </div>
      </Tabs>
    </div>
  );
}
