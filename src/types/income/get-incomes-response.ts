import type { Income } from "./income";

/**
 * 수입 목록 조회 응답
 */
export interface GetIncomesResponse {
  items: Income[];
  totalElements: number;
  totalPages: number;
  currentPage: number;
}
