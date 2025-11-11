/**
 * 가족 관련 타입
 */

import type { CategoryResponse } from "./category";

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
