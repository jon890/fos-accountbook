/**
 * Expense Actions 타입 정의
 * @deprecated - 새로운 타입은 @/types/expense 사용
 */

import type { ExpenseResponse } from "@/types/api";

// Re-export for backward compatibility
export type {
  GetExpensesParams,
  CreateExpenseFormState,
  UpdateExpenseFormState,
} from "@/types/expense";

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
