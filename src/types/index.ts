/**
 * 타입 통합 export
 * 모든 타입을 한 곳에서 import 가능
 */

// 공통 타입
export type {
  ApiSuccessResponse,
  ApiErrorResponse,
  ErrorDetails,
  PaginationResponse,
  CategoryInfo,
} from "./common";

// 인증
export type {
  UserInfo,
  AuthResponse,
  RegisterRequest,
  LoginRequest,
  RefreshTokenRequest,
} from "./auth";

// 가족
export type {
  FamilyResponse,
  FamilyMemberResponse,
  CreateFamilyRequest,
  UpdateFamilyRequest,
} from "./family";

// 카테고리
export type {
  CategoryResponse,
  CreateCategoryRequest,
  UpdateCategoryRequest,
} from "./category";

// 지출
export type {
  Expense,
  ExpenseResponse,
  CategoryExpenseStatResponse,
  CategoryExpenseSummaryResponse,
  CreateExpenseRequest,
  UpdateExpenseRequest,
  GetExpensesParams,
  GetExpensesResponse,
  CreateExpenseFormState,
  UpdateExpenseFormState,
} from "./expense";

// 수입
export type {
  Income,
  IncomeResponse,
  CreateIncomeRequest,
  UpdateIncomeRequest,
  GetIncomesParams,
  GetIncomesResponse,
  CreateIncomeFormState,
  UpdateIncomeFormState,
} from "./income";

// 초대
export type {
  InvitationResponse,
  CreateInvitationRequest,
  AcceptInvitationRequest,
} from "./invitation";

// 대시보드
export type { DashboardStats } from "./dashboard";
