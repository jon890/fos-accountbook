import { getExpensesAction } from "@/actions/expense/get-expenses-action";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/empty/EmptyState";
import type { CategoryResponse } from "@/types/category";
import { Inbox } from "lucide-react";
import { ExpenseListClient } from "./ExpenseListClient";
import { ExpensePagination } from "./ExpensePagination";

interface ExpenseListProps {
  familyId: string;
  categories: CategoryResponse[];
  categoryId?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
  q?: string;
  amountMin?: string;
  amountMax?: string;
}

export async function ExpenseList({
  familyId,
  categories,
  categoryId,
  startDate,
  endDate,
  page = 1,
  limit = 25,
  q,
  amountMin,
  amountMax,
}: ExpenseListProps) {
  const hasFilter = !!(categoryId || q || amountMin || amountMax);
  // Server Action으로 지출 목록 조회
  const result = await getExpensesAction({
    familyUuid: familyId,
    categoryId,
    startDate,
    endDate,
    page,
    limit,
  });

  if (!result.success) {
    return (
      <Card className="border-0 bg-white/80 backdrop-blur-sm shadow-xl">
        <CardContent className="py-8">
          <p className="text-center text-gray-500 text-sm md:text-base">
            {result.error.message || "지출 내역을 불러오는데 실패했습니다."}
          </p>
        </CardContent>
      </Card>
    );
  }

  const {
    items: expenses,
    totalPages,
    totalElements,
    currentPage,
  } = result.data;

  if (expenses.length === 0 && !hasFilter) {
    // IncomeList 와 동일 카피 — 도메인 wording 만 다를 수 있으나 현재 plan 에선 통일
    return (
      <EmptyState
        icon={Inbox}
        title="아직 거래가 없어요"
        description={"지출이나 수입을 추가하면\n여기에 표시돼요."}
        tip={{
          title: "팁",
          body: "가족 누구나 입력할 수 있어요. 카드 청구서 도착 전에\n그때 그때 짧게 적어두면 편해요.",
        }}
      />
    );
  }

  return (
    <div className="space-y-3 md:space-y-4">
      <Card className="border-0 bg-white/80 backdrop-blur-sm shadow-xl">
        <CardContent className="p-3 md:p-6">
          <ExpenseListClient
            expenses={expenses}
            categories={categories}
            familyUuid={familyId}
          />
        </CardContent>
      </Card>

      {/* 페이지네이션 */}
      {totalPages > 1 && (
        <ExpensePagination
          pagination={{
            page: currentPage + 1, // 백엔드는 0-based, UI는 1-based
            limit: limit,
            total: totalElements,
            totalPages: totalPages,
          }}
        />
      )}
    </div>
  );
}
