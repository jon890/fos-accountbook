/**
 * 가족 관련 타입
 */

import type { CategoryResponse } from "./category";

/**
 * 가족 응답 (백엔드 API)
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

/**
 * 가족 구성원 (클라이언트 사이드)
 */
export interface FamilyMember {
  uuid: string;
  userUuid: string;
  role: string;
  userName?: string;
  userEmail?: string;
  userImage?: string;
}

/**
 * 가족 카테고리 (클라이언트 사이드)
 */
export interface FamilyCategory {
  uuid: string;
  name: string;
  color: string;
  icon: string;
}

/**
 * 가족 정보 (클라이언트 사이드)
 */
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

/**
 * 가족 목록 조회 결과
 */
export interface GetFamiliesResult {
  success: boolean;
  data?: Family[];
  message?: string;
}

/**
 * 가족 생성 데이터
 */
export interface CreateFamilyData {
  name: string;
  description?: string;
}

/**
 * 가족 생성 결과
 */
export interface CreateFamilyResult {
  uuid: string;
  name: string;
  description?: string;
}
