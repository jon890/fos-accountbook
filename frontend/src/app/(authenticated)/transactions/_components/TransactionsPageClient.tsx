"use client";

import { TransactionsTabs } from "@/app/(authenticated)/transactions/_components/TransactionsTabs";
import { FilterChips } from "@/app/(authenticated)/transactions/_components/FilterChips";
import { FilterSheet } from "@/app/(authenticated)/transactions/_components/FilterSheet";
import { SearchBar } from "@/app/(authenticated)/transactions/_components/SearchBar";
import type { CategoryResponse } from "@/types/category";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { useNavigationPending } from "@/lib/client/navigation";
import { ReactNode } from "react";

type TabType = "expenses" | "incomes" | "recurring";

interface TransactionsPageClientProps {
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
  categories,
  activeTab,
  searchParams,
  expenseListContent,
  incomeListContent,
  recurringListContent,
}: TransactionsPageClientProps) {
  const isNavigationPending = useNavigationPending();
  const isDesktop = useMediaQuery("(min-width: 768px)");

  return (
    <div className="space-y-4">
      <fieldset disabled={isNavigationPending} className="min-w-0">
        <TransactionsTabs activeTab={activeTab} />
      </fieldset>

      {/* 필터 + 검색 (반복지출 탭에서는 숨김) */}
      {activeTab !== "recurring" && (
        <div className="flex min-w-0 items-start gap-3">
          <fieldset disabled={isNavigationPending} className="flex-1 min-w-0">
            {isDesktop ? (
              <FilterChips
                categories={categories}
                defaultStartDate={searchParams.startDate}
                defaultEndDate={searchParams.endDate}
              />
            ) : (
              <FilterSheet
                categories={categories}
                categoryType={activeTab === "incomes" ? "INCOME" : "EXPENSE"}
                defaultStartDate={searchParams.startDate}
                defaultEndDate={searchParams.endDate}
              />
            )}
          </fieldset>
          {/* 모바일: 검색 아이콘, 데스크톱: 240px 검색 input. 대기 중에도 입력을 받는다 */}
          <div className="shrink-0 pt-0.5">
            <SearchBar />
          </div>
        </div>
      )}

      {/* 내역 목록 */}
      <div
        aria-busy={isNavigationPending}
        className={`transition-opacity ${isNavigationPending ? "pointer-events-none opacity-60" : ""}`}
      >
        {activeTab === "expenses"
          ? expenseListContent
          : activeTab === "incomes"
            ? incomeListContent
            : recurringListContent}
      </div>
    </div>
  );
}
