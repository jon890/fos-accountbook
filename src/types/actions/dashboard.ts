/**
 * Dashboard Actions 타입 정의
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

export interface RecentExpense {
  id: string;
  uuid: string;
  amount: string;
  description: string | null;
  date: Date;
  category: {
    id: string;
    name: string;
    color: string;
    icon: string;
  };
}
