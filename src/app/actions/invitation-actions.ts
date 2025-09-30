/**
 * Invitation Server Actions
 * 초대 링크 관련 Server Actions
 */

"use server";

import { auth } from "@/lib/auth";
import { container } from "@/container";
import { revalidatePath } from "next/cache";

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
    if (!session?.user?.id) {
      return {
        success: false,
        message: "로그인이 필요합니다",
      };
    }

    const familyService = container.getFamilyService();
    const userService = container.getUserRepository();
    const invitationService = container.getInvitationService();

    // 사용자 UUID 가져오기
    const user = await userService.findByAuthId(session.user.id);
    if (!user) {
      return {
        success: false,
        message: "사용자 정보를 찾을 수 없습니다",
      };
    }

    // 가족 정보 가져오기 (이미 user를 조회했으므로 userUuid로 직접 조회)
    const family = await familyService.getFamilyByUserUuid(user.uuid);
    if (!family) {
      return {
        success: false,
        message: "가족 정보를 찾을 수 없습니다",
      };
    }

    // 초대 링크 생성 (24시간 유효)
    const invitation = await invitationService.createInvitation(
      family.uuid,
      user.uuid,
      24
    );

    // 초대 링크 URL 생성
    const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";
    const inviteUrl = `${baseUrl}/invite/${invitation.token}`;

    const now = new Date();
    const isExpired = now > invitation.expiresAt;
    const isUsed = !!invitation.usedAt;

    return {
      success: true,
      invitation: {
        uuid: invitation.uuid,
        token: invitation.token,
        expiresAt: invitation.expiresAt,
        createdAt: invitation.createdAt,
        isExpired,
        isUsed,
        inviteUrl,
      },
      message: "초대 링크가 생성되었습니다",
    };
  } catch (error) {
    console.error("Failed to create invitation:", error);
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

    const familyService = container.getFamilyService();
    const invitationService = container.getInvitationService();

    // 가족 정보 가져오기
    const family = await familyService.getFamilyByUserId(session.user.id);
    if (!family) {
      return [];
    }

    // 활성 초대 목록
    const invitations = await invitationService.getActiveInvitations(
      family.uuid
    );

    const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";
    const now = new Date();

    return invitations.map((inv) => ({
      uuid: inv.uuid,
      token: inv.token,
      expiresAt: inv.expiresAt,
      createdAt: inv.createdAt,
      isExpired: now > inv.expiresAt,
      isUsed: !!inv.usedAt,
      inviteUrl: `${baseUrl}/invite/${inv.token}`,
    }));
  } catch (error) {
    console.error("Failed to get invitations:", error);
    return [];
  }
}

/**
 * 초대 링크 삭제
 */
export async function deleteInvitation(
  invitationUuid: string
): Promise<{
  success: boolean;
  message: string;
}> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return {
        success: false,
        message: "로그인이 필요합니다",
      };
    }

    const userService = container.getUserRepository();
    const invitationService = container.getInvitationService();

    // 사용자 UUID 가져오기
    const user = await userService.findByAuthId(session.user.id);
    if (!user) {
      return {
        success: false,
        message: "사용자 정보를 찾을 수 없습니다",
      };
    }

    // 초대 삭제
    await invitationService.deleteInvitation(invitationUuid, user.uuid);

    revalidatePath("/");

    return {
      success: true,
      message: "초대 링크가 삭제되었습니다",
    };
  } catch (error) {
    console.error("Failed to delete invitation:", error);
    const errorMessage =
      error instanceof Error ? error.message : "초대 링크 삭제에 실패했습니다";
    return {
      success: false,
      message: errorMessage,
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
    if (!session?.user?.id) {
      return {
        success: false,
        message: "로그인이 필요합니다",
      };
    }

    const invitationService = container.getInvitationService();

    // 초대 수락
    const result = await invitationService.acceptInvitation(
      token,
      session.user.id
    );

    if (result.success) {
      revalidatePath("/");
    }

    return result;
  } catch (error) {
    console.error("Failed to accept invitation:", error);
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
  inviterName?: string;
  expiresAt?: Date;
  message?: string;
}> {
  try {
    const invitationService = container.getInvitationService();
    const familyService = container.getFamilyService();

    // 초대 유효성 검증
    const validation = await invitationService.validateInvitation(token);

    if (!validation.valid || !validation.invitation) {
      return {
        valid: false,
        message: validation.reason,
      };
    }

    // 가족 정보 조회 (UUID로)
    const family = await familyService.getFamilyByUuid(
      validation.invitation.familyUuid
    );

    if (!family) {
      return {
        valid: false,
        message: "가족 정보를 찾을 수 없습니다",
      };
    }

    // 초대자 정보 찾기
    const inviter = family.members.find(
      (m) => m.user.id === validation.invitation?.createdByUuid
    );

    return {
      valid: true,
      familyName: family.name,
      inviterName: inviter?.user.name || "알 수 없음",
      expiresAt: validation.invitation.expiresAt,
    };
  } catch (error) {
    console.error("Failed to get invitation info:", error);
    return {
      valid: false,
      message: "초대 정보를 가져오는데 실패했습니다",
    };
  }
}
