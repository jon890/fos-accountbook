/**
 * Expense Actions 타입 정의
 */

import type { ExpenseResponse } from "@/types/api";

/**
 * ExpenseItem 컴포넌트용 타입
 * ExpenseResponse 기반, UI에서 사용하기 편리하도록 확장
 */
export interface ExpenseItemData
  extends Pick<ExpenseResponse, "uuid" | "amount" | "categoryUuid"> {
  description?: string | null | undefined; // UI에서 null, undefined 모두 허용
  date: string; // ISO 8601 형식 문자열
  categoryName: string;
  categoryColor: string;
  categoryIcon: string;
}

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
