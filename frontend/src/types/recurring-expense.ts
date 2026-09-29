import type { CategoryResponse } from "@/types/category";

export interface RecurringExpense {
  uuid: string;
  familyUuid: string;
  categoryUuid: string;
  category: CategoryResponse | null;
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
