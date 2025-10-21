/**
 * 백엔드 API 타입 정의
 * Spring Boot 백엔드의 DTO와 일치하는 타입 정의
 */

// ============================
// 공통 응답 타입
// ============================

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

// ============================
// 인증 (Authentication)
// ============================

/**
 * 인증 응답
 */
export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  tokenType: string;
  expiresIn: number;
  user: UserInfo;
}

/**
 * 사용자 정보
 */
export interface UserInfo {
  id: string;
  uuid: string;
  name?: string;
  email: string;
  image?: string;
  createdAt: string;
}

/**
 * 회원가입 요청
 */
export interface RegisterRequest {
  email: string;
  name?: string;
  image?: string;
}

/**
 * 로그인 요청
 */
export interface LoginRequest {
  email: string;
}

/**
 * 토큰 갱신 요청
 */
export interface RefreshTokenRequest {
  refreshToken: string;
}

// ============================
// 가족 (Family)
// ============================

/**
 * 가족 응답
 */
export interface FamilyResponse {
  uuid: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  memberCount?: number;
  categories?: CategoryResponse[];
}

/**
 * 가족 구성원 응답
 */
export interface FamilyMemberResponse {
  id: number;
  uuid: string;
  userId: string;
  userName?: string;
  userEmail: string;
  userImage?: string;
  role: string;
  joinedAt: string;
}

/**
 * 가족 생성 요청
 */
export interface CreateFamilyRequest {
  name: string;
  description?: string;
}

/**
 * 가족 수정 요청
 */
export interface UpdateFamilyRequest {
  name?: string;
  description?: string;
}

// ============================
// 카테고리 (Category)
// ============================

/**
 * 카테고리 응답
 */
export interface CategoryResponse {
  uuid: string;
  familyUuid: string;
  name: string;
  icon?: string;
  color?: string;
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
}

/**
 * 카테고리 수정 요청
 */
export interface UpdateCategoryRequest {
  name?: string;
  icon?: string;
  color?: string;
}

// ============================
// 지출 (Expense)
// ============================

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
 * 지출 페이지 응답 (Spring Data Page)
 */
export interface PageResponse<T> {
  content: T[];
  pageable: {
    pageNumber: number;
    pageSize: number;
    offset: number;
    paged: boolean;
    unpaged: boolean;
  };
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
  numberOfElements: number;
  first: boolean;
  last: boolean;
  empty: boolean;
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

// ============================
// 수입 (Income)
// ============================

/**
 * 수입 응답
 */
export interface IncomeResponse {
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

// ============================
// 초대 (Invitation)
// ============================

/**
 * 초대장 응답
 */
export interface InvitationResponse {
  uuid: string;
  familyUuid: string;
  familyName?: string;
  token: string;
  status: string; // "PENDING" | "ACCEPTED" | "EXPIRED" | "CANCELLED"
  expiresAt: string;
  createdAt: string;
  isExpired: boolean;
  isUsed: boolean;
}

/**
 * 초대장 생성 요청
 */
export interface CreateInvitationRequest {
  expiresInHours?: number; // 기본값: 72시간 (3일)
}

/**
 * 초대 수락 요청
 */
export interface AcceptInvitationRequest {
  token: string;
}

// ============================
// 대시보드 통계
// ============================

/**
 * 대시보드 통계 응답 (백엔드에 구현 필요한 경우)
 */
export interface DashboardStats {
  totalExpense: string;
  monthlyExpense: string;
  weeklyExpense: string;
  categoryBreakdown: {
    categoryName: string;
    amount: string;
    percentage: number;
  }[];
}
