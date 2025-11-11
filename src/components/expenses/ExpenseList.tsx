import { getExpensesAction } from "@/app/actions/expense/get-expenses-action";
import { Card, CardContent } from "@/components/ui/card";
import type { CategoryResponse } from "@/types/api";
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
}

export async function ExpenseList({
  familyId,
  categories,
  categoryId,
  startDate,
  endDate,
  page = 1,
  limit = 25,
}: ExpenseListProps) {
  // Server Action으로 지출 목록 조회
  const result = await getExpensesAction({
    familyId,
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

  const { items: expenses, totalPages, totalElements, currentPage } = result.data;

  if (expenses.length === 0) {
    return (
      <Card className="border-0 bg-white/80 backdrop-blur-sm shadow-xl">
        <CardContent className="py-10 md:py-16">
          <p className="text-center text-gray-500 text-sm md:text-base">
            아직 지출 내역이 없습니다. 첫 번째 지출을 추가해보세요!
          </p>
        </CardContent>
      </Card>
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
