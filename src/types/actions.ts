/**
 * Server Actions 타입 정의
 */

/**
 * Dashboard Actions
 */
export interface DashboardStats {
  monthlyExpense: number;
  monthlyIncome: number;
  remainingBudget: number;
  familyMembers: number;
  budget: number;
  year: number;
  month: number;
}

export interface RecentExpense {
  id: string;
  uuid: string;
  amount: string;
  description: string | null;
  date: Date;
  category: {
    id: string;
    name: string;
    color: string;
    icon: string;
  };
}

/**
 * Expense Actions
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

export interface GetExpensesParams {
  familyId: string;
  categoryId?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}

export interface GetExpensesResult {
  success: boolean;
  data?: {
    expenses: Array<{
      uuid: string;
      amount: string;
      description?: string;
      date: string;
      categoryUuid: string;
      categoryName?: string;
      categoryColor?: string;
    }>;
    totalPages: number;
    totalElements: number;
    currentPage: number;
  };
  message?: string;
}

/**
 * Invitation Actions
 */
export interface InvitationInfo {
  uuid: string;
  token: string;
  expiresAt: Date;
  createdAt: Date;
  isExpired: boolean;
  isUsed: boolean;
  inviteUrl: string;
}

export interface CreateInvitationResult {
  success: boolean;
  invitation?: InvitationInfo;
  message: string;
}

export interface InvitationActionResult {
  success: boolean;
  message: string;
  familyUuid?: string;
}

export interface InvitationInfoResult {
  valid: boolean;
  familyName?: string;
  expiresAt?: Date;
  message?: string;
}

/**
 * Family Actions
 */
export interface FamilyMember {
  uuid: string;
  userUuid: string;
  role: string;
  userName?: string;
  userEmail?: string;
  userImage?: string;
}

export interface FamilyCategory {
  uuid: string;
  name: string;
  color: string;
  icon: string;
}

export interface Family {
  uuid: string;
  name: string;
  description?: string;
  role: string;
  members?: FamilyMember[];
  categories?: FamilyCategory[];
  expenseCount?: number;
}

export interface GetFamiliesResult {
  success: boolean;
  data?: Family[];
  message?: string;
}

export interface CreateFamilyData {
  name: string;
  description?: string;
}

export interface CreateFamilyResult {
  uuid: string;
  name: string;
  description?: string;
}

/**
 * Common Action Results
 */
export interface ActionResult {
  success: boolean;
  message?: string;
}

export interface CheckUserFamilyResult {
  hasFamily: boolean;
  familyId?: string;
}
