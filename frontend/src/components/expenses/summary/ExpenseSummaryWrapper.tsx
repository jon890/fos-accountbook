/**
 * Expense Summary Wrapper - Server Component
 * 카테고리별 지출 요약을 백엔드 집계 API로 조회
 */

import { Suspense } from "react";
import { CategoryExpenseSummary } from "./CategoryExpenseSummary";
import { serverApiGet } from "@/lib/server/api";
import { ApiErrorBoundary } from "@/components/common/ApiErrorBoundary";
import type { CategoryExpenseSummaryResponse } from "@/types/expense";

interface ExpenseSummaryWrapperProps {
  familyId: string;
  categoryId?: string;
  startDate?: string;
  endDate?: string;
}

/**
 * 지출 요약 데이터를 가져오는 Server Component
 */
async function ExpenseSummaryContent({
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

  // 대시보드 백엔드 집계 API 호출
  const summary = await serverApiGet<CategoryExpenseSummaryResponse>(
    `/families/${familyId}/dashboard/expenses/by-category?${params.toString()}`
  );

  // 데이터가 없으면 null 반환
  if (!summary || summary.categoryStats.length === 0) {
    return null;
  }

  return <CategoryExpenseSummary summary={summary} />;
}

/**
 * 에러 바운더리로 감싼 지출 요약 래퍼
 */
export function ExpenseSummaryWrapper(props: ExpenseSummaryWrapperProps) {
  return (
    <ApiErrorBoundary
      errorMessage="지출 요약을 불러오는 중 오류가 발생했습니다."
      fallback={null}
    >
      <Suspense fallback={null}>
        <ExpenseSummaryContent {...props} />
      </Suspense>
    </ApiErrorBoundary>
  );
}
