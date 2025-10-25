/**
 * 초대 정보 조회 (토큰으로) Server Action
 */

"use server";

import {
  ActionError,
  handleActionError,
  successResult,
  type ActionResult,
} from "@/lib/errors";
import { serverApiClient } from "@/lib/server/api/client";
import type { InvitationResponse } from "@/types/api";

export interface InvitationInfoData {
  valid: boolean;
  familyName?: string;
  expiresAt?: Date;
  message?: string;
}

export async function getInvitationInfoAction(
  token: string
): Promise<ActionResult<InvitationInfoData>> {
  try {
    // 토큰 검증 (이 함수는 공개 API이므로 인증 불필요)
    if (!token || token.trim().length === 0) {
      throw ActionError.invalidInput("초대 토큰", token, "토큰은 필수입니다");
    }

    // 초대 정보 조회 (인증 불필요 - 백엔드에서 공개 엔드포인트로 설정됨)
    const invitationResponse = await serverApiClient<{
      data: InvitationResponse;
    }>(`/invitations/token/${token}`, {
      method: "GET",
      skipAuth: true, // 공개 API
    });
    const invitation = invitationResponse.data;

    if (
      !invitation ||
      invitation.status === "EXPIRED" ||
      invitation.status === "CANCELLED"
    ) {
      return successResult({
        valid: false,
        message:
          invitation.status === "EXPIRED"
            ? "만료된 초대장입니다"
            : "취소된 초대장입니다",
      });
    }

    if (invitation.status === "ACCEPTED") {
      return successResult({
        valid: false,
        message: "이미 사용된 초대장입니다",
      });
    }

    const expiresAt = new Date(invitation.expiresAt);
    const now = new Date();
    if (now > expiresAt) {
      return successResult({
        valid: false,
        message: "만료된 초대장입니다",
      });
    }

    return successResult({
      valid: true,
      familyName: invitation.familyName || "가족",
      expiresAt,
    });
  } catch (error) {
    console.error("Failed to get invitation info:", error);
    return handleActionError(error, "초대 정보를 가져오는데 실패했습니다");
  }
}
