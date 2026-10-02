import type { CategoryInfo } from "@/types/common";

export interface RecurringExpense {
  uuid: string;
  familyUuid: string;
  categoryUuid: string;
  category: CategoryInfo | null;
  name: string;
  amount: number;
  dayOfMonth: number;
  status: "ACTIVE" | "ENDED";
  generatedThisMonth: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface GetRecurringExpensesResponse {
  totalMonthlyAmount: number;
  items: RecurringExpense[];
}

export interface CreateRecurringExpenseRequest {
  name: string;
  categoryUuid: string;
  amount: number;
  dayOfMonth: number;
}

export interface UpdateRecurringExpenseRequest {
  name?: string;
  categoryUuid?: string;
  amount?: number;
  dayOfMonth?: number;
}
