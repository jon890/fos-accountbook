/**
 * 카테고리 관련 타입
 */

/**
 * 카테고리 응답
 */
export interface CategoryResponse {
  uuid: string;
  familyUuid: string;
  name: string;
  icon?: string;
  color?: string;
  excludeFromBudget?: boolean;
  createdAt: string;
  updatedAt: string;
}

/**
 * 카테고리 생성 요청
 */
export interface CreateCategoryRequest {
  name: string;
  icon?: string;
  color?: string;
  excludeFromBudget?: boolean;
}

/**
 * 카테고리 수정 요청
 */
export interface UpdateCategoryRequest {
  name?: string;
  icon?: string;
  color?: string;
  excludeFromBudget?: boolean;
}
