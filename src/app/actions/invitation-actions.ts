/**
 * Invitation Server Actions
 * 백엔드 API를 호출하여 초대 링크 관리
 */

"use server";

import { serverEnv } from "@/lib/env/server.env";
import { serverApiClient, ServerApiError } from "@/lib/server/api/client";
import { auth } from "@/lib/server/auth";
import type {
  CreateInvitationResult,
  InvitationActionResult,
  InvitationInfo,
  InvitationInfoResult,
} from "@/types/actions";
import type {
  AcceptInvitationRequest,
  CreateInvitationRequest,
  FamilyResponse,
  InvitationResponse,
} from "@/types/api";
import { revalidatePath } from "next/cache";

/**
 * 초대 링크 생성
 */
export async function createInvitationLink(): Promise<CreateInvitationResult> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return {
        success: false,
        message: "로그인이 필요합니다",
      };
    }

    // 사용자의 첫 번째 가족 정보 가져오기
    const familiesResponse = await serverApiClient<{ data: FamilyResponse[] }>(
      "/families",
      { method: "GET" }
    );
    const families = familiesResponse.data;

    if (!families || families.length === 0) {
      return {
        success: false,
        message: "가족 정보를 찾을 수 없습니다",
      };
    }

    const family = families[0];

    // 초대장 생성 (24시간 유효)
    const requestBody: CreateInvitationRequest = {
      expiresInHours: 24,
    };

    const invitationResponse = await serverApiClient<{
      data: InvitationResponse;
    }>(`/invitations/families/${family.uuid}`, {
      method: "POST",
      body: JSON.stringify(requestBody),
    });
    const invitation = invitationResponse.data;

    // 초대 링크 URL 생성
    const inviteUrl = `${serverEnv.NEXTAUTH_URL}/invite/${invitation.token}`;

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
    if (error instanceof ServerApiError) {
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
    if (!session?.user?.id) {
      return [];
    }

    // 사용자의 첫 번째 가족 정보 가져오기
    const familiesResponse = await serverApiClient<{ data: FamilyResponse[] }>(
      "/families",
      { method: "GET" }
    );
    const families = familiesResponse.data;

    if (!families || families.length === 0) {
      return [];
    }

    const family = families[0];

    // 활성 초대 목록 조회
    const invitationsResponse = await serverApiClient<{
      data: InvitationResponse[];
    }>(`/invitations/families/${family.uuid}`, { method: "GET" });
    const invitations = invitationsResponse.data;

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
        inviteUrl: `${serverEnv.NEXTAUTH_URL}/invite/${inv.token}`,
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
): Promise<InvitationActionResult> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return {
        success: false,
        message: "로그인이 필요합니다",
      };
    }

    // 초대 취소 (DELETE)
    await serverApiClient(`/invitations/${invitationUuid}`, {
      method: "DELETE",
    });

    revalidatePath("/");

    return {
      success: true,
      message: "초대 링크가 삭제되었습니다",
    };
  } catch (error) {
    console.error("Failed to delete invitation:", error);
    if (error instanceof ServerApiError) {
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
): Promise<InvitationActionResult> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return {
        success: false,
        message: "로그인이 필요합니다",
      };
    }

    // 초대 수락
    const requestBody: AcceptInvitationRequest = {
      token,
    };

    await serverApiClient(`/invitations/accept`, {
      method: "POST",
      body: JSON.stringify(requestBody),
    });

    revalidatePath("/");

    return {
      success: true,
      message: "초대를 수락했습니다",
    };
  } catch (error) {
    console.error("Failed to accept invitation:", error);
    if (error instanceof ServerApiError) {
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
export async function getInvitationInfo(
  token: string
): Promise<InvitationInfoResult> {
  try {
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
      return {
        valid: false,
        message:
          invitation.status === "EXPIRED"
            ? "만료된 초대장입니다"
            : "취소된 초대장입니다",
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
