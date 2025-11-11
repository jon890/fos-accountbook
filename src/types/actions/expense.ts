/**
 * Expense Actions 타입 정의
 * @deprecated - 새로운 타입은 @/types/expense 직접 사용
 */

import type { Expense } from "@/types/expense";

// Re-export for backward compatibility
export type {
  Expense,
  ExpenseResponse,
  GetExpensesParams,
  GetExpensesResponse,
  CreateExpenseFormState,
  UpdateExpenseFormState,
  CreateExpenseRequest,
  UpdateExpenseRequest,
  CategoryExpenseStatResponse,
  CategoryExpenseSummaryResponse,
} from "@/types/expense";

/**
 * ExpenseItem 컴포넌트용 타입
 * Expense 기반, UI에서 사용하기 편리하도록 확장
 */
export interface ExpenseItemData
  extends Pick<Expense, "uuid" | "categoryUuid"> {
  amount: string | number; // 문자열(백엔드 응답) 또는 숫자(클라이언트 변환) 모두 허용
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
