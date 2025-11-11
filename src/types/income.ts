/**
 * 수입 관련 타입
 */

import type { CategoryInfo, PaginationResponse } from "./common";

/**
 * 수입 응답 (백엔드 API 응답)
 */
export interface IncomeResponse {
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
 * 수입 엔티티 (클라이언트 사이드용)
 */
export interface Income {
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
 * 수입 생성 요청
 */
export interface CreateIncomeRequest {
  categoryUuid: string;
  amount: number;
  description?: string;
  date: string; // ISO 8601 형식 (YYYY-MM-DDTHH:mm:ss)
}

/**
 * 수입 수정 요청
 */
export interface UpdateIncomeRequest {
  categoryUuid?: string;
  amount?: number;
  description?: string;
  date?: string;
}

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

/**
 * 수입 목록 조회 응답
 */
export type GetIncomesResponse = PaginationResponse<Income>;

/**
 * 수입 생성 폼 상태
 */
export type CreateIncomeFormState = {
  errors?: {
    amount?: string[];
    description?: string[];
    categoryUuid?: string[];
    date?: string[];
  };
  message?: string;
  success?: boolean;
};

/**
 * 수입 수정 폼 상태
 */
export type UpdateIncomeFormState = {
  errors?: {
    amount?: string[];
    description?: string[];
    categoryUuid?: string[];
    date?: string[];
  };
  message?: string;
  success?: boolean;
};
