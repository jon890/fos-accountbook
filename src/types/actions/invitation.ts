/**
 * Invitation Actions 타입 정의
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
