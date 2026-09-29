"use client";

import { TransactionsTabs } from "@/app/(authenticated)/transactions/_components/TransactionsTabs";
import { FilterChips } from "@/app/(authenticated)/transactions/_components/FilterChips";
import { SearchBar } from "@/app/(authenticated)/transactions/_components/SearchBar";
import { ExpenseTabContent } from "@/app/(authenticated)/transactions/_components/ExpenseTabContent";
import { IncomeTabContent } from "@/app/(authenticated)/transactions/_components/IncomeTabContent";
import { RecurringTabContent } from "@/app/(authenticated)/transactions/_components/RecurringTabContent";
import type { CategoryResponse } from "@/types/category";
import { ReactNode } from "react";

type TabType = "expenses" | "incomes" | "recurring";

interface TransactionsPageClientProps {
  familyUuid: string;
  categories: CategoryResponse[];
  activeTab: TabType;
  searchParams: {
    categoryId?: string;
    startDate?: string;
    endDate?: string;
    page?: string;
    limit?: string;
    q?: string;
    amountMin?: string;
    amountMax?: string;
  };
  expenseListContent: ReactNode;
  incomeListContent: ReactNode;
  recurringListContent: ReactNode;
}

export function TransactionsPageClient({
  familyUuid,
  categories,
  activeTab,
  searchParams,
  expenseListContent,
  incomeListContent,
  recurringListContent,
}: TransactionsPageClientProps) {
  return (
    <div className="space-y-4">
      {/* 세그먼트 탭 + 추가 버튼 */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex-1 min-w-0">
          <TransactionsTabs activeTab={activeTab} />
        </div>
        <div className="shrink-0">
          {activeTab === "expenses" ? (
            <ExpenseTabContent categories={categories} familyUuid={familyUuid} />
          ) : activeTab === "incomes" ? (
            <IncomeTabContent />
          ) : (
            <RecurringTabContent />
          )}
        </div>
      </div>

      {/* 필터 + 검색 (반복지출 탭에서는 숨김) */}
      {activeTab !== "recurring" && (
        <div className="flex items-start gap-3">
          <div className="flex-1 min-w-0">
            <FilterChips
              categories={categories}
              defaultStartDate={searchParams.startDate}
              defaultEndDate={searchParams.endDate}
            />
          </div>
          {/* 모바일: 검색 아이콘, 데스크톱: 240px 검색 input */}
          <div className="shrink-0 pt-0.5">
            <SearchBar />
          </div>
        </div>
      )}

      {/* 내역 목록 */}
      <div>
        {activeTab === "expenses"
          ? expenseListContent
          : activeTab === "incomes"
            ? incomeListContent
            : recurringListContent}
      </div>
    </div>
  );
}
