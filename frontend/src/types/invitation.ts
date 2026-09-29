/**
 * 초대 관련 타입
 */

/**
 * 초대장 응답 (백엔드 API)
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

/**
 * 초대 정보 (클라이언트 사이드)
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

/**
 * 초대 생성 결과
 */
export interface CreateInvitationResult {
  success: boolean;
  invitation?: InvitationInfo;
  message: string;
}

/**
 * 초대 액션 결과
 */
export interface InvitationActionResult {
  success: boolean;
  message: string;
  familyUuid?: string;
}

/**
 * 초대 정보 조회 결과
 */
export interface InvitationInfoResult {
  valid: boolean;
  familyName?: string;
  expiresAt?: Date;
  message?: string;
}
