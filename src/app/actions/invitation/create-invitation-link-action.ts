/**
 * 초대 링크 생성 Server Action
 */

"use server";

import { serverEnv } from "@/lib/env/server.env";
import {
  ActionError,
  handleActionError,
  successResult,
  type ActionResult,
} from "@/lib/errors";
import { serverApiClient } from "@/lib/server/api/client";
import {
  requireAuth,
  getSelectedFamilyUuid,
} from "@/lib/server/auth/auth-helpers";
import type { InvitationInfo } from "@/types/invitation";
import type {
  CreateInvitationRequest,
  InvitationResponse,
} from "@/types/invitation";
import type { FamilyResponse } from "@/types/family";

export async function createInvitationLinkAction(): Promise<
  ActionResult<InvitationInfo>
> {
  try {
    // 인증 확인
    await requireAuth();

    // 선택된 가족 UUID 가져오기
    let familyUuid = await getSelectedFamilyUuid();

    // 선택된 가족이 없으면 첫 번째 가족 사용
    if (!familyUuid) {
      const familiesResponse = await serverApiClient<{
        data: FamilyResponse[];
      }>("/families", { method: "GET" });
      const families = familiesResponse.data;

      if (!families || families.length === 0) {
        throw ActionError.entityNotFound("가족");
      }

      familyUuid = families[0].uuid;
    }

    // 초대장 생성 (24시간 유효)
    const requestBody: CreateInvitationRequest = {
      expiresInHours: 24,
    };

    const invitationResponse = await serverApiClient<{
      data: InvitationResponse;
    }>(`/invitations/families/${familyUuid}`, {
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

    return successResult({
      uuid: invitation.uuid,
      token: invitation.token,
      expiresAt,
      createdAt: new Date(invitation.createdAt),
      isExpired,
      isUsed,
      inviteUrl,
    });
  } catch (error) {
    console.error("Failed to create invitation:", error);
    return handleActionError(error, "초대 링크 생성에 실패했습니다");
  }
}
