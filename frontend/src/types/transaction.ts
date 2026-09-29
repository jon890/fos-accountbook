/**
 * 트랜잭션 공통 타입 (지출·수입·정기지출 공통)
 */

export type TransactionType = "expense" | "income" | "recurring";

export interface DateGroupWithTotal<T> {
  dateKey: string;
  label: string;
  totalAmount: number;
  items: T[];
}

export interface TransactionFilters {
  categoryUuid?: string;
  startDate?: string;
  endDate?: string;
  amountMin?: number;
  amountMax?: number;
  q?: string;
}
