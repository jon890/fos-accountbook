import { serverEnv } from "@/lib/env/server.env";
import { ActionError } from "@/lib/errors";
import {
  invitationListSchema,
  invitationSchema,
} from "@/lib/schemas/responses/invitation";
import { serverApiClient, serverApiDelete, serverApiGet, serverApiPost } from "@/lib/server/api/client";
import { validateResponse } from "@/lib/server/api/validate-response";
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
  const invitation = await serverApiPost<InvitationResponse>(
    `/invitations/families/${familyUuid}`,
    requestBody,
    { schema: invitationSchema }
  );

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
  const invitations = await serverApiGet<InvitationResponse[]>(
    `/invitations/families/${familyUuid}`,
    { schema: invitationListSchema }
  );

  const now = new Date();
  return invitations.map((inv) => toInvitationInfo(inv, now));
}

export async function assertInvitationOwnership(
  familyUuid: string,
  invitationUuid: string
): Promise<void> {
  const active = await getActiveInvitations(familyUuid);
  if (!active.some((inv) => inv.uuid === invitationUuid)) {
    throw ActionError.entityNotFound("초대 링크", invitationUuid);
  }
}

export interface InvitationInfoData {
  valid: boolean;
  familyName?: string;
  expiresAt?: Date;
  message?: string;
  inviterName?: string;
  inviterAvatarUrl?: string | null;
  memberCount?: number;
}

export async function getInvitationInfo(
  token: string
): Promise<InvitationInfoData> {
  if (!token || token.trim().length === 0) {
    throw ActionError.invalidInput("초대 토큰", token, "토큰은 필수입니다");
  }

  // 공개 조회라 인증 헤더 없이 serverApiClient 를 직접 부르고, data 는 같은 스키마로 검증한다 (ADR-F42).
  const invitationResponse = await serverApiClient<{ data: unknown }>(
    `/invitations/token/${token}`,
    { method: "GET", skipAuth: true }
  );
  // 초대 토큰은 UUID 가 아니라 경로 템플릿 치환에 걸리지 않으므로, 로그에 남지 않게 템플릿을 직접 넘긴다.
  const invitation = validateResponse(
    "/invitations/token/:token",
    invitationSchema,
    invitationResponse.data
  );

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

  const inviterName = invitation.inviter?.name;

  return {
    valid: true,
    familyName: invitation.familyName || "가족",
    expiresAt,
    ...(inviterName ? { inviterName } : {}),
    inviterAvatarUrl: invitation.inviter?.avatarUrl ?? null,
    ...(typeof invitation.memberCount === "number"
      ? { memberCount: invitation.memberCount }
      : {}),
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
