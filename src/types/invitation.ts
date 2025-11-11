/**
 * 초대 관련 타입
 */

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
