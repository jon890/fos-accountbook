/**
 * 수입 목록 조회 파라미터
 */
export interface GetIncomesParams {
  familyId: string;
  categoryId?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}
