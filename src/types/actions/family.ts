/**
 * Family Actions 타입 정의
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
  createdAt: string;
  updatedAt: string;
  memberCount: number;
  expenseCount: number;
  categoryCount: number;
  description?: string;
  role?: string;
  members?: FamilyMember[];
  categories?: FamilyCategory[];
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
