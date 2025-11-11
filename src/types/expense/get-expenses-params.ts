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
