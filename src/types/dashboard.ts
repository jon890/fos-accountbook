/**
 * 대시보드 관련 타입
 */

/**
 * 대시보드 통계 응답
 */
export interface DashboardStats {
  totalExpense: string;
  monthlyExpense: string;
  weeklyExpense: string;
  categoryBreakdown: {
    categoryName: string;
    amount: string;
    percentage: number;
  }[];
}
