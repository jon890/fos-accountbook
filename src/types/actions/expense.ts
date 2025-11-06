/**
 * Expense Actions 타입 정의
 */

export type CreateExpenseFormState = {
  errors?: {
    amount?: string[];
    description?: string[];
    categoryId?: string[];
    date?: string[];
  };
  message?: string;
  success?: boolean;
};

export type UpdateExpenseFormState = {
  errors?: {
    amount?: string[];
    description?: string[];
    categoryId?: string[];
    date?: string[];
  };
  message?: string;
  success?: boolean;
};

export interface GetExpensesParams {
  familyId: string;
  categoryId?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}

export interface GetExpensesResult {
  success: boolean;
  data?: {
    expenses: Array<{
      uuid: string;
      amount: string;
      description?: string;
      date: string;
      categoryUuid: string;
      categoryName?: string;
      categoryColor?: string;
    }>;
    totalPages: number;
    totalElements: number;
    currentPage: number;
  };
  message?: string;
}
