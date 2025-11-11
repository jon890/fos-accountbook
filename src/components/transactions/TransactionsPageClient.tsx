"use client";

import { ExpenseFilters } from "@/components/expenses/ExpenseFilters";
import { ExpensePageClient } from "@/components/expenses/ExpensePageClient";
import { IncomePageClient } from "@/components/incomes/IncomePageClient";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { CategoryResponse } from "@/types/api";
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
          <ExpensePageClient categories={categories} familyUuid={familyUuid} />
        ) : (
          <IncomePageClient familyUuid={familyUuid} />
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

        {/* Server Component로 렌더링된 컨텐츠 표시 */}
        <div className="mt-6">
          {activeTab === "expenses" ? expenseListContent : incomeListContent}
        </div>
      </Tabs>
    </div>
  );
}
