/**
 * 대시보드 관련 타입
 */

/**
 * 대시보드 통계
 */
export interface DashboardStats {
  monthlyExpense: number;
  monthlyIncome: number;
  remainingBudget: number;
  familyMembers: number;
  budget: number;
  year: number;
  month: number;
}

/**
 * 최근 지출 내역
 */
export interface RecentExpense {
  id: string;
  uuid: string;
  amount: string;
  description: string | null;
  date: string; // ISO 8601 형식 문자열
  category: {
    uuid: string;
    name: string;
    color: string;
    icon: string;
  };
}
