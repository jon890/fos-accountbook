/**
 * 지출 관련 타입
 */

import type { CategoryInfo, PaginationResponse } from "./common";

/**
 * 지출 응답 (백엔드 API 응답)
 */
export interface ExpenseResponse {
  uuid: string;
  familyUuid: string;
  categoryUuid: string;
  category: CategoryInfo; // 카테고리 정보 포함
  amount: string; // BigDecimal은 문자열로 전송
  description?: string;
  date: string; // ISO 8601 형식
  createdAt: string;
  updatedAt: string;
}

/**
 * 지출 엔티티 (클라이언트 사이드용)
 */
export interface Expense {
  uuid: string;
  familyUuid: string;
  categoryUuid: string;
  category: {
    uuid: string;
    name: string;
    color: string;
    icon: string;
  };
  amount: number;
  description: string | null;
  date: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * 카테고리별 지출 통계
 */
export interface CategoryExpenseStatResponse {
  categoryUuid: string;
  categoryName: string;
  categoryIcon: string;
  categoryColor: string;
  totalAmount: number;
  count: number;
  percentage: number;
}

/**
 * 카테고리별 지출 요약 응답
 */
export interface CategoryExpenseSummaryResponse {
  totalExpense: number;
  categoryStats: CategoryExpenseStatResponse[];
}

/**
 * 지출 생성 요청
 */
export interface CreateExpenseRequest {
  categoryUuid: string;
  amount: number;
  description?: string;
  date: string; // ISO 8601 형식 (YYYY-MM-DDTHH:mm:ss)
}

/**
 * 지출 수정 요청
 */
export interface UpdateExpenseRequest {
  categoryUuid?: string;
  amount?: number;
  description?: string;
  date?: string;
}

/**
 * 지출 목록 조회 파라미터
 */
export interface GetExpensesParams {
  familyId: string;
  categoryId?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}

/**
 * 지출 목록 조회 응답
 */
export type GetExpensesResponse = PaginationResponse<Expense>;

/**
 * 지출 생성 폼 상태
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

/**
 * 지출 수정 폼 상태
 */
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
