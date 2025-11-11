/**
 * Expense Summary Wrapper - Server Component
 * 카테고리별 지출 요약을 백엔드 집계 API로 조회
 */

import { CategoryExpenseSummary } from "./CategoryExpenseSummary";
import { serverApiGet } from "@/lib/server/api";
import type { CategoryExpenseSummaryResponse } from "@/types/expense";

interface ExpenseSummaryWrapperProps {
  familyId: string;
  categoryId?: string;
  startDate?: string;
  endDate?: string;
}

export async function ExpenseSummaryWrapper({
  familyId,
  categoryId,
  startDate,
  endDate,
}: ExpenseSummaryWrapperProps) {
  // 쿼리 파라미터 생성
  const params = new URLSearchParams();
  if (startDate) params.append("startDate", startDate);
  if (endDate) params.append("endDate", endDate);
  if (categoryId) params.append("categoryId", categoryId);

  try {
    // 대시보드 백엔드 집계 API 호출
    const summary = await serverApiGet<CategoryExpenseSummaryResponse>(
      `/families/${familyId}/dashboard/expenses/by-category?${params.toString()}`
    );

    // 데이터가 없으면 null 반환
    if (!summary || summary.categoryStats.length === 0) {
      return null;
    }

    return <CategoryExpenseSummary summary={summary} />;
  } catch (error) {
    console.error("Failed to fetch expense summary:", error);
    return null;
  }
}
