import { serverEnv } from "@/lib/env/server.env";
import { ActionError } from "@/lib/errors";
import { serverApiClient, serverApiDelete, serverApiGet, serverApiPost } from "@/lib/server/api/client";
import type {
  AcceptInvitationRequest,
  CreateInvitationRequest,
  InvitationInfo,
  InvitationResponse,
} from "@/types/invitation";

function toInvitationInfo(
  inv: InvitationResponse,
  now: Date
): InvitationInfo {
  const expiresAt = new Date(inv.expiresAt);
  return {
    uuid: inv.uuid,
    token: inv.token,
    expiresAt,
    createdAt: new Date(inv.createdAt),
    isExpired: now > expiresAt || inv.status === "EXPIRED",
    isUsed: inv.status === "ACCEPTED",
    inviteUrl: `${serverEnv.AUTH_URL}/invite/${inv.token}`,
  };
}

export async function createInvitationLink(
  familyUuid: string
): Promise<InvitationInfo> {
  const requestBody: CreateInvitationRequest = { expiresInHours: 24 };
  const invitation = await serverApiPost<InvitationResponse>(`/invitations/families/${familyUuid}`, requestBody);

  const now = new Date();
  const expiresAt = new Date(invitation.expiresAt);

  return {
    uuid: invitation.uuid,
    token: invitation.token,
    expiresAt,
    createdAt: new Date(invitation.createdAt),
    isExpired: now > expiresAt,
    isUsed: invitation.status === "ACCEPTED",
    inviteUrl: `${serverEnv.AUTH_URL}/invite/${invitation.token}`,
  };
}

export async function getActiveInvitations(
  familyUuid: string
): Promise<InvitationInfo[]> {
  const invitations = await serverApiGet<InvitationResponse[]>(`/invitations/families/${familyUuid}`);

  const now = new Date();
  return invitations.map((inv) => toInvitationInfo(inv, now));
}

export interface InvitationInfoData {
  valid: boolean;
  familyName?: string;
  expiresAt?: Date;
  message?: string;
}

export async function getInvitationInfo(
  token: string
): Promise<InvitationInfoData> {
  if (!token || token.trim().length === 0) {
    throw ActionError.invalidInput("초대 토큰", token, "토큰은 필수입니다");
  }

  const invitationResponse = await serverApiClient<{
    data: InvitationResponse;
  }>(`/invitations/token/${token}`, {
    method: "GET",
    skipAuth: true,
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
    return { valid: false, message: "이미 사용된 초대장입니다" };
  }

  const expiresAt = new Date(invitation.expiresAt);
  const now = new Date();
  if (now > expiresAt) {
    return { valid: false, message: "만료된 초대장입니다" };
  }

  return {
    valid: true,
    familyName: invitation.familyName || "가족",
    expiresAt,
  };
}

export async function acceptInvitation(token: string): Promise<void> {
  if (!token || token.trim().length === 0) {
    throw ActionError.invalidInput("초대 토큰", token, "토큰은 필수입니다");
  }

  const requestBody: AcceptInvitationRequest = { token };
  await serverApiPost<void>(`/invitations/accept`, requestBody);
}

export async function deleteInvitation(invitationUuid: string): Promise<void> {
  if (!invitationUuid || invitationUuid.trim().length === 0) {
    throw ActionError.invalidInput(
      "초대 UUID",
      invitationUuid,
      "UUID는 필수입니다"
    );
  }

  await serverApiDelete<void>(`/invitations/${invitationUuid}`);
}
