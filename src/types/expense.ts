/**
 * 지출 관련 타입
 */

/**
 * 지출 응답
 */
export interface ExpenseResponse {
  uuid: string;
  familyUuid: string;
  categoryUuid: string;
  categoryName?: string;
  categoryColor?: string;
  amount: string; // BigDecimal은 문자열로 전송
  description?: string;
  date: string; // ISO 8601 형식
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
 * 지출 생성 폼 상태
 */
export interface CreateExpenseFormState {
  success?: boolean;
  message?: string;
  errors?: {
    [key: string]: string[];
  };
}

/**
 * 지출 수정 폼 상태
 */
export interface UpdateExpenseFormState {
  success?: boolean;
  message?: string;
  errors?: {
    [key: string]: string[];
  };
}
