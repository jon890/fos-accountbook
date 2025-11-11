/**
 * Expense Summary Wrapper - Server Component
 * 카테고리별 지출 요약을 표시하기 위해 전체 지출 데이터를 fetch
 */

import { getExpensesAction } from "@/app/actions/expense/get-expenses-action";
import { CategoryExpenseSummary } from "./CategoryExpenseSummary";
import type { CategoryResponse } from "@/types/api";

interface ExpenseSummaryWrapperProps {
  familyId: string;
  categories: CategoryResponse[];
  categoryId?: string;
  startDate?: string;
  endDate?: string;
}

export async function ExpenseSummaryWrapper({
  familyId,
  categories,
  categoryId,
  startDate,
  endDate,
}: ExpenseSummaryWrapperProps) {
  // 통계를 위해 많은 데이터 가져오기 (최대 1000건)
  const result = await getExpensesAction({
    familyId,
    categoryId,
    startDate,
    endDate,
    page: 1,
    limit: 1000,
  });

  if (!result.success || result.data.expenses.length === 0) {
    return null;
  }

  return (
    <CategoryExpenseSummary
      expenses={result.data.expenses}
      categories={categories}
    />
  );
}
