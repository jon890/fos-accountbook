"use client";

import { TransactionsTabs } from "@/app/(authenticated)/transactions/_components/TransactionsTabs";
import { FilterChips } from "@/app/(authenticated)/transactions/_components/FilterChips";
import { FilterSheet } from "@/app/(authenticated)/transactions/_components/FilterSheet";
import { SearchBar } from "@/app/(authenticated)/transactions/_components/SearchBar";
import type { CategoryResponse } from "@/types/category";
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

  return (
    <div className="space-y-4">
      <fieldset disabled={isNavigationPending} className="min-w-0">
        <TransactionsTabs activeTab={activeTab} />
      </fieldset>

      {/* 필터 + 검색 (반복지출 탭에서는 숨김) */}
      {activeTab !== "recurring" && (
        <div className="flex min-w-0 items-start gap-3">
          <fieldset disabled={isNavigationPending} className="flex-1 min-w-0">
            {/* 폭 판정을 JS 로 하면 서버 렌더가 모바일로 그려져 데스크톱 첫 화면에 「필터」 버튼이 잠깐 뜬다.
                둘 다 그리고 CSS 로 하나만 보인다. */}
            <div className="hidden md:block">
              <FilterChips
                categories={categories}
                defaultStartDate={searchParams.startDate}
                defaultEndDate={searchParams.endDate}
              />
            </div>
            <div className="md:hidden">
              <FilterSheet
                categories={categories}
                categoryType={activeTab === "incomes" ? "INCOME" : "EXPENSE"}
                defaultStartDate={searchParams.startDate}
                defaultEndDate={searchParams.endDate}
              />
            </div>
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
