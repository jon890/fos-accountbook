/**
 * Invitation Server Actions
 * 백엔드 API를 호출하여 초대 링크 관리
 */

"use server";

import { auth } from "@/lib/auth";
import { apiGet, apiPost, apiDelete, ApiError } from "@/lib/api";
import { revalidatePath } from "next/cache";
import type { 
  FamilyResponse, 
  InvitationResponse, 
  CreateInvitationRequest,
  AcceptInvitationRequest 
} from "@/types/api";

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
 * 초대 링크 생성
 */
export async function createInvitationLink(): Promise<{
  success: boolean;
  invitation?: InvitationInfo;
  message: string;
}> {
  try {
    const session = await auth();
    if (!session?.user?.id || !session?.user?.accessToken) {
      return {
        success: false,
        message: "로그인이 필요합니다",
      };
    }

    // 사용자의 첫 번째 가족 정보 가져오기
    const families = await apiGet<FamilyResponse[]>(
      "/families",
      { token: session.user.accessToken }
    );

    if (!families || families.length === 0) {
      return {
        success: false,
        message: "가족 정보를 찾을 수 없습니다",
      };
    }

    const family = families[0];

    // 초대장 생성 (24시간 유효)
    const requestBody: CreateInvitationRequest = {
      expiresInHours: 24
    };

    const invitation = await apiPost<InvitationResponse>(
      `/invitations/families/${family.uuid}`,
      requestBody,
      { token: session.user.accessToken }
    );

    // 초대 링크 URL 생성
    const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";
    const inviteUrl = `${baseUrl}/invite/${invitation.token}`;

    const now = new Date();
    const expiresAt = new Date(invitation.expiresAt);
    const isExpired = now > expiresAt;
    const isUsed = invitation.status === "ACCEPTED";

    return {
      success: true,
      invitation: {
        uuid: invitation.uuid,
        token: invitation.token,
        expiresAt,
        createdAt: new Date(invitation.createdAt),
        isExpired,
        isUsed,
        inviteUrl,
      },
      message: "초대 링크가 생성되었습니다",
    };
  } catch (error) {
    console.error("Failed to create invitation:", error);
    if (error instanceof ApiError) {
      return {
        success: false,
        message: error.message,
      };
    }
    return {
      success: false,
      message: "초대 링크 생성에 실패했습니다",
    };
  }
}

/**
 * 활성 초대 링크 목록 조회
 */
export async function getActiveInvitations(): Promise<InvitationInfo[]> {
  try {
    const session = await auth();
    if (!session?.user?.id || !session?.user?.accessToken) {
      return [];
    }

    // 사용자의 첫 번째 가족 정보 가져오기
    const families = await apiGet<FamilyResponse[]>(
      "/families",
      { token: session.user.accessToken }
    );

    if (!families || families.length === 0) {
      return [];
    }

    const family = families[0];

    // 활성 초대 목록 조회
    const invitations = await apiGet<InvitationResponse[]>(
      `/invitations/families/${family.uuid}`,
      { token: session.user.accessToken }
    );

    const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";
    const now = new Date();

    return invitations.map((inv) => {
      const expiresAt = new Date(inv.expiresAt);
      return {
        uuid: inv.uuid,
        token: inv.token,
        expiresAt,
        createdAt: new Date(inv.createdAt),
        isExpired: now > expiresAt || inv.status === "EXPIRED",
        isUsed: inv.status === "ACCEPTED",
        inviteUrl: `${baseUrl}/invite/${inv.token}`,
      };
    });
  } catch (error) {
    console.error("Failed to get invitations:", error);
    return [];
  }
}

/**
 * 초대 링크 삭제 (취소)
 */
export async function deleteInvitation(
  invitationUuid: string
): Promise<{
  success: boolean;
  message: string;
}> {
  try {
    const session = await auth();
    if (!session?.user?.id || !session?.user?.accessToken) {
      return {
        success: false,
        message: "로그인이 필요합니다",
      };
    }

    // 초대 취소 (DELETE)
    await apiDelete(
      `/invitations/${invitationUuid}`,
      { token: session.user.accessToken }
    );

    revalidatePath("/");

    return {
      success: true,
      message: "초대 링크가 삭제되었습니다",
    };
  } catch (error) {
    console.error("Failed to delete invitation:", error);
    if (error instanceof ApiError) {
      return {
        success: false,
        message: error.message,
      };
    }
    return {
      success: false,
      message: "초대 링크 삭제에 실패했습니다",
    };
  }
}

/**
 * 초대 수락
 */
export async function acceptInvitation(
  token: string
): Promise<{
  success: boolean;
  message: string;
  familyUuid?: string;
}> {
  try {
    const session = await auth();
    if (!session?.user?.id || !session?.user?.accessToken) {
      return {
        success: false,
        message: "로그인이 필요합니다",
      };
    }

    // 초대 수락
    const requestBody: AcceptInvitationRequest = {
      token
    };

    await apiPost(
      `/invitations/accept`,
      requestBody,
      { token: session.user.accessToken }
    );

    revalidatePath("/");

    return {
      success: true,
      message: "초대를 수락했습니다",
    };
  } catch (error) {
    console.error("Failed to accept invitation:", error);
    if (error instanceof ApiError) {
      return {
        success: false,
        message: error.message,
      };
    }
    return {
      success: false,
      message: "초대 수락에 실패했습니다",
    };
  }
}

/**
 * 초대 정보 조회 (토큰으로)
 */
export async function getInvitationInfo(token: string): Promise<{
  valid: boolean;
  familyName?: string;
  expiresAt?: Date;
  message?: string;
}> {
  try {
    // 초대 정보 조회 (인증 불필요 - 백엔드에서 공개 엔드포인트로 설정됨)
    const invitation = await apiGet<InvitationResponse>(
      `/invitations/token/${token}`
    );

    if (!invitation || invitation.status === "EXPIRED" || invitation.status === "CANCELLED") {
      return {
        valid: false,
        message: invitation.status === "EXPIRED" ? "만료된 초대장입니다" : "취소된 초대장입니다",
      };
    }

    if (invitation.status === "ACCEPTED") {
      return {
        valid: false,
        message: "이미 사용된 초대장입니다",
      };
    }

    const expiresAt = new Date(invitation.expiresAt);
    const now = new Date();
    if (now > expiresAt) {
      return {
        valid: false,
        message: "만료된 초대장입니다",
      };
    }

    return {
      valid: true,
      familyName: invitation.familyName || "가족",
      expiresAt,
    };
  } catch (error) {
    console.error("Failed to get invitation info:", error);
    return {
      valid: false,
      message: "초대 정보를 가져오는데 실패했습니다",
    };
  }
}
