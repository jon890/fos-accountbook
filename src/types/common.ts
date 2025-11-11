/**
 * 공통 응답 및 에러 타입
 */

/**
 * API 성공 응답
 */
export interface ApiSuccessResponse<T> {
  success: true;
  message?: string;
  data: T;
  timestamp: string;
}

/**
 * API 에러 응답
 */
export interface ApiErrorResponse {
  success: false;
  message: string;
  error?: ErrorDetails;
  errors?: ErrorDetails[];
  timestamp: string;
}

/**
 * 에러 상세 정보
 */
export interface ErrorDetails {
  code?: string;
  field?: string;
  rejectedValue?: unknown;
}

/**
 * 공통 페이지네이션 응답
 */
export interface PaginationResponse<T> {
  items: T[];
  totalElements: number;
  totalPages: number;
  currentPage: number;
}

/**
 * 카테고리 기본 정보
 */
export interface CategoryInfo {
  uuid: string;
  name: string;
  color: string;
  icon: string;
}

/**
 * 공통 액션 결과
 */
export interface ActionResult {
  success: boolean;
  message?: string;
}

/**
 * 사용자 가족 확인 결과
 */
export interface CheckUserFamilyResult {
  hasFamily: boolean;
  familyId?: string;
}
